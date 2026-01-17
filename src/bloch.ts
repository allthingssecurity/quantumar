import * as THREE from 'three';

export type BlochObjects = {
  group: THREE.Group;
  vector: THREE.ArrowHelper;
};

export function createAxisLabel(text: string, color = '#aab0bf'): THREE.Sprite {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.font = '28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size/2, size/2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.3, 0.3, 0.3);
  return sprite;
}

export function createBlochSphere(radius = 0.5): BlochObjects {
  const group = new THREE.Group();

  // Transparent sphere shell
  const geo = new THREE.SphereGeometry(radius, 32, 24);
  const mat = new THREE.MeshPhongMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const sphere = new THREE.Mesh(geo, mat);
  group.add(sphere);

  // Latitude/longitude rings (faint)
  const ringMat = new THREE.LineBasicMaterial({ color: 0x5dade2, opacity: 0.4, transparent: true });
  for (let i = -60; i <= 60; i += 30) {
    const phi = THREE.MathUtils.degToRad(i);
    const latGeo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    for (let a = 0; a <= 360; a += 6) {
      const t = THREE.MathUtils.degToRad(a);
      const x = radius * Math.cos(phi) * Math.cos(t);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(t);
      pts.push(new THREE.Vector3(x, y, z));
    }
    latGeo.setFromPoints(pts);
    group.add(new THREE.LineLoop(latGeo, ringMat));
  }
  for (let i = 0; i < 180; i += 30) {
    const latGeo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    for (let a = 0; a <= 360; a += 6) {
      const t = THREE.MathUtils.degToRad(a);
      const theta = THREE.MathUtils.degToRad(i);
      const x = radius * Math.sin(theta) * Math.cos(t);
      const y = radius * Math.cos(theta);
      const z = radius * Math.sin(theta) * Math.sin(t);
      pts.push(new THREE.Vector3(x, y, z));
    }
    latGeo.setFromPoints(pts);
    group.add(new THREE.LineLoop(latGeo, ringMat));
  }

  // Axes
  const axes = new THREE.AxesHelper(radius * 1.4);
  group.add(axes);

  // Axis labels
  const xPlus = createAxisLabel('+X'); xPlus.position.set(radius * 1.4, 0, 0); group.add(xPlus);
  const xMinus = createAxisLabel('-X'); xMinus.position.set(-radius * 1.4, 0, 0); group.add(xMinus);
  const yPlus = createAxisLabel('+Y'); yPlus.position.set(0, radius * 1.4, 0); group.add(yPlus);
  const yMinus = createAxisLabel('-Y'); yMinus.position.set(0, -radius * 1.4, 0); group.add(yMinus);
  const zPlus = createAxisLabel('+Z'); zPlus.position.set(0, 0, radius * 1.4); group.add(zPlus);
  const zMinus = createAxisLabel('-Z'); zMinus.position.set(0, 0, -radius * 1.4); group.add(zMinus);

  // State vector arrow; start at |0> (north pole)
  const dir = new THREE.Vector3(0, 1, 0);
  const origin = new THREE.Vector3(0, 0, 0);
  const length = radius;
  const hex = 0xffd166;
  const arrow = new THREE.ArrowHelper(dir, origin, length, hex, 0.12, 0.08);
  group.add(arrow);

  // Lighting for better visibility in non-AR
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  group.add(amb);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(2, 2, 1);
  group.add(dirLight);

  return { group, vector: arrow };
}

// Update arrow based on Bloch vector mapping:
// Given θ, φ -> vector (x, y, z) = (sinθ cosφ, cosθ, sinθ sinφ)
// Note: Three.js uses y-up. We map z_Bloch to three's z.
export function setStateVector(objects: BlochObjects, theta: number, phi: number, radius = 0.5) {
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);
  const dir = new THREE.Vector3(x, y, z).normalize();
  objects.vector.setDirection(dir);
  objects.vector.setLength(radius);
}

export function createEntanglementLink(a: THREE.Object3D, b: THREE.Object3D): THREE.LineSegments {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array([
    a.position.x, a.position.y, a.position.z,
    b.position.x, b.position.y, b.position.z,
  ]);
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineDashedMaterial({ color: 0x7b2cbf, dashSize: 0.05, gapSize: 0.03, transparent: true, opacity: 0.9 });
  const line = new THREE.LineSegments(geom, mat);
  // Needed for dashed to appear
  line.computeLineDistances();
  return line;
}

