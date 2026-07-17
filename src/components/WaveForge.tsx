import { useMemo, useRef, useState } from "react";
import { Plus, Copy, Check, Zap, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { PRESETS } from "../data/presets";
import { baseLayer, buildFullExpression, evalLayer, isDegenerate, nextId, rawAt, type Layer } from "../lib/wave";
import LayerRow from "./LayerRow";
import Scope from "./Scope";
import HelpModal from "./HelpModal";

const N = 240;

export default function WaveForge() {
  const [progressSource, setProgressSource] = useState("Background1.Blend");
  const [normalize, setNormalize] = useState(true);
  const [clampOutput, setClampOutput] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [layers, setLayers] = useState<Layer[]>(PRESETS[0].layers.map((l) => ({ ...l, id: nextId() })));
  const [presetIdx, setPresetIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setPresetIdx(idx);
    setProgressSource(p.progressSource);
    setNormalize(p.normalize);
    setClampOutput(p.clampOutput ?? false);
    setLayers(p.layers.map((l) => ({ ...l, id: nextId() })));
  };

  const updateLayer = (id: number, patch: Partial<Layer>) => {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeLayer = (id: number) => setLayers((ls) => ls.filter((l) => l.id !== id));
  const addLayer = () => {
    if (layers.length >= 6) return;
    setLayers((ls) => [...ls, baseLayer({ type: "sine", amplitude: 0.2, cycles: 8, previewCycles: 8 })]);
  };

  const samples = useMemo(() => {
    const raw0 = rawAt(layers, 0);
    const raw1 = rawAt(layers, 1);
    const denom = raw1 - raw0;
    const badDenom = isDegenerate(layers);
    const pts: number[] = [];
    const perLayer: number[][] = layers.map(() => []);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const raw = rawAt(layers, t);
      let combined = normalize && !badDenom ? (raw - raw0) / denom : raw;
      if (clampOutput) combined = Math.min(1, Math.max(0, combined));
      pts.push(combined);
      layers.forEach((l, li) => perLayer[li].push(evalLayer(l, t)));
    }
    return { pts, perLayer, badDenom };
  }, [layers, normalize, clampOutput]);

  const expression = useMemo(
    () => buildFullExpression(layers, progressSource, normalize, clampOutput),
    [layers, progressSource, normalize, clampOutput]
  );

  const copyExpr = async () => {
    try {
      await navigator.clipboard.writeText(expression);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      if (textRef.current) {
        textRef.current.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    }
  };

  return (
    <div
      style={{
        background: "#0A0D0A",
        minHeight: "100%",
        color: "#DCEFE0",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: drawerOpen ? 260 : 56,
      }}
      className="p-4 sm:p-6"
    >
      <style>{`
        .wf-mono { font-family: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace; }
        .wf-panel { background:#12160F; border:1px solid #24301F; border-radius:10px; }
        .wf-input { background:#0E120C; border:1px solid #2A3824; color:#DCEFE0; border-radius:6px; padding:4px 8px; font-size:12px; }
        .wf-input:focus { outline:1px solid #4CFF9E; }
        .wf-label { color:#7C9080; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; }
        .wf-btn { background:#1B2416; border:1px solid #2A3824; color:#DCEFE0; border-radius:6px; padding:6px 10px; font-size:12px; cursor:pointer; }
        .wf-btn:hover { border-color:#4CFF9E; }
        .wf-select { background:#0E120C; border:1px solid #2A3824; color:#DCEFE0; border-radius:6px; padding:4px 6px; font-size:12px; }
        input[type=range] { accent-color: #4CFF9E; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={18} color="#4CFF9E" />
          <h1 className="text-lg font-semibold tracking-wide" style={{ color: "#EAF7EC" }}>
            Wave Expression Forge
          </h1>
          <button
            className="wf-btn flex items-center gap-1 ml-auto"
            onClick={() => setHelpOpen(true)}
            aria-label="help"
          >
            <HelpCircle size={14} /> help
          </button>
        </div>
        <p className="wf-label mb-4">stacked oscillators → single-line fusion expression, always 0 at start, 1 at end</p>

        {/* preset row */}
        <div className="wf-panel p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="wf-label">Preset</span>
          <select className="wf-select" value={presetIdx} onChange={(e) => applyPreset(Number(e.target.value))}>
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs" style={{ color: "#7C9080" }}>
            {PRESETS[presetIdx]?.note}
          </span>
        </div>

        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0D0A", paddingTop: 4, marginTop: -4 }}>
          <Scope
            layers={layers}
            pts={samples.pts}
            perLayer={samples.perLayer}
            badDenom={samples.badDenom}
            showLayers={showLayers}
            n={N}
          />
        </div>

        {/* global controls */}
        <div className="wf-panel p-3 mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="wf-label">Progress source</span>
            <input
              className="wf-input wf-mono"
              style={{ width: 180 }}
              value={progressSource}
              onChange={(e) => setProgressSource(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
            Normalize (force start=0, end=1)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={clampOutput} onChange={(e) => setClampOutput(e.target.checked)} />
            Clamp output to 0–1
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={showLayers} onChange={(e) => setShowLayers(e.target.checked)} />
            Show individual layers
          </label>
        </div>

        {/* layers */}
        <div className="flex flex-col gap-3 mb-4">
          {layers.map((l, li) => (
            <LayerRow
              key={l.id}
              layer={l}
              index={li}
              onChange={(patch) => updateLayer(l.id, patch)}
              onRemove={() => removeLayer(l.id)}
            />
          ))}

          <button
            className="wf-btn self-start flex items-center gap-1.5"
            onClick={addLayer}
            disabled={layers.length >= 6}
            style={{ opacity: layers.length >= 6 ? 0.5 : 1 }}
          >
            <Plus size={14} /> add layer ({layers.length}/6)
          </button>
        </div>

      </div>

      {/* expression output drawer */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          background: "#12160F",
          borderTop: "1px solid #24301F",
          boxShadow: "0 -6px 20px rgba(0,0,0,0.45)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 py-2">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="wf-label"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 0,
              }}
            >
              {drawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              Fusion expression — paste into the expression field
            </button>
            <button className="wf-btn flex items-center gap-1.5" onClick={copyExpr}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "copied" : "copy"}
            </button>
          </div>
          {drawerOpen && (
            <div className="pb-3">
              <textarea
                ref={textRef}
                readOnly
                className="wf-input wf-mono"
                style={{ width: "100%", height: 90, resize: "vertical", lineHeight: 1.5 }}
                value={expression}
              />
              <p className="text-xs mt-2" style={{ color: "#5C6E58" }}>
                Uses floor(), sin(), pi and the ternary operator (cond ? a : b), all supported in Fusion's expression
                fields. "Progress source" should be the control driving 0→1 across your transition (e.g.
                Background1.Blend). For a linked cycle count, point it at any discrete Fusion control's value (e.g.
                Custom1.CycleCount).
              </p>
            </div>
          )}
        </div>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
