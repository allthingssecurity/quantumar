// Quantum utilities: complex numbers, single-qubit state, gates, measurement

export type Complex = { re: number; im: number };

export function c(re = 0, im = 0): Complex { return { re, im }; }
export function add(a: Complex, b: Complex): Complex { return { re: a.re + b.re, im: a.im + b.im }; }
export function sub(a: Complex, b: Complex): Complex { return { re: a.re - b.re, im: a.im - b.im }; }
export function mul(a: Complex, b: Complex): Complex { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
export function conj(a: Complex): Complex { return { re: a.re, im: -a.im }; }
export function scale(a: Complex, s: number): Complex { return { re: a.re * s, im: a.im * s }; }
export function abs2(a: Complex): number { return a.re * a.re + a.im * a.im; }
export function norm(a: Complex): number { return Math.hypot(a.re, a.im); }
export function expi(phi: number): Complex { return { re: Math.cos(phi), im: Math.sin(phi) }; }

export type Qubit = { a: Complex; b: Complex };

export function normalize(q: Qubit): Qubit {
  const n = Math.sqrt(abs2(q.a) + abs2(q.b));
  if (n === 0) return { a: c(1, 0), b: c(0, 0) };
  return { a: scale(q.a, 1 / n), b: scale(q.b, 1 / n) };
}

export function fromThetaPhi(theta: number, phi: number): Qubit {
  // |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩
  const a = c(Math.cos(theta / 2), 0);
  const b = mul(expi(phi), c(Math.sin(theta / 2), 0));
  return normalize({ a, b });
}

export function toThetaPhi(q: Qubit): { theta: number; phi: number } {
  // Map Bloch sphere: x = 2 Re(a* b), y = 2 Im(a* b), z = |a|^2 - |b|^2
  const aC = conj(q.a);
  const aStarb = mul(aC, q.b);
  const x = 2 * aStarb.re;
  const y = 2 * aStarb.im;
  const z = abs2(q.a) - abs2(q.b);
  const theta = Math.acos(Math.max(-1, Math.min(1, z))); // [0, π]
  const phi = Math.atan2(y, x); // (-π, π]
  return { theta, phi: (phi + 2 * Math.PI) % (2 * Math.PI) };
}

export function formatComplex(z: Complex, digits = 3): string {
  const re = z.re.toFixed(digits);
  const im = z.im.toFixed(digits);
  const sign = z.im >= 0 ? "+" : "";
  return `${re} ${sign}${im}i`;
}

export function probs(q: Qubit): { p0: number; p1: number } {
  const p0 = abs2(q.a);
  const p1 = abs2(q.b);
  return { p0, p1 };
}

export type Gate = [[Complex, Complex], [Complex, Complex]];

function gateMul(g: Gate, v: Qubit): Qubit {
  const a = add(mul(g[0][0], v.a), mul(g[0][1], v.b));
  const b = add(mul(g[1][0], v.a), mul(g[1][1], v.b));
  return normalize({ a, b });
}

const I: Gate = [[c(1, 0), c(0, 0)], [c(0, 0), c(1, 0)]];
const X: Gate = [[c(0, 0), c(1, 0)], [c(1, 0), c(0, 0)]];
const Y: Gate = [[c(0, 0), c(0, -1)], [c(0, 1), c(0, 0)]];
const Z: Gate = [[c(1, 0), c(0, 0)], [c(0, 0), c(-1, 0)]];
const H: Gate = [[scale(c(1, 0), 1 / Math.SQRT2), scale(c(1, 0), 1 / Math.SQRT2)], [scale(c(1, 0), 1 / Math.SQRT2), scale(c(-1, 0), 1 / Math.SQRT2)]];
const S: Gate = [[c(1, 0), c(0, 0)], [c(0, 0), c(0, 1)]];
const T: Gate = [[c(1, 0), c(0, 0)], [c(0, 0), expi(Math.PI / 4)]];

export const Gates = { I, X, Y, Z, H, S, T } as const;

export function applyGate(q: Qubit, name: keyof typeof Gates): Qubit {
  return gateMul(Gates[name], q);
}

export function measure(q: Qubit): { result: 0 | 1; collapsed: Qubit } {
  const { p0, p1 } = probs(q);
  const r = Math.random();
  const result: 0 | 1 = r < p0 ? 0 : 1;
  const collapsed = result === 0 ? { a: c(1, 0), b: c(0, 0) } : { a: c(0, 0), b: c(1, 0) };
  return { result, collapsed };
}

// Entanglement helper: Bell state correlations. We don't model full 4D state here;
// we only enforce perfect same-outcome correlation upon first measurement.
export type BellState = {
  measuredLeft?: 0 | 1;
  measuredRight?: 0 | 1;
};

export function newBell(): BellState { return {}; }

export function measureBellLeft(bell: BellState): { left: 0 | 1; right?: 0 | 1 } {
  if (bell.measuredLeft !== undefined) return { left: bell.measuredLeft, right: bell.measuredRight };
  const left: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  bell.measuredLeft = left;
  if (bell.measuredRight === undefined) {
    bell.measuredRight = left; // perfect correlation for |Φ+⟩
  }
  return { left, right: bell.measuredRight };
}

export function measureBellRight(bell: BellState): { right: 0 | 1; left?: 0 | 1 } {
  if (bell.measuredRight !== undefined) return { right: bell.measuredRight, left: bell.measuredLeft };
  const right: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  bell.measuredRight = right;
  if (bell.measuredLeft === undefined) {
    bell.measuredLeft = right; // perfect correlation for |Φ+⟩
  }
  return { right, left: bell.measuredLeft };
}

