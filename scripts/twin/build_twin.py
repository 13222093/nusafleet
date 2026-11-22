"""Blender scene for the 3D twin: relief model of North Maluku plus five hulls.

Run headless with Blender 4.5:
    blender -b --factory-startup --python scripts/twin/build_twin.py -- <build_dir> <out.glb>

<build_dir> comes from make_dem.py (heights.npy, land_color.png, frame.json).
Units: 1 Blender unit = 1 km. Z up here; the glTF exporter turns it into Y up,
so a point (lat, lon) lands at x = (lon - lon0) * kx, z = -(lat - lat0) * ky on the web.
Hulls are modelled 1 unit long, bow towards +X, waterline at Z = 0.
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
BUILD = Path(argv[0])
OUT = Path(argv[1])
FRAME = json.loads((BUILD / "frame.json").read_text())
KX = 111.32 * math.cos(math.radians(FRAME["lat0"]))
KY = 110.574
VEX = FRAME["vertical_exaggeration"]
SEA_Z = -0.35  # sea cells sink below the water plane so the coast reads crisp

bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, rough=0.9, image=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    if image is not None:
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def srgb(hex_code):
    h = hex_code.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ---------------------------------------------------------------- terrain
def build_terrain():
    z = np.load(BUILD / "heights.npy")
    rows, cols = z.shape
    land = z > 0.5
    lon = FRAME["lon_min"] + (np.arange(cols) + 0.5) / cols * (FRAME["lon_max"] - FRAME["lon_min"])
    lat = FRAME["lat_max"] - (np.arange(rows) + 0.5) / rows * (FRAME["lat_max"] - FRAME["lat_min"])

    # Keep a cell if any corner is land; sea corners sink to SEA_Z
    keep = land[:-1, :-1] | land[1:, :-1] | land[:-1, 1:] | land[1:, 1:]
    used = np.zeros_like(land)
    used[:-1, :-1] |= keep
    used[1:, :-1] |= keep
    used[:-1, 1:] |= keep
    used[1:, 1:] |= keep
    index = -np.ones(z.shape, dtype=np.int64)
    rr, cc = np.nonzero(used)
    index[rr, cc] = np.arange(len(rr))
    heights = np.where(land[rr, cc], z[rr, cc] / 1000.0 * VEX, SEA_Z)
    verts = np.column_stack([(lon[cc] - FRAME["lon0"]) * KX, (lat[rr] - FRAME["lat0"]) * KY, heights])
    uvs = np.column_stack([(cc + 0.5) / cols, 1.0 - (rr + 0.5) / rows])

    fr, fc = np.nonzero(keep)
    quads = np.column_stack([index[fr, fc], index[fr + 1, fc], index[fr + 1, fc + 1], index[fr, fc + 1]])

    mesh = bpy.data.meshes.new("terrain")
    mesh.vertices.add(len(verts))
    mesh.vertices.foreach_set("co", verts.astype(np.float32).ravel())
    mesh.loops.add(quads.size)
    mesh.loops.foreach_set("vertex_index", quads.astype(np.int32).ravel())
    mesh.polygons.add(len(quads))
    mesh.polygons.foreach_set("loop_start", np.arange(0, quads.size, 4, dtype=np.int32))
    mesh.polygons.foreach_set("loop_total", np.full(len(quads), 4, dtype=np.int32))
    uv = mesh.uv_layers.new(name="UVMap")
    uv.data.foreach_set("uv", uvs[quads.ravel()].astype(np.float32).ravel())
    mesh.update(calc_edges=True)
    mesh.validate()

    obj = bpy.data.objects.new("terrain", mesh)
    bpy.context.collection.objects.link(obj)
    img = bpy.data.images.load(str(BUILD / "land_color.png"))
    obj.data.materials.append(material("land", (1, 1, 1), 1.0, img))
    for p in mesh.polygons:
        p.use_smooth = True

    dec = obj.modifiers.new("decimate", "DECIMATE")
    dec.ratio = 0.32
    print("terrain cells", len(quads))
    return obj


# ---------------------------------------------------------------- hulls
HULL = material("hull", srgb("#f4f2ee"), 0.7)
HULL_OLD = material("hull_old", srgb("#c9c3b8"), 0.85)
DECK = material("deck", srgb("#8f8a80"), 0.9)
GLASS = material("glass", srgb("#2a2a28"), 0.3)
ACCENT = material("accent", srgb("#1c1b19"), 0.6)  # recoloured per vessel type on the web


def add_obj(name, bm, mats, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    for m in mats:
        obj.data.materials.append(m)
    bpy.context.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def hull_shell(length, beam, freeboard, draft, bow, y_off=0.0, mat_index=0):
    """Half-breadth tapers to a point over the last `bow` share of the length; V-shaped bottom."""
    bm = bmesh.new()
    stations = 14
    rings = []
    for i in range(stations + 1):
        s = i / stations
        x = -length / 2 + s * length
        taper = 1.0 if s < 1 - bow else max(0.04, (1 - s) / bow) ** 0.75
        stern = 0.92 if s < 0.04 else 1.0
        b = beam / 2 * taper * stern
        sheer = freeboard * (1.0 + 0.35 * max(0.0, s - 0.7) / 0.3)
        ring = [
            bm.verts.new((x, y_off - b, sheer)),
            bm.verts.new((x, y_off - b * 0.62, -draft * 0.75)),
            bm.verts.new((x, y_off, -draft)),
            bm.verts.new((x, y_off + b * 0.62, -draft * 0.75)),
            bm.verts.new((x, y_off + b, sheer)),
        ]
        rings.append(ring)
    for a, b in zip(rings[:-1], rings[1:]):
        for k in range(4):
            bm.faces.new((a[k], b[k], b[k + 1], a[k + 1])).material_index = mat_index
        bm.faces.new((a[4], b[4], b[0], a[0])).material_index = 2  # deck
    bm.faces.new(tuple(reversed(rings[0]))).material_index = mat_index
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def box(bm, center, size, mat_index):
    geom = bmesh.ops.create_cube(bm, size=1.0)
    verts = geom["verts"]
    bmesh.ops.scale(bm, vec=size, verts=verts)
    bmesh.ops.translate(bm, vec=center, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mat_index


def funnel(bm, center, radius, height, mat_index):
    geom = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=radius, radius2=radius * 0.85, depth=height)
    bmesh.ops.translate(bm, vec=(center[0], center[1], center[2] + height / 2), verts=geom["verts"])
    for f in {f for v in geom["verts"] for f in v.link_faces}:
        f.material_index = mat_index


# material slots: 0 hull, 1 glass, 2 deck, 3 accent
def build_hull(kind):
    hull_mat = HULL_OLD if kind == "diesel_old" else HULL
    mats = [hull_mat, GLASS, DECK, ACCENT]
    if kind == "fastcraft":
        bm = bmesh.new()
        for side in (-0.13, 0.13):
            part = hull_shell(1.0, 0.09, 0.05, 0.05, 0.35, y_off=side)
            mesh = bpy.data.meshes.new("tmp")
            part.to_mesh(mesh)
            part.free()
            bm.from_mesh(mesh)
            bpy.data.meshes.remove(mesh)
        box(bm, (-0.02, 0, 0.07), (0.78, 0.32, 0.04), 0)  # bridging deck
        box(bm, (0.02, 0, 0.12), (0.5, 0.26, 0.07), 0)  # cabin
        box(bm, (0.05, 0, 0.125), (0.42, 0.27, 0.03), 1)  # window band
        box(bm, (0.24, 0, 0.12), (0.06, 0.2, 0.05), 1)  # wheelhouse glass
        box(bm, (-0.36, 0, 0.11), (0.06, 0.3, 0.02), 3)  # stern accent
        return add_obj(f"hull_{kind}", bm, mats)

    bm = hull_shell(1.0, 0.24, 0.07, 0.07, 0.22)
    box(bm, (-0.02, 0, 0.09), (0.86, 0.22, 0.04), 0)  # car deck casing
    if kind == "diesel_old":
        box(bm, (-0.12, 0, 0.15), (0.42, 0.2, 0.08), 0)
        box(bm, (-0.12, 0, 0.155), (0.42, 0.205, 0.025), 1)
        box(bm, (-0.05, 0, 0.21), (0.14, 0.18, 0.05), 0)
        box(bm, (0.0, 0, 0.215), (0.04, 0.185, 0.02), 1)
        funnel(bm, (-0.27, 0, 0.19), 0.035, 0.11, 3)
    elif kind == "diesel_new":
        box(bm, (-0.08, 0, 0.15), (0.5, 0.21, 0.08), 0)
        box(bm, (-0.08, 0, 0.155), (0.5, 0.215, 0.024), 1)
        box(bm, (0.06, 0, 0.21), (0.16, 0.2, 0.05), 0)
        box(bm, (0.13, 0, 0.215), (0.03, 0.205, 0.022), 1)
        funnel(bm, (-0.25, 0, 0.19), 0.03, 0.09, 3)
    elif kind == "hybrid":
        box(bm, (-0.08, 0, 0.15), (0.5, 0.21, 0.08), 0)
        box(bm, (-0.08, 0, 0.155), (0.5, 0.215, 0.024), 1)
        box(bm, (0.06, 0, 0.21), (0.16, 0.2, 0.05), 0)
        box(bm, (0.13, 0, 0.215), (0.03, 0.205, 0.022), 1)
        box(bm, (-0.15, 0, 0.195), (0.26, 0.19, 0.012), 3)  # battery roof
        funnel(bm, (-0.3, 0, 0.19), 0.022, 0.05, 0)
    elif kind == "electric":
        box(bm, (-0.04, 0, 0.145), (0.62, 0.21, 0.07), 0)
        box(bm, (-0.04, 0, 0.15), (0.62, 0.215, 0.022), 1)
        box(bm, (0.12, 0, 0.2), (0.14, 0.19, 0.045), 0)
        box(bm, (0.18, 0, 0.205), (0.025, 0.195, 0.02), 1)
        box(bm, (-0.12, 0, 0.187), (0.42, 0.2, 0.012), 3)  # battery and solar roof
    return add_obj(f"hull_{kind}", bm, mats)


terrain = build_terrain()
for i, kind in enumerate(["diesel_old", "diesel_new", "hybrid", "electric", "fastcraft"]):
    obj = build_hull(kind)
    obj.location = (0, -400 - i * 3, 0)  # parked outside the map; the web reads the mesh only

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(OUT),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_extras=True,
    export_yup=True,
    export_image_format="AUTO",
)
print("wrote", OUT)
