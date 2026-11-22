// The 3D twin: a relief model of North Maluku on a plinth (terrain and hulls
// modelled in Blender, scripts/twin), with the plan drawn onto it. Every mark
// maps to a field: route lines to fleet_plan, hull models to vessel_type and
// count, charger columns to kw_used against kw_available.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ElementRef, ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Html, Line, useGLTF, useProgress, useTexture } from '@react-three/drei';

import { NO_SERVICE_COLOR, UI, VESSEL_COLOR_MAP, VESSEL_DASH, VESSEL_ORDER } from '../colors';
import { num, t } from '../i18n';
import type { ChargerRow, FleetRow, Lang, Port, Route, VesselType } from '../types';
import { vesselShort } from '../components/MapView';
import { FRAME_SIZE, arcLatLon, toScene } from './geo';

const MODEL_URL = '/twin/twin.v2.glb';
const SEA_URL = '/twin/sea.v3.webp';
const KM_PER_MW = 2.4; // charger column height
const PLUG_IN = new Set(['hybrid', 'electric']);
const LOCAL_ROUTES = new Set(['TTE_TID', 'TTE_SOF']);
const LOCAL_PORTS = new Set(['TID', 'SOF']);

const HOME = { pos: [-4, 250, 236] as const, target: [-4, 0, 2] as const };

export interface TwinProps {
  lang: Lang;
  routes: Route[];
  ports: Port[];
  vesselTypes: VesselType[];
  fleet: FleetRow[];
  chargers: ChargerRow[];
  selectedRouteId: string | null;
  onRouteClick: (routeId: string) => void;
  view: 'plan' | 'today';
  onView: (view: 'plan' | 'today') => void;
  /** Ports joined to the Halmahera Utara supply in this scenario. */
  linkedPorts: string[];
  onMode: (mode: '2d' | '3d') => void;
  top: ReactNode;
}

interface Lane {
  route: Route;
  points: THREE.Vector3[];
  rows: FleetRow[];
  color: string;
  dash: number[] | null;
  mid: THREE.Vector3;
  lengthKm: number;
}

function useLanes(routes: Route[], ports: Port[], fleet: FleetRow[]): Lane[] {
  return useMemo(() => {
    const byId = new Map(ports.map((p) => [p.port_id, p]));
    return routes.flatMap((route, i) => {
      const a = byId.get(route.port_a);
      const b = byId.get(route.port_b);
      if (!a || !b) return [];
      const ll = arcLatLon([a.lat, a.lon], [b.lat, b.lon], i % 2 === 0 ? 0.16 : -0.16);
      const points = ll.map(([lat, lon]) => new THREE.Vector3(...toScene(lat, lon, 0.08)));
      const rows = fleet.filter((r) => r.route_id === route.route_id).sort((x, y) => y.daily_trips - x.daily_trips);
      const lead = rows[0]?.vessel_type;
      let lengthKm = 0;
      for (let k = 1; k < points.length; k += 1) lengthKm += points[k].distanceTo(points[k - 1]);
      return [{
        route,
        points,
        rows,
        color: lead ? VESSEL_COLOR_MAP[lead] : NO_SERVICE_COLOR,
        dash: lead ? VESSEL_DASH[lead] : [2, 3],
        mid: points[Math.floor(points.length / 2)],
        lengthKm,
      }];
    });
  }, [routes, ports, fleet]);
}

/* ------------------------------------------------------------------ model */

function Plinth() {
  const sea = useTexture(SEA_URL);
  sea.colorSpace = THREE.SRGBColorSpace;
  sea.anisotropy = 8;
  const { w, d, cx, cz } = FRAME_SIZE;
  return (
    <group>
      <mesh position={[cx, -1.3, cz]} receiveShadow>
        <boxGeometry args={[w, 2.56, d]} />
        <meshStandardMaterial color="#dfe6ea" roughness={1} />
      </mesh>
      <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial map={sea} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Terrain() {
  const { nodes } = useGLTF(MODEL_URL);
  const terrain = nodes.terrain as THREE.Mesh;
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const p = Math.min(1, (clock.elapsedTime - start.current) / 2.2);
    terrain.scale.y = 0.02 + 0.98 * (1 - (1 - p) ** 4);
  });
  useMemo(() => {
    const m = terrain.material as THREE.MeshStandardMaterial;
    m.roughness = 1;
    m.metalness = 0;
    m.side = THREE.FrontSide;
  }, [terrain]);
  return <primitive object={terrain} />;
}

