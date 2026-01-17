# Quantum AR Lab

Single-page WebAR prototype to visualize and manipulate a single-qubit on a Bloch sphere, apply quantum gates, perform measurements, and demonstrate Bell-state entanglement correlations. Runs as a WebXR AR experience on Chrome Android (ARCore devices) with a graceful non‑AR fallback on desktop using OrbitControls.

## Features
- AR plane placement with reticle and tap-to-place.
- Bloch sphere with axes, labels, and state vector.
- Sliders for θ and φ; buttons for gates H, X, Y, Z, S, T; measure collapses to |0⟩ or |1⟩.
- Entanglement mode with two Bloch spheres and perfect correlation for |Φ+⟩.
- Fallback non‑AR 3D view when WebXR AR is unavailable.

## Tech
- Three.js latest.
- WebXR hit-test for AR placement.
- Vite for dev server and bundling.
- TypeScript modules with clean separation: `ar.ts`, `bloch.ts`, `quantum.ts`, `ui.ts`, `main.ts`.

## Prerequisites
- Node.js 18+ recommended.
- Chrome on Android with ARCore services installed for AR mode.

## Install
```
cd quantum-ar-lab
npm install
```

## Run (desktop fallback or AR testing)
```
npm run dev
```
- Desktop: open the printed URL (e.g., `http://localhost:5173`). You’ll see the 3D Bloch sphere with OrbitControls.
- Android AR: ensure your phone can reach your computer on the LAN. Use the LAN URL Vite prints (e.g., `http://<your-ip>:5173`). On Chrome Android, tap the “Enter AR” button, move to detect a surface, then tap to place the Bloch sphere.

Note: WebXR immersive‑ar typically requires HTTPS or a secure context. Vite’s LAN HTTP works on Chrome Android for local testing via special flags; if your device blocks AR, try `chrome://flags` and enable “Insecure origins treated as secure” for your LAN URL, or run behind HTTPS (e.g., Caddy/Ngrok). Production deployments should use HTTPS.

## Usage
### Single Qubit
- θ/φ sliders set |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩.
- Vector mapping: (x, y, z) = (sinθ cosφ, cosθ, sinθ sinφ). P(0)=cos²(θ/2), P(1)=sin²(θ/2).
- Gate buttons update the state; measurement collapses to |0⟩ or |1⟩ per Born probabilities.

### Entanglement
- “Prep |Φ+⟩” readies perfect same‑outcome correlations. Before measurement, spheres show an ambiguous local marker; measuring one collapses both with 50/50 outcomes and matching results.

## Known Limitations
- Entanglement is visual and correlation‑only; no full two‑qubit tensor simulation.
- AR hit-test availability depends on device motion and lighting; move phone to detect planes.
- On some devices a secure context may be required for WebXR.

## Build
```
npm run build
npm run preview
```

## Code Structure
- `src/quantum.ts` – Complex math, single‑qubit gates, measurement, Bell correlation helpers.
- `src/bloch.ts` – Bloch sphere meshes, axis labels, vector updates, entanglement link.
- `src/ar.ts` – WebXR setup, ARButton, reticle, hit‑test source management, resize.
- `src/ui.ts` – Overlay UI wiring: sliders, buttons, mode toggle, info panel.
- `src/main.ts` – App bootstrap, scene setup, AR vs fallback selection, animation loop.

