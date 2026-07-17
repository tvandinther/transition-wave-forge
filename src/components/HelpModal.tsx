import { X } from "lucide-react";
import { useEffect } from "react";

interface HelpModalProps {
  onClose: () => void;
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <span className="wf-mono" style={{ color: "#4CFF9E", fontSize: 12 }}>
        {term}
      </span>
      <p className="text-xs mt-0.5" style={{ color: "#B9CBB8" }}>
        {children}
      </p>
    </div>
  );
}

export default function HelpModal({ onClose }: HelpModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="wf-panel"
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 20,
          background: "#12160F",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: "#EAF7EC" }}>
            Parameter reference
          </h2>
          <button className="wf-btn flex items-center gap-1" onClick={onClose} aria-label="close help">
            <X size={14} /> close
          </button>
        </div>

        <section className="mb-4">
          <h3 className="wf-label mb-2">Global controls</h3>
          <Term term="Progress source">
            The Fusion control that drives the transition, expected to move from 0 at the start to 1 at the end (e.g.
            Background1.Blend). Every layer is evaluated as a function of this value.
          </Term>
          <Term term="Normalize (force start=0, end=1)">
            Rescales the combined output so it always equals exactly 0 when progress = 0 and exactly 1 when progress =
            1, regardless of what the raw layer sum produces at those points. Turn this off to use the raw sum
            as-is. Disabled automatically (with a warning) if the raw start and end values are equal, since that
            would divide by zero.
          </Term>
          <Term term="Clamp output to 0–1">
            Clips the final expression result to the 0–1 range. Useful when layers (especially sine or amplitude &gt;
            1) push the combined value outside 0–1 at some point in the middle of the transition.
          </Term>
          <Term term="Show individual layers">
            Overlays each enabled layer's own waveform (before summing) on the scope in its layer color, so you can
            see how each oscillator contributes to the combined green curve.
          </Term>
          <Term term="Scale time so y=0 at t=0, y=1 at t=1">
            Finds the first point where the raw combined signal reaches 0 and the last point where it reaches 1, then
            rewrites the progress input so that window is stretched across the whole 0–1 transition — e.g. progress
            source Background1.Blend is replaced with (t0 + Background1.Blend*(t1-t0)) everywhere in the expression.
            This actually crops the transition's timing (unlike Normalize, which only rescales the output), so any
            flat lead-in or settle-out before/after the 0/1 crossings is skipped. t0/t1 are baked in as fixed
            numbers read off the live preview, so re-check the scope after changing layer parameters. Falls back to
            the untouched 0–1 range if the signal never reaches both values.
          </Term>
        </section>

        <section className="mb-4">
          <h3 className="wf-label mb-2">Layer type</h3>
          <Term term="Ramp">
            A plain linear ramp from 0 to 1 across the whole transition — ignores cycles, phase and duty. Typically
            used as a base layer with other oscillators added on top.
          </Term>
          <Term term="Saw">A sawtooth that rises linearly from 0 to 1 within each cycle, then snaps back to 0.</Term>
          <Term term="Square">A hard on/off (1/0) step that switches at the midpoint of each cycle.</Term>
          <Term term="PWM">Like Square, but the on/off switch point within each cycle is set by Duty instead of being fixed at 50%.</Term>
          <Term term="Sine">A smooth sine wave remapped to the 0–1 range (0.5 + 0.5·sin), oscillating once per cycle.</Term>
        </section>

        <section className="mb-4">
          <h3 className="wf-label mb-2">Layer parameters</h3>
          <Term term="on">Enables or disables the layer. Disabled layers contribute 0 and are excluded from the expression entirely.</Term>
          <Term term="amp">
            Amplitude — multiplies the layer's 0–1 waveform. Negative values invert it; values above 1 or below 0
            let a single layer push the combined sum outside 0–1 (see Clamp output).
          </Term>
          <Term term="cycles: fixed">Sets a constant number of oscillations across the transition. Fractional values are allowed (e.g. 2.5 cycles).</Term>
          <Term term="cycles: linked">
            Points the cycle count at another Fusion control's value (e.g. Custom1.CycleCount) instead of a fixed
            number, so animators can change the cycle count without editing the expression. The adjacent Preview
            field only affects the on-screen scope — it has no effect on the emitted expression.
          </Term>
          <Term term="duty">
            PWM only — the fraction of each cycle spent "on" before switching "off" (0.5 = symmetric square wave, lower
            values = shorter on-time).
          </Term>
          <Term term="phase">Shifts the layer's waveform left/right in time, in units of cycles (e.g. 0.25 shifts a square wave by a quarter period).</Term>
          <Term term="clamp 0–1">Clips this individual layer's contribution to 0–1 before it's added to the other layers, independent of the global output clamp.</Term>
          <Term term="quantize">
            Snaps the layer's value to a fixed number of discrete steps (e.g. 4 → values land on 0, 1/4, 2/4, 3/4, 1).
            Set to 0 to disable and keep the continuous value.
          </Term>
        </section>

        <section>
          <h3 className="wf-label mb-2">Fusion expression</h3>
          <p className="text-xs" style={{ color: "#B9CBB8" }}>
            The drawer at the bottom of the page renders the combined layer stack as a single-line expression using
            floor(), sin(), pi and the ternary operator (cond ? a : b) — all supported in Fusion's expression fields.
            Paste it directly into the expression field of the control you want to drive.
          </p>
        </section>
      </div>
    </div>
  );
}
