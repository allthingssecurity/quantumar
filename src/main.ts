import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBlochSphere, setStateVector, createEntanglementLink } from './bloch';
import { fromThetaPhi, toThetaPhi, Qubit } from './quantum';
import { initUI, showSupportWarning, updateDiagnostics } from './ui';
import { createARButton, createScene, initReticle, onResize, requestHitTestSource, setupARSession, setupRenderer } from './ar';

async function bootstrap() {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

  const renderer = await setupRenderer(canvas);
  const { scene, camera } = createScene();
  const arSlot = document.getElementById('ar-button-slot')!;

  // State
  let currentQubit: Qubit = fromThetaPhi(0, 0);
  const single = createBlochSphere(0.5);
  scene.add(single.group);

  // Entanglement objects
  const left = createBlochSphere(0.35);
  const right = createBlochSphere(0.35);
  left.group.position.set(-0.6, 0, 0);
  right.group.position.set(0.6, 0, 0);
  const link = createEntanglementLink(left.group, right.group);
  const entGroup = new THREE.Group();
  entGroup.add(left.group, right.group, link);
  entGroup.visible = false;
  scene.add(entGroup);

  // Non-AR camera helpers
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  camera.position.set(1.2, 0.9, 1.2);
  controls.update();

  // UI
  initUI({
    mode: 'single',
    qubit: currentQubit,
    onUpdate(q) {
      currentQubit = q;
      const { theta, phi } = toThetaPhi(q);
      setStateVector(single, theta, phi, 0.5);
    },
    onMeasure(_result, q) {
      const { theta, phi } = toThetaPhi(q);
      setStateVector(single, theta, phi, 0.5);
    },
    bell: {},
    onEntMeasure(side, val) {
      if (val === undefined) {
        setStateVector(left, 0, 0, 0.35);
        setStateVector(right, 0, 0, 0.35);
        return;
      }
      setStateVector(side === 'left' ? left : right, val === 0 ? 0 : Math.PI, 0, 0.35);
    }
  });

  // Toggle groups based on mode buttons
  document.getElementById('modeSingle')!.addEventListener('click', () => {
    single.group.visible = true;
    entGroup.visible = false;
  });
  document.getElementById('modeEnt')!.addEventListener('click', () => {
    single.group.visible = false;
    entGroup.visible = true;
  });

  // Initial vector
  setStateVector(single, 0, 0, 0.5);

  // AR specifics
  let reticle: THREE.Mesh | undefined;
  let placed = false;

  async function setupAR() {
    reticle = await initReticle();
    scene.add(reticle);

    setupARSession(renderer, () => {
      placed = false;
      single.group.visible = false;
      entGroup.visible = false;
      const session = renderer.xr.getSession();
      if (!session) return;
    (async () => {
      const refspace = await session.requestReferenceSpace('local');
      // @ts-expect-error store
      renderer.userData.refspace = refspace;
      // @ts-expect-error store
      renderer.userData.hitTestSource = await requestHitTestSource(session, refspace);
    })();
    const onSelect = () => {
      if (!reticle || placed || !reticle.visible) return;
      const target = entGroup.visible ? entGroup : single.group;
      const mat = new THREE.Matrix4();
      mat.copy(reticle.matrix);
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(mat);
      target.position.copy(pos);
      target.quaternion.setFromRotationMatrix(mat);
      target.visible = true;
      placed = true;
    };
    session.addEventListener('select', onSelect);
    (renderer as any).userData.onSelect = onSelect;
    }, () => {
      // Cleanup hit test source
      const hts: XRHitTestSource | undefined = (renderer as any).userData.hitTestSource;
      if (hts) hts.cancel();
      (renderer as any).userData.hitTestSource = undefined;
      const onSelect = (renderer as any).userData.onSelect as ((e: any) => void) | undefined;
      const session = renderer.xr.getSession();
      if (session && onSelect) session.removeEventListener('select', onSelect);
      // On AR end, show fallback 3D
      single.group.visible = true;
      entGroup.visible = false;
    });

    const arButton = createARButton(renderer, arSlot);

    renderer.setAnimationLoop((_t: number, frame: XRFrame | undefined) => {
      if (!frame) {
        renderer.render(scene, camera);
        return;
      }
      const hitTestSource: XRHitTestSource | undefined = (renderer as any).userData.hitTestSource;
      const ref: XRReferenceSpace | undefined = (renderer as any).userData.refspace;
      if (hitTestSource && ref && reticle) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(ref);
          if (pose) {
            reticle.visible = !placed;
            reticle.matrix.fromArray(pose.transform.matrix);
          }
        } else {
          reticle.visible = false;
        }
      }
      renderer.render(scene, camera);
    });
  }

  // Capability detection
  const xrSupported = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
  showSupportWarning(!xrSupported);
  void updateDiagnostics();
  if (xrSupported) {
    await setupAR();
  } else {
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
  }

  // Resize handling
  onResize(renderer, camera);
}

void bootstrap();
