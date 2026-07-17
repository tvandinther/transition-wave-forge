import { AlertTriangle } from "lucide-react";
import { LAYER_COLORS, type Layer } from "../lib/wave";

const W = 640;
const H = 220;
const PAD = 10;

interface ScopeProps {
  layers: Layer[];
  pts: number[];
  perLayer: number[][];
  badDenom: boolean;
  showLayers: boolean;
  n: number;
}

export default function Scope({ layers, pts, perLayer, badDenom, showLayers, n }: ScopeProps) {
  const allVals = [...pts, 0, 1];
  perLayer.forEach((arr) => allVals.push(...arr));
  const vMin = Math.min(...allVals);
  const vMax = Math.max(...allVals);
  const span = vMax - vMin || 1;
  const padSpan = span * 0.12 + 0.001;
  const lo = vMin - padSpan;
  const hi = vMax + padSpan;
  const xOf = (t: number) => PAD + t * (W - 2 * PAD);
  const yOf = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - 2 * PAD);

  const pathFor = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i / n).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

  const mainPath = pathFor(pts);

  return (
    <div className="wf-panel p-3 mb-4">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={"v" + t} x1={xOf(t)} y1={0} x2={xOf(t)} y2={H} stroke="#1B2617" strokeWidth="1" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => {
          const v = lo + (i / 4) * (hi - lo);
          return <line key={"h" + i} x1={0} y1={yOf(v)} x2={W} y2={yOf(v)} stroke="#1B2617" strokeWidth="1" />;
        })}
        <line x1={0} y1={yOf(0)} x2={W} y2={yOf(0)} stroke="#FFB454" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
        <line x1={0} y1={yOf(1)} x2={W} y2={yOf(1)} stroke="#FFB454" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />

        {showLayers &&
          layers.map((l, li) => {
            if (!l.enabled) return null;
            return (
              <path
                key={l.id}
                d={pathFor(perLayer[li])}
                fill="none"
                stroke={LAYER_COLORS[li % LAYER_COLORS.length]}
                strokeWidth="1"
                opacity="0.45"
              />
            );
          })}

        <path
          d={mainPath}
          fill="none"
          stroke="#4CFF9E"
          strokeWidth="2.2"
          style={{ filter: "drop-shadow(0 0 3px rgba(76,255,158,0.55))" }}
        />
      </svg>
      <div className="flex justify-between text-xs mt-1" style={{ color: "#5C6E58" }}>
        <span>t = 0</span>
        <span>t = 1</span>
      </div>
      {badDenom && (
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "#FF6B5E" }}>
          <AlertTriangle size={13} /> start value equals end value — normalization would divide by zero. Showing raw sum
          instead. Try non-integer cycles, a ramp layer, or turn normalize off.
        </div>
      )}
    </div>
  );
}
