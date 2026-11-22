# NusaFleet design: the chart that plans

## Concept card

- **Idea:** the plan is drawn on a nautical chart of North Maluku, and the chart updates as the supply changes.
- **Metaphor:** an Indonesian nautical chart (Pushidrosal, INT 1 symbols) laid on a chart table as a relief model.
- **Signature:** press Play. 2026 becomes 2027, then 2031, and the chart is corrected like a Notice to Mariners: magenta charging columns rise at Ternate, Jailolo and Tobelo, plug-in routes turn magenta, hulls change type.
- **Emotion:** a navigator's table, calm and exact.
- **Motion verb:** "corrected like a chart": lines are printed, columns rise, hulls sail at their own speed.
- **Screenshot:** the 2031 Cleanest plan from the south, three magenta columns with kW used against capacity.

Rejected territories: ferry ticket stubs (gimmick), split-flap departure boards (overused).

## System

| Role | Value | Source in the chart world |
| --- | --- | --- |
| ground | `#f4f7f8` | chart paper |
| deep water | `#fafcfc` | white deep water |
| shallow | `#c4e1f0` | shallow water tint near the coast |
| land | `#efdc9c` | buff land |
| ink | `#0f1417` | black chart ink |
| accent | `#b5157a` | chart magenta: lights, cables, what must not be missed |

- **Type:** Archivo variable (OFL). Condensed widths (72 to 80%) for display numbers and headings, normal width for text. Land names upright, water names italic and letter-spaced, as charts set them. No monospace labels.
- **Lines:** ferry routes are dashed like the chart symbol; the dash tells the hull type, and electric is the one solid line.
- **Shape:** radius 3 to 4 px, frames like chart insets, no card stacks.
- **3D:** terrain from Copernicus DEM GLO-90 (vertical scale x5) built in Blender by `scripts/twin/build_twin.py`; hulls are modelled in the same script. Route lines are drawn as a chart overlay (no depth test), hulls, ports and charging columns sit above them.

## Rebuild the model

```
uv run --no-project --with tifffile --with imagecodecs --with numpy --with pillow --with scipy python -I scripts/twin/make_dem.py <tiles> <build>
blender -b --factory-startup --python scripts/twin/build_twin.py -- <build> <build>/twin_raw.glb
npx @gltf-transform/cli@4.5.1 optimize <build>/twin_raw.glb dashboard/public/twin/twin.vN.glb --compress meshopt --texture-compress webp --texture-size 2048 --join false --join-named false --flatten false --instance false --palette false --simplify false
```

Bump the file version (`twin.vN.glb`, `sea.vN.webp`) and the constants in `dashboard/src/twin/TwinView.tsx` on every rebuild.
