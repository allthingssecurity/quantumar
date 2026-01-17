import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

export type ARSetup = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  inAR: boolean;
  refSpace?: XRReferenceSpace;
  hitTestSource?: XRHitTestSource;
  reticle?: THREE.Mesh;
  arButton?: HTMLElement;
};

export async function setupRenderer(canvas?: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);
  return { scene, camera };
}

export function createARButton(renderer: THREE.WebGLRenderer, slot: HTMLElement): HTMLElement {
  const button = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
  slot.replaceChildren(button);
  return button;
}

export async function initReticle(): Promise<THREE.Mesh> {
  const geo = new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.8 });
  const reticle = new THREE.Mesh(geo, mat);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  return reticle;
}

export function onResize(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);
  return () => window.removeEventListener('resize', resize);
}

export function setupARSession(renderer: THREE.WebGLRenderer, onSessionStart?: () => void, onSessionEnd?: () => void) {
  renderer.xr.addEventListener('sessionstart', () => onSessionStart && onSessionStart());
  renderer.xr.addEventListener('sessionend', () => onSessionEnd && onSessionEnd());
}

export async function requestHitTestSource(session: XRSession, referenceSpace: XRReferenceSpace): Promise<XRHitTestSource> {
  const viewerSpace = await session.requestReferenceSpace('viewer');
  // @ts-expect-error - non-standard types until lib.dom adds them
  return await session.requestHitTestSource({ space: viewerSpace });
}

