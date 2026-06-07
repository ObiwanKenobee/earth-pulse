import { useEffect, useRef } from "react";
import * as THREE from "three";

type LayerKey =
  | "population"
  | "climate"
  | "energy"
  | "supply"
  | "biodiversity"
  | "water";

const LAYER_COLOR: Record<LayerKey, number> = {
  population: 0x6ee7ff,
  climate: 0xff7a59,
  energy: 0xffd166,
  supply: 0xa78bfa,
  biodiversity: 0x5eead4,
  water: 0x60a5fa,
};

// curated lat/lng hotspots for visual richness
const HOTSPOTS: { lat: number; lng: number; layer: LayerKey; mag: number; label: string }[] = [
  { lat: -1.29, lng: 36.82, layer: "climate", mag: 1.2, label: "Nairobi" },
  { lat: 1.29, lng: 103.85, layer: "supply", mag: 1.4, label: "Singapore" },
  { lat: 51.5, lng: -0.12, layer: "energy", mag: 1.0, label: "London" },
  { lat: 40.71, lng: -74.0, layer: "supply", mag: 1.3, label: "New York" },
  { lat: 35.68, lng: 139.69, layer: "population", mag: 1.4, label: "Tokyo" },
  { lat: 19.43, lng: -99.13, layer: "water", mag: 1.1, label: "Mexico City" },
  { lat: -23.55, lng: -46.63, layer: "biodiversity", mag: 1.2, label: "São Paulo" },
  { lat: 28.61, lng: 77.21, layer: "climate", mag: 1.5, label: "Delhi" },
  { lat: 30.04, lng: 31.23, layer: "water", mag: 1.2, label: "Cairo" },
  { lat: 55.75, lng: 37.61, layer: "energy", mag: 1.0, label: "Moscow" },
  { lat: -33.86, lng: 151.2, layer: "biodiversity", mag: 0.9, label: "Sydney" },
  { lat: 37.77, lng: -122.41, layer: "supply", mag: 1.1, label: "SF Bay" },
  { lat: -3.46, lng: -62.21, layer: "biodiversity", mag: 1.6, label: "Amazon" },
  { lat: 64.13, lng: -21.94, layer: "climate", mag: 0.8, label: "Reykjavik" },
  { lat: 22.32, lng: 114.17, layer: "population", mag: 1.3, label: "Hong Kong" },
  { lat: -34.6, lng: -58.38, layer: "energy", mag: 0.9, label: "Buenos Aires" },
  { lat: 6.52, lng: 3.38, layer: "population", mag: 1.3, label: "Lagos" },
  { lat: 48.85, lng: 2.35, layer: "energy", mag: 1.0, label: "Paris" },
  { lat: 31.23, lng: 121.47, layer: "supply", mag: 1.5, label: "Shanghai" },
  { lat: 25.27, lng: 55.3, layer: "water", mag: 1.2, label: "Dubai" },
];