/* ----------------------------------------------------------------- hulls */

function useHull(type: string): THREE.Object3D | null {
  const { nodes } = useGLTF(MODEL_URL);
  return useMemo(() => {
    const src = nodes[`hull_${type}`];
    if (!src) return null;
    // Hulls read as dark chart symbols on white water; the accent marks a plug-in hull
    const paint: Record<string, THREE.Material> = {
      hull: new THREE.MeshStandardMaterial({ color: '#27313a', roughness: 0.7 }),
      hull_old: new THREE.MeshStandardMaterial({ color: '#6c7a84', roughness: 0.85 }),
      deck: new THREE.MeshStandardMaterial({ color: '#dfe6ea', roughness: 0.9 }),
      glass: new THREE.MeshStandardMaterial({ color: '#dfe6ea', roughness: 0.4 }),
      accent: new THREE.MeshStandardMaterial({ color: PLUG_IN.has(type) ? UI.accent : '#0f1417', roughness: 0.6 }),
    };
    const copy = src.clone(true);
    // Keep the quantization offset glTF-Transform stored on the node; drop only the parking offset
    copy.position.set(src.position.x, src.position.y, 0);
    copy.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.renderOrder = 5;
        const mat = mesh.material as THREE.Material;
        if (paint[mat.name]) mesh.material = paint[mat.name];
      }
    });
    return copy;
  }, [nodes, type]);
}

function Vessel({ type, points, period, offset, still }: { type: string; points: THREE.Vector3[]; period: number; offset: number; still: boolean }) {
  const template = useHull(type);
  const object = useMemo(() => template?.clone(true) ?? null, [template]);
  const ref = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const g = ref.current;
    if (!g) return;
    const time = still ? 0 : clock.elapsedTime;
    const phase = (time / period + offset) % 2;
    const along = (phase <= 1 ? phase : 2 - phase) * (points.length - 1);
    const lo = Math.max(0, Math.min(Math.floor(along), points.length - 2));
    const f = along - lo;
    tmp.copy(points[lo]).lerp(points[lo + 1], f);
    g.position.set(tmp.x, 0.02, tmp.z);
    const dir = points[lo + 1].clone().sub(points[lo]);
    if (phase > 1) dir.negate();
    g.rotation.y = Math.atan2(-dir.z, dir.x);
    // Hulls stay readable at any zoom: size follows the camera distance
    const s = THREE.MathUtils.clamp(camera.position.distanceTo(g.position) * 0.021, 0.8, 6.5);
    g.scale.setScalar(s);
  });

  if (!object) return null;
  return (
    <group ref={ref}>
      <primitive object={object} />
    </group>
  );
}

function Fleet({ lanes, vesselTypes, still }: { lanes: Lane[]; vesselTypes: VesselType[]; still: boolean }) {
  return (
    <>
      {lanes.flatMap((lane, i) =>
        lane.rows.flatMap((row, r) => {
          const speed = vesselTypes.find((v) => v.type === row.vessel_type)?.speed_kn ?? 10;
          const period = 4 + 2.4 * (lane.route.distance_nm / speed);
          return Array.from({ length: Math.min(row.count, 3) }, (_u, k) => (
            <Vessel
              key={`${lane.route.route_id}-${row.vessel_type}-${k}`}
              type={row.vessel_type}
              points={lane.points}
              period={period}
              offset={k * (2 / Math.min(row.count, 3)) + r * 0.31 + i * 0.13}
              still={still}
            />
          ));
        }),
      )}
    </>
  );
}

/* ---------------------------------------------------------- routes, ports */

