import { Trash2 } from "lucide-react";
import { LAYER_COLORS, TYPE_LABEL, type Layer } from "../lib/wave";

interface LayerRowProps {
  layer: Layer;
  index: number;
  onChange: (patch: Partial<Layer>) => void;
  onRemove: () => void;
}

export default function LayerRow({ layer: l, index: li, onChange, onRemove }: LayerRowProps) {
  return (
    <div className="wf-panel p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: LAYER_COLORS[li % LAYER_COLORS.length] }}
        />
        <select className="wf-select" value={l.type} onChange={(e) => onChange({ type: e.target.value as Layer["type"] })}>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={l.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} /> on
        </label>

        <div className="flex items-center gap-1">
          <span className="wf-label">amp</span>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.01"
            value={l.amplitude}
            onChange={(e) => onChange({ amplitude: Number(e.target.value) })}
            style={{ width: 90 }}
          />
          <span className="wf-mono text-xs" style={{ width: 36, display: "inline-block" }}>
            {Number(l.amplitude).toFixed(2)}
          </span>
        </div>

        {l.type !== "ramp" && (
          <div className="flex items-center gap-2">
            <select className="wf-select" value={l.cyclesMode} onChange={(e) => onChange({ cyclesMode: e.target.value as Layer["cyclesMode"] })}>
              <option value="fixed">cycles: fixed</option>
              <option value="linked">cycles: linked</option>
            </select>
            {l.cyclesMode === "fixed" ? (
              <input
                className="wf-input wf-mono"
                style={{ width: 60 }}
                type="number"
                step="0.5"
                value={l.cycles}
                onChange={(e) => onChange({ cycles: Number(e.target.value) })}
              />
            ) : (
              <>
                <input
                  className="wf-input wf-mono"
                  style={{ width: 130 }}
                  placeholder="Custom1.CycleCount"
                  value={l.linkPath}
                  onChange={(e) => onChange({ linkPath: e.target.value })}
                />
                <span className="wf-label">preview</span>
                <input
                  className="wf-input wf-mono"
                  style={{ width: 50 }}
                  type="number"
                  step="0.5"
                  value={l.previewCycles}
                  onChange={(e) => onChange({ previewCycles: Number(e.target.value) })}
                />
              </>
            )}
          </div>
        )}

        {l.type === "pwm" && (
          <div className="flex items-center gap-1">
            <span className="wf-label">duty</span>
            <input
              type="range"
              min="0.02"
              max="0.98"
              step="0.01"
              value={l.duty}
              onChange={(e) => onChange({ duty: Number(e.target.value) })}
              style={{ width: 70 }}
            />
            <span className="wf-mono text-xs">{Number(l.duty).toFixed(2)}</span>
          </div>
        )}

        {l.type !== "ramp" && (
          <div className="flex items-center gap-1">
            <span className="wf-label">phase</span>
            <input
              className="wf-input wf-mono"
              style={{ width: 50 }}
              type="number"
              step="0.05"
              value={l.phase}
              onChange={(e) => onChange({ phase: Number(e.target.value) })}
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="wf-label">quantize</span>
          <input
            className="wf-input wf-mono"
            style={{ width: 50 }}
            type="number"
            min="0"
            step="1"
            value={l.quantize}
            onChange={(e) => onChange({ quantize: Number(e.target.value) })}
            title="0 = off, else number of discrete levels"
          />
        </div>

        <button className="wf-btn ml-auto flex items-center gap-1" onClick={onRemove} title="remove layer">
          <Trash2 size={13} /> remove
        </button>
      </div>
    </div>
  );
}