function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function Globe({
  activeLayers,
  timeYear,
}: {
  activeLayers: LayerKey[];
  timeYear: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef(activeLayers);
  const yearRef = useRef(timeYear);

  useEffect(() => {
    layersRef.current = activeLayers;
  }, [activeLayers]);
  useEffect(() => {
    yearRef.current = timeYear;
  }, [timeYear]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 40 + Math.random() * 30;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
      starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      starPos[i * 3 + 2] = r * Math.cos(p);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xa8e3ff, size: 0.08, transparent: true, opacity: 0.7 }),
    );
    scene.add(stars);

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Core sphere — dark ocean
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.MeshPhongMaterial({
        color: 0x0a1a2a,
        emissive: 0x05101c,
        specular: 0x335577,
        shininess: 18,
      }),
    );
    earthGroup.add(core);

    // Wireframe continents / lat-lng grid feel
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.002, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x4fd1c5,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      }),
    );
    earthGroup.add(wire);

    // Land dots (fibonacci sphere) — pseudo-continent silhouette via noise threshold
    const dotCount = 5500;
    const dotPositions: number[] = [];
    const dotColors: number[] = [];
    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / dotCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      // pseudo-land mask
      const n =
        Math.sin(x * 4.3) * Math.cos(y * 3.1) +
        Math.sin(z * 5.7 + 1.2) * Math.cos(x * 2.4) +
        Math.sin((x + z) * 3.8);
      if (n > 0.35) {
        dotPositions.push(x * 1.005, y * 1.005, z * 1.005);
        const shade = 0.4 + Math.random() * 0.4;
        dotColors.push(0.3 * shade, 0.85 * shade, 0.75 * shade);
      }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute("color", new THREE.Float32BufferAttribute(dotColors, 3));
    const dots = new THREE.Points(
      dotGeo,
      new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.95 }),
    );
    earthGroup.add(dots);

    // Atmosphere glow
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        uniforms: { uColor: { value: new THREE.Color(0x4fd1c5) } },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          void main() {
            float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(uColor, 1.0) * intensity;
          }
        `,
      }),
    );
    earthGroup.add(atmosphere);

    // Hotspot pins (each layer gets its own group)
    const hotspotGroups: Record<LayerKey, THREE.Group> = {
      population: new THREE.Group(),
      climate: new THREE.Group(),
      energy: new THREE.Group(),
      supply: new THREE.Group(),
      biodiversity: new THREE.Group(),
      water: new THREE.Group(),
    };
    (Object.keys(hotspotGroups) as LayerKey[]).forEach((k) => earthGroup.add(hotspotGroups[k]));

    HOTSPOTS.forEach((h) => {
      const pos = latLngToVec3(h.lat, h.lng, 1.01);
      const color = LAYER_COLOR[h.layer];

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.012 * h.mag, 12, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      pin.position.copy(pos);
      hotspotGroups[h.layer].add(pin);

      // Vertical beam
      const beamHeight = 0.12 * h.mag;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, beamHeight, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }),
      );
      beam.position.copy(pos).multiplyScalar(1 + beamHeight / 2);
      beam.lookAt(0, 0, 0);
      beam.rotateX(Math.PI / 2);
      hotspotGroups[h.layer].add(beam);

      // Pulse ring
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.02, 24), ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      (ring as any).userData = { phase: Math.random() * Math.PI * 2, mag: h.mag };
      hotspotGroups[h.layer].add(ring);
    });

    // Arcs (supply chain / migration flows)
    const arcsGroup = new THREE.Group();
    earthGroup.add(arcsGroup);
    const arcPairs: [number, number, LayerKey][] = [
      [1, 11, "supply"],
      [3, 18, "supply"],
      [4, 14, "supply"],
      [6, 0, "population"],
      [16, 7, "population"],
      [9, 12, "biodiversity"],
      [2, 17, "energy"],
      [19, 5, "energy"],
    ];
    arcPairs.forEach(([a, b, layer]) => {
      const start = latLngToVec3(HOTSPOTS[a].lat, HOTSPOTS[a].lng, 1.01);
      const end = latLngToVec3(HOTSPOTS[b].lat, HOTSPOTS[b].lng, 1.01);
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.55);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geo = new THREE.TubeGeometry(curve, 48, 0.0035, 6, false);
      const mat = new THREE.MeshBasicMaterial({
        color: LAYER_COLOR[layer],
        transparent: true,
        opacity: 0.55,
      });
      const tube = new THREE.Mesh(geo, mat);
      (tube as any).userData = { layer };
      arcsGroup.add(tube);

      // moving packet
      const packet = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 10, 10),
        new THREE.MeshBasicMaterial({ color: LAYER_COLOR[layer] }),
      );
      (packet as any).userData = { curve, t: Math.random(), layer };
      arcsGroup.add(packet);
    });

    // Lights
    scene.add(new THREE.AmbientLight(0x88aacc, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // Drag-to-rotate
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0.0015;
    let velY = 0;
    const onDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      isDragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      velX = dx * 0.005;
      velY = dy * 0.005;
      earthGroup.rotation.y += velX;
      earthGroup.rotation.x += velY;
      earthGroup.rotation.x = Math.max(-1.2, Math.min(1.2, earthGroup.rotation.x));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let t0 = performance.now();
    const render = () => {
      const now = performance.now();
      const dt = (now - t0) / 1000;
      t0 = now;

      if (!isDragging) {
        earthGroup.rotation.y += 0.0009;
      }
      stars.rotation.y += 0.00005;

      // Layer visibility
      const active = layersRef.current;
      (Object.keys(hotspotGroups) as LayerKey[]).forEach((k) => {
        hotspotGroups[k].visible = active.includes(k);
      });
      arcsGroup.children.forEach((c) => {
        const layer = (c as any).userData?.layer as LayerKey | undefined;
        if (layer) c.visible = active.includes(layer);
      });

      // Pulse rings
      (Object.values(hotspotGroups) as THREE.Group[]).forEach((g) => {
        g.children.forEach((c) => {
          if ((c as any).userData?.phase !== undefined) {
            const ud = (c as any).userData;
            ud.phase += dt * 1.8;
            const s = 1 + (Math.sin(ud.phase) * 0.5 + 0.5) * 2.2 * ud.mag;
            c.scale.set(s, s, s);
            (c as THREE.Mesh).material &&
              ((((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
                0.5 * (1 - (Math.sin(ud.phase) * 0.5 + 0.5))));
          }
        });
      });

      // Packet flow along arcs
      arcsGroup.children.forEach((c) => {
        const ud = (c as any).userData;
        if (ud?.curve) {
          ud.t = (ud.t + dt * 0.18) % 1;
          const p = (ud.curve as THREE.QuadraticBezierCurve3).getPoint(ud.t);
          c.position.copy(p);
        }
      });

      // Time-year subtle visual: tint atmosphere warmer as year increases
      const year = yearRef.current;
      const heat = Math.min(1, Math.max(0, (year - 2020) / 30));
      (atmosphere.material as THREE.ShaderMaterial).uniforms.uColor.value.setRGB(
        0.31 + heat * 0.55,
        0.82 - heat * 0.45,
        0.77 - heat * 0.5,
      );

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}

export type { LayerKey };