function FlowLine({ points }: { points: THREE.Vector3[] }) {
  const ref = useRef<ElementRef<typeof Line>>(null);
  useFrame((_s, dt) => {
    const m = ref.current?.material as { dashOffset: number } | undefined;
    if (m) m.dashOffset = (m.dashOffset - dt * 2.2) % 2.4;
  });
  return <Line ref={ref} points={points} color="#ffffff" lineWidth={1.4} dashed dashSize={0.7} gapSize={1.7} userData={{ layer: 3 }} />;
}

/** Route lines are printed on the chart: drawn in a fixed order over sea and relief, under hulls and ports. */
function useOverlay() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    ref.current?.traverse((o) => {
      if (o.type !== 'Line2') return;
      const m = (o as THREE.Mesh).material as THREE.Material;
      m.depthTest = false;
      m.depthWrite = false;
      o.renderOrder = (o.userData.layer as number | undefined) ?? 2;
    });
  });
  return ref;
}

function Lanes({ lanes, lang, selected, onClick }: { lanes: Lane[]; lang: Lang; selected: string | null; onClick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const overlay = useOverlay();
  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hover]);

  return (
    <group ref={overlay}>
      {lanes.map((lane) => {
        const id = lane.route.route_id;
        const on = id === selected || id === hover;
        const curve = new THREE.CatmullRomCurve3(lane.points);
        const mix = lane.rows.map((row) => `${row.count} ${vesselShort(row.vessel_type, lang)}`).join(' + ') || t(lang, 'none');
        return (
          <group key={id}>
            {/* Paper halo under the line so it reads over relief and sea alike */}
            <Line points={lane.points} color="#ffffff" lineWidth={on ? 9 : 6.5} userData={{ layer: 1 }} />
            <Line
              points={lane.points}
              color={on && !PLUG_IN.has(lane.rows[0]?.vessel_type ?? '') ? UI.ink : lane.color}
              lineWidth={on ? 4.2 : 3}
              dashed={lane.dash !== null}
              dashSize={lane.dash ? lane.dash[0] * 0.35 : 1}
              gapSize={lane.dash ? lane.dash[1] * 0.35 : 0}
            />
            {id === selected ? <FlowLine points={lane.points} /> : null}
            {/* Wide invisible tube: the click and hover target */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onClick(id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(id);
              }}
              onPointerOut={() => setHover((h) => (h === id ? null : h))}
            >
              <tubeGeometry args={[curve, 48, 1.8, 6, false]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Html position={[lane.mid.x, 1.2, lane.mid.z]} center zIndexRange={[20, 10]} className={`twin-tag${LOCAL_ROUTES.has(id) ? ' twin-local' : ''}${on ? ' is-on' : ''}`}>
              {on ? <b>{lane.route.name.replace(/ \([^)]*\)/g, '')}</b> : null}
              <span>{mix}</span>
              {on ? <span className="twin-tag-sub">{num(lang, lane.route.daily_pax)} {t(lang, 'paxPerDay')}, {num(lang, lane.route.distance_nm, 1)} nm</span> : null}
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// Placed clear of ports and route lanes; the strait name only shows once zoomed in
const WATERS: { id: string; en: string; lat: number; lon: number; big?: boolean; local?: boolean }[] = [
  { id: 'Laut Maluku', en: 'Molucca Sea', lat: 0.62, lon: 126.78, big: true },
  { id: 'Teluk Kao', en: 'Kao Bay', lat: 0.9, lon: 127.92 },
  { id: 'Selat Morotai', en: 'Morotai Strait', lat: 2.16, lon: 128.17, local: true },
];

function Waters({ lang }: { lang: Lang }) {
  return (
    <>
      {WATERS.map((w) => (
        <Html key={w.id} position={toScene(w.lat, w.lon, 0.2)} center zIndexRange={[8, 5]} className={`twin-water${w.big ? ' twin-water-big' : ''}${w.local ? ' twin-local' : ''}`}>
          {lang === 'id' ? w.id : w.en}
        </Html>
      ))}
    </>
  );
}

/** Degree ticks and labels on the plinth edge, like a chart's neatline. */
function Neatline({ lang }: { lang: Lang }) {
  const { w, d, cx, cz } = FRAME_SIZE;
  const south = cz + d / 2;
  const west = cx - w / 2;
  const ticks: { key: string; pos: [number, number, number]; text: string; lat: boolean }[] = [];
  const minutes = (v: number) => (v % 1 ? '30′' : '00′');
  for (let lon = 126.5; lon < 128.6; lon += 0.5) {
    const [x] = toScene(0, lon);
    ticks.push({ key: 'lon' + lon, pos: [x, 0.05, south], text: Math.floor(lon) + '°' + minutes(lon) + (lang === 'id' ? ' BT' : ' E'), lat: false });
  }
  for (let lat = 0.5; lat < 2.35; lat += 0.5) {
    const [, , z] = toScene(lat, 0);
    ticks.push({ key: 'lat' + lat, pos: [west, 0.05, z], text: Math.floor(lat) + '°' + minutes(lat) + (lang === 'id' ? ' LU' : ' N'), lat: true });
  }
  return (
    <>
      {ticks.map((tk) => (
        <group key={tk.key} position={tk.pos}>
          <mesh position={tk.lat ? [0.9, 0.01, 0] : [0, 0.01, -0.9]} rotation={[-Math.PI / 2, 0, tk.lat ? Math.PI / 2 : 0]} renderOrder={4}>
            <planeGeometry args={[0.25, 1.8]} />
            <meshBasicMaterial color={UI.ink} toneMapped={false} />
          </mesh>
          <Html center zIndexRange={[6, 4]} className={tk.lat ? 'twin-tick twin-tick-lat' : 'twin-tick'}>{tk.text}</Html>
        </group>
      ))}
    </>
  );
}

function Ports({ ports, linked }: { ports: Port[]; linked: Set<string> }) {
  return (
    <>
      {ports.map((p) => {
        const [x, , z] = toScene(p.lat, p.lon);
        return (
          <group key={p.port_id} position={[x, 0, z]}>
            <mesh position={[0, 0.15, 0]} renderOrder={5}>
              <cylinderGeometry args={[0.55, 0.55, 0.3, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
              <ringGeometry args={[0.55, 0.85, 32]} />
              <meshBasicMaterial color={UI.ink} toneMapped={false} />
            </mesh>
            {linked.has(p.port_id) ? (
              <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.6, 2.85, 48]} />
                <meshBasicMaterial color={UI.accent} transparent opacity={0.7} toneMapped={false} />
              </mesh>
            ) : null}
            <Html position={[0, 0.6, 0]} zIndexRange={[30, 20]} className={`twin-port${LOCAL_PORTS.has(p.port_id) ? ' twin-local' : ''}`}>
              {p.name.split(' (')[0]}
            </Html>
          </group>
        );
      })}
    </>
  );
}

function Charger({ port, row, lang }: { port: Port; row: ChargerRow | undefined; lang: Lang }) {
  const [x, , z] = toScene(port.lat, port.lon);
  const fill = useRef<THREE.Mesh>(null);
  const ghost = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const used = row ? (row.kw_used / 1000) * KM_PER_MW : 0;
  const cap = row ? (row.kw_available / 1000) * KM_PER_MW : 0;

  useFrame((_s, dt) => {
    const k = 1 - Math.exp(-dt * 3.2);
    for (const [ref, target] of [[fill, used], [ghost, cap]] as const) {
      const m = ref.current;
      if (!m) continue;
      const h = THREE.MathUtils.lerp(m.scale.y, Math.max(target, 0.0001), k);
      m.scale.y = h;
      m.position.y = h / 2;
      m.visible = h > 0.02;
    }
    if (label.current && fill.current) {
      label.current.style.opacity = row && fill.current.scale.y > used * 0.8 ? '1' : '0';
    }
  });

  return (
    <group position={[x + 1.6, 0, z - 1.6]}>
      <mesh ref={ghost} scale={[1, 0.0001, 1]} renderOrder={6}>
        <cylinderGeometry args={[1.7, 1.7, 1, 40, 1, true]} />
        <meshStandardMaterial color={UI.accent} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={fill} scale={[1, 0.0001, 1]} castShadow renderOrder={5}>
        <cylinderGeometry args={[1.25, 1.25, 1, 40]} />
        <meshStandardMaterial color={UI.accent} roughness={0.55} />
      </mesh>
      <Html position={[0, Math.max(cap, used) + 1.4, 0]} center zIndexRange={[40, 30]}>
        <div ref={label} className="twin-kw" style={{ opacity: 0 }}>
          {row ? `${num(lang, row.kw_used)} / ${num(lang, row.kw_available)} kW` : ''}
        </div>
      </Html>
    </group>
  );
}

/** Points the overlay's north arrow at true north as the camera orbits. */
function NorthArrow({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    camera.getWorldDirection(dir);
    const deg = (Math.atan2(dir.x, -dir.z) * 180) / Math.PI;
    if (target.current) target.current.style.transform = 'rotate(' + -deg + 'deg)';
  });
  return null;
}

/** Hides small-port and short-route labels when the camera is far out, as the 2D inset did. */
function LabelDensity() {
  const { camera, gl } = useThree();
  useFrame(() => {
    const far = camera.position.length() > 190;
    gl.domElement.parentElement?.parentElement?.classList.toggle('twin-far', far);
  });
  return null;
}

/** Home view, pulled back on portrait screens so the whole archipelago fits. */
function homeFor(aspect: number): [number, number, number, number, number, number] {
  const k = aspect < 1 ? Math.min(2.1, 1.25 / aspect) : 1;
  const [px, py, pz] = HOME.pos;
  const [tx, ty, tz] = HOME.target;
  return [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k, tx, ty, tz];
}

function Rig({ controls, focus, resetKey }: { controls: React.RefObject<ElementRef<typeof CameraControls> | null>; focus: Lane | null; resetKey: number }) {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (focus) {
      const box = new THREE.Box3().setFromPoints(focus.points);
      const center = box.getCenter(new THREE.Vector3());
      // Far enough that the 370 m relief grid never reads as blocks
      const dist = Math.max(70, focus.lengthKm * 1.9);
      void c.setLookAt(center.x, dist * 0.82, center.z + dist * 0.78, center.x, 0, center.z, true);
    }
  }, [controls, focus]);
  useEffect(() => {
    void controls.current?.setLookAt(...homeFor(aspect), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);
  useEffect(() => {
    const c = controls.current;
    if (!c || resetKey === 0) return;
    void c.setLookAt(...homeFor(aspect), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, resetKey]);
  return null;
}

/** Mounts only after every suspended asset has loaded; the first rendered frame ends the loader. */
function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}

function Scene(props: TwinProps & { resetKey: number; still: boolean; north: React.RefObject<HTMLDivElement | null> }) {
  const { lang, routes, ports, vesselTypes, fleet, chargers, selectedRouteId, onRouteClick, linkedPorts, resetKey, still, north } = props;
  const lanes = useLanes(routes, ports, fleet);
  const controls = useRef<ElementRef<typeof CameraControls>>(null);
  const focus = lanes.find((l) => l.route.route_id === selectedRouteId) ?? null;
  const linked = useMemo(() => new Set(linkedPorts), [linkedPorts]);
  const byPort = new Map(chargers.map((c) => [c.port_id, c]));

  return (
    <>
      <color attach="background" args={[UI.bg]} />
      <fog attach="fog" args={[UI.bg, 420, 760]} />
      <hemisphereLight args={['#ffffff', '#d8d3c8', 1.35]} />
      <directionalLight position={[-140, 190, -90]} intensity={1.9} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-150} shadow-camera-right={150} shadow-camera-top={120} shadow-camera-bottom={-120} shadow-camera-far={600} shadow-bias={-0.0004} />
      <CameraControls ref={controls} makeDefault minDistance={10} maxDistance={430} minPolarAngle={0.12} maxPolarAngle={1.22} smoothTime={0.45} draggingSmoothTime={0.12} />
      <Rig controls={controls} focus={focus} resetKey={resetKey} />
      <LabelDensity />
      <NorthArrow target={north} />
      <Plinth />
      <Terrain />
      <Lanes lanes={lanes} lang={lang} selected={selectedRouteId} onClick={onRouteClick} />
      <Neatline lang={lang} />
      <Waters lang={lang} />
      <Ports ports={ports} linked={linked} />
      {ports.map((p) => (
        <Charger key={p.port_id} port={p} row={byPort.get(p.port_id)} lang={lang} />
      ))}
      <Fleet lanes={lanes} vesselTypes={vesselTypes} still={still} />
    </>
  );
}

export default function TwinView(props: TwinProps) {
  const { lang, fleet, view, onView, onMode, top } = props;
  const [resetKey, setResetKey] = useState(0);
  const north = useRef<HTMLDivElement>(null);
  // Real download progress of the relief model and textures, shown until the scene is ready
  const { progress } = useProgress();
  const [ready, setReady] = useState(false);
  const loading = !ready;
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const usedTypes = VESSEL_ORDER.filter((type) => fleet.some((row) => row.vessel_type === type));

  return (
    <div className="map-stage twin-stage">
      <Canvas
        className="twin-canvas"
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.75]}
        camera={{ position: [...HOME.pos], fov: 30, near: 1, far: 1600 }}
        gl={{ antialias: true }}
        onCreated={(state) => {
          state.camera.lookAt(...HOME.target);
          if (import.meta.env.DEV) (window as unknown as { __twin: unknown }).__twin = state;
        }}
      >
        <Suspense fallback={null}>
          <Scene {...props} resetKey={resetKey} still={still} north={north} />
          <Ready onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>

      {loading ? (
        <div className="twin-loading" role="status">
          {t(lang, 'loadingModel')} <span>{Math.round(Math.min(progress, 99))}%</span>
        </div>
      ) : null}

      <div className="map-top">{top}</div>

      <div className="map-bottom">
        <div className="map-row">
          <div className="seg" role="group" aria-label={t(lang, 'showOnMap')}>
            <button type="button" aria-pressed={view === 'today'} onClick={() => onView('today')}>
              {t(lang, 'todayShort')}
            </button>
            <button type="button" aria-pressed={view === 'plan'} onClick={() => onView('plan')}>
              {t(lang, 'planShort')}
            </button>
          </div>
          <div className="seg" role="group" aria-label={t(lang, 'viewMode')}>
            <button type="button" aria-pressed={true}>{t(lang, 'view3d')}</button>
            <button type="button" aria-pressed={false} onClick={() => onMode('2d')}>{t(lang, 'view2d')}</button>
          </div>
          <button type="button" className="map-reset" onClick={() => setResetKey((k) => k + 1)} title={t(lang, 'resetView')} aria-label={t(lang, 'resetView')}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>
        <div className="map-legend">
          {usedTypes.map((type) => (
            <span key={type} className="legend-item">
              <svg width="22" height="6" aria-hidden="true">
                <line x1="1" y1="3" x2="21" y2="3" stroke={VESSEL_COLOR_MAP[type]} strokeWidth="2.2" strokeDasharray={VESSEL_DASH[type]?.map((v) => v * 0.7).join(' ')} />
              </svg>
              {vesselShort(type, lang)}
            </span>
          ))}
          <span className="legend-item">
            <span className="legend-column" />
            {t(lang, 'legendCharger')}
          </span>
          <span className="legend-item legend-note">{t(lang, 'hint3d')}</span>
        </div>
      </div>
      <div className="twin-north" aria-hidden="true">
        <div ref={north} className="twin-north-needle">
          <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13.5" fill="none" stroke="#0f1417" strokeWidth="0.8" /><path d="M15 3 19 15h-8Z" fill="#b5157a" /><path d="M15 27 11 15h8Z" fill="none" stroke="#0f1417" strokeWidth="0.8" /></svg>
        </div>
        <span>{lang === 'id' ? 'U' : 'N'}</span>
      </div>
      <div className="twin-credit">{lang === 'id' ? 'Relief Copernicus DEM GLO-90, skala tegak ×5' : 'Relief Copernicus DEM GLO-90, vertical scale ×5'}</div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
