import { Qubit, applyGate, fromThetaPhi, measure, probs, toThetaPhi, formatComplex, newBell, measureBellLeft, measureBellRight } from './quantum';

export type Mode = 'single' | 'ent';

export type UIState = {
  mode: Mode;
  qubit: Qubit;
  onUpdate: (q: Qubit) => void;
  onMeasure: (result: 0 | 1, q: Qubit) => void;
  bell: ReturnType<typeof newBell>;
  onEntMeasure: (side: 'left' | 'right', val: 0 | 1) => void;
};

export function initUI(state: UIState) {
  const theta = document.getElementById('theta') as HTMLInputElement;
  const phi = document.getElementById('phi') as HTMLInputElement;
  const thetaVal = document.getElementById('thetaVal')!;
  const phiVal = document.getElementById('phiVal')!;
  const p0El = document.getElementById('p0')!;
  const p1El = document.getElementById('p1')!;
  const ampA = document.getElementById('ampA')!;
  const ampB = document.getElementById('ampB')!;
  const measureResult = document.getElementById('measureResult')!;

  const leftResult = document.getElementById('leftResult')!;
  const rightResult = document.getElementById('rightResult')!;

  const modeSingle = document.getElementById('modeSingle')!;
  const modeEnt = document.getElementById('modeEnt')!;
  const singleControls = document.getElementById('singleControls')!;
  const entControls = document.getElementById('entControls')!;

  function refresh() {
    const { theta: t, phi: p } = toThetaPhi(state.qubit);
    theta.value = String(t);
    phi.value = String(p);
    thetaVal.textContent = t.toFixed(3);
    phiVal.textContent = p.toFixed(3);
    const { p0, p1 } = probs(state.qubit);
    p0El.textContent = p0.toFixed(3);
    p1El.textContent = p1.toFixed(3);
    ampA.textContent = formatComplex(state.qubit.a);
    ampB.textContent = formatComplex(state.qubit.b);
  }

  function setMode(m: Mode) {
    state.mode = m;
    modeSingle.classList.toggle('active', m === 'single');
    modeEnt.classList.toggle('active', m === 'ent');
    singleControls.hidden = m !== 'single';
    entControls.hidden = m !== 'ent';
    if (m === 'ent') {
      leftResult.textContent = 'unmeasured';
      rightResult.textContent = 'unmeasured';
      state.bell = newBell();
    }
  }

  modeSingle.addEventListener('click', () => setMode('single'));
  modeEnt.addEventListener('click', () => setMode('ent'));

  theta.addEventListener('input', () => {
    state.qubit = fromThetaPhi(parseFloat(theta.value), parseFloat(phi.value));
    state.onUpdate(state.qubit);
    refresh();
  });
  phi.addEventListener('input', () => {
    state.qubit = fromThetaPhi(parseFloat(theta.value), parseFloat(phi.value));
    state.onUpdate(state.qubit);
    refresh();
  });

  document.querySelectorAll('[data-gate]')!.forEach(el => {
    el.addEventListener('click', () => {
      const name = (el as HTMLElement).dataset.gate!;
      if (name === 'reset') {
        state.qubit = fromThetaPhi(0, 0);
      } else {
        state.qubit = applyGate(state.qubit, name as any);
      }
      measureResult.textContent = '—';
      state.onUpdate(state.qubit);
      refresh();
    });
  });

  document.getElementById('measure')!.addEventListener('click', () => {
    const { result, collapsed } = measure(state.qubit);
    state.qubit = collapsed;
    state.onUpdate(state.qubit);
    measureResult.textContent = result === 0 ? '|0⟩' : '|1⟩';
    refresh();
    state.onMeasure(result, collapsed);
  });

  // Entanglement
  document.getElementById('prepBell')!.addEventListener('click', () => {
    state.bell = newBell();
    leftResult.textContent = 'unmeasured';
    rightResult.textContent = 'unmeasured';
    state.onEntMeasure('left', undefined as any);
    state.onEntMeasure('right', undefined as any);
  });
  document.getElementById('measureLeft')!.addEventListener('click', () => {
    const { left, right } = measureBellLeft(state.bell);
    leftResult.textContent = left === 0 ? '|0⟩' : '|1⟩';
    if (right !== undefined) rightResult.textContent = right === 0 ? '|0⟩' : '|1⟩';
    state.onEntMeasure('left', left);
    if (right !== undefined) state.onEntMeasure('right', right);
  });
  document.getElementById('measureRight')!.addEventListener('click', () => {
    const { right, left } = measureBellRight(state.bell);
    rightResult.textContent = right === 0 ? '|0⟩' : '|1⟩';
    if (left !== undefined) leftResult.textContent = left === 0 ? '|0⟩' : '|1⟩';
    state.onEntMeasure('right', right);
    if (left !== undefined) state.onEntMeasure('left', left);
  });
  document.getElementById('resetEnt')!.addEventListener('click', () => {
    state.bell = newBell();
    leftResult.textContent = 'unmeasured';
    rightResult.textContent = 'unmeasured';
    state.onEntMeasure('left', undefined as any);
    state.onEntMeasure('right', undefined as any);
  });

  refresh();
  setMode(state.mode);
}

export function showSupportWarning(show: boolean) {
  const el = document.getElementById('supportWarning');
  if (el) el.hidden = !show;
}

