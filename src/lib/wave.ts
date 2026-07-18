export type WaveType = "ramp" | "saw" | "square" | "pwm" | "sine";
export type CyclesMode = "fixed" | "linked";

export interface Layer {
  id: number;
  type: WaveType;
  enabled: boolean;
  amplitude: number;
  cyclesMode: CyclesMode;
  cycles: number;
  previewCycles: number;
  linkPath: string;
  phase: number;
  duty: number;
  quantize: number;
  clamp: boolean;
}

export const TYPE_LABEL: Record<WaveType, string> = {
  ramp: "Ramp",
  saw: "Saw",
  square: "Square",
  pwm: "PWM",
  sine: "Sine",
};

export const LAYER_COLORS = [
  "#4CFF9E",
  "#FFB454",
  "#5EC8FF",
  "#FF7A9C",
  "#C8A6FF",
  "#8FE3C0",
];

let uid = 1;
export const nextId = () => uid++;

export const baseLayer = (overrides: Partial<Layer> = {}): Layer => ({
  id: nextId(),
  type: "square",
  enabled: true,
  amplitude: 1,
  cyclesMode: "fixed",
  cycles: 4,
  previewCycles: 4,
  linkPath: "Custom1.CycleCount",
  phase: 0,
  duty: 0.5,
  quantize: 0,
  clamp: false,
  ...overrides,
});

export interface Preset {
  name: string;
  note: string;
  progressSource: string;
  normalize: boolean;
  clampOutput?: boolean;
  layers: Layer[];
}

// ---------- math (used for the live preview) ----------

export function evalLayer(layer: Layer, t: number): number {
  if (!layer.enabled) return 0;
  let val: number;
  if (layer.type === "ramp") {
    val = t;
  } else {
    const cyc = layer.cyclesMode === "fixed" ? Number(layer.cycles) || 0 : Number(layer.previewCycles) || 0;
    const X = cyc * t + (Number(layer.phase) || 0);
    const frac = X - Math.floor(X);
    if (layer.type === "saw") val = frac;
    else if (layer.type === "square") val = frac < 0.5 ? 1 : 0;
    else if (layer.type === "pwm") val = frac < (Number(layer.duty) || 0.5) ? 1 : 0;
    else if (layer.type === "sine") val = 0.5 + 0.5 * Math.sin(2 * Math.PI * X);
    else val = 0;
  }
  if (layer.quantize && Number(layer.quantize) > 0) {
    const s = Number(layer.quantize);
    val = Math.floor(val * s + 0.5) / s;
  }
  const out = val * (Number(layer.amplitude) || 0);
  return layer.clamp ? Math.min(1, Math.max(0, out)) : out;
}

export function rawAt(layers: Layer[], t: number): number {
  return layers.reduce((sum, l) => sum + evalLayer(l, t), 0);
}

// start value === end value: normalization would divide by zero
export function isDegenerate(layers: Layer[], t0 = 0, t1 = 1): boolean {
  return Math.abs(rawAt(layers, t1) - rawAt(layers, t0)) < 1e-6;
}

// earliest t (interpolated) at which the sampled curve reaches `target`; 0 if it never does
export function firstCrossing(pts: number[], target: number): number {
  const n = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const v = pts[i];
    if (v === target) return i / n;
    if (i < n) {
      const next = pts[i + 1];
      if ((v < target) !== (next < target)) {
        return (i + (target - v) / (next - v)) / n;
      }
    }
  }
  return 0;
}

// latest t (interpolated) at which the sampled curve reaches `target`; 1 if it never does
export function lastCrossing(pts: number[], target: number): number {
  const n = pts.length - 1;
  for (let i = n; i >= 0; i--) {
    const v = pts[i];
    if (v === target) return i / n;
    if (i > 0) {
      const prev = pts[i - 1];
      if ((prev < target) !== (v < target)) {
        return (i - 1 + (target - prev) / (v - prev)) / n;
      }
    }
  }
  return 1;
}

// ---------- expression string building (emitted as the Fusion expression) ----------

function numStr(n: number): string {
  const v = Math.round(Number(n) * 10000) / 10000;
  return String(v);
}

function clampExpr(expr: string): string {
  return `iif(${expr} < 0, 0, iif(${expr} > 1, 1, ${expr}))`;
}

function buildLayerTerm(layer: Layer, tExpr: string): string {
  const amp = numStr(layer.amplitude);
  let val: string;
  if (layer.type === "ramp") {
    val = `(${tExpr})`;
  } else {
    const cyc = layer.cyclesMode === "fixed" ? numStr(layer.cycles) : layer.linkPath || "1";
    const phase = Number(layer.phase) || 0;
    const X = phase !== 0 ? `((${cyc})*(${tExpr}) + ${numStr(phase)})` : `((${cyc})*(${tExpr}))`;
    const FRAC = `(${X} - floor(${X}))`;
    if (layer.type === "saw") val = FRAC;
    else if (layer.type === "square") val = `iif(${FRAC} < 0.5, 1, 0)`;
    else if (layer.type === "pwm") val = `iif(${FRAC} < ${numStr(layer.duty)}, 1, 0)`;
    else val = `(0.5 + 0.5*sin(2*pi*${X}))`;
  }
  if (layer.quantize && Number(layer.quantize) > 0) {
    const s = numStr(layer.quantize);
    val = `(floor((${val})*${s} + 0.5)/${s})`;
  }
  const term = `(${amp}*${val})`;
  return layer.clamp ? clampExpr(term) : term;
}

export function buildRawExpr(layers: Layer[], tExpr: string): string {
  const enabled = layers.filter((l) => l.enabled);
  if (enabled.length === 0) return "0";
  return enabled.map((l) => buildLayerTerm(l, tExpr)).join(" + ");
}

// t0/t1: when set, remaps progressSource through (t0 + progress*(t1-t0)) before evaluating
// the layers, so the emitted expression itself starts at raw(t0) and ends at raw(t1) instead
// of raw(0)/raw(1). The values are baked in as numeric literals (from the live-preview crossing
// search), not solved symbolically in Fusion.
export function buildFullExpression(
  layers: Layer[],
  progressSource: string,
  normalize: boolean,
  clampOutput: boolean,
  timeWarp: { t0: number; t1: number } | null = null
): string {
  const src = progressSource.trim() || "Background1.Blend";
  const tExpr = timeWarp
    ? `(${numStr(timeWarp.t0)} + (${src})*${numStr(timeWarp.t1 - timeWarp.t0)})`
    : src;
  const t0Expr = timeWarp ? numStr(timeWarp.t0) : "0";
  const t1Expr = timeWarp ? numStr(timeWarp.t1) : "1";
  const rawT = buildRawExpr(layers, tExpr);
  let expr: string;
  if (!normalize || isDegenerate(layers, timeWarp?.t0 ?? 0, timeWarp?.t1 ?? 1)) {
    expr = rawT;
  } else {
    const raw0 = buildRawExpr(layers, t0Expr);
    const raw1 = buildRawExpr(layers, t1Expr);
    expr = `((${rawT}) - (${raw0})) / ((${raw1}) - (${raw0}))`;
  }
  return clampOutput ? clampExpr(expr) : expr;
}
