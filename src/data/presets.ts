import { baseLayer, type Preset } from "../lib/wave";

export const PRESETS: Preset[] = [
  {
    name: "8-Step Square",
    note: "Hard on/off transition — 4 cycles × 2 states = 8 steps.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "square", cycles: 4, previewCycles: 4 })],
  },
  {
    name: "Rising Staircase",
    note: "A ramp quantized into 8 levels — climbs in blocky steps instead of smoothly.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "ramp", cycles: 1, quantize: 8 })],
  },
  {
    name: "PWM Flicker",
    note: "Narrow duty-cycle pulses for a strobe/flicker feel.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "pwm", cycles: 6, previewCycles: 6, duty: 0.25 })],
  },
  {
    name: "Sine Pulse",
    note: "Smooth oscillation, 3 full cycles.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "sine", cycles: 3, previewCycles: 3, amplitude: 1 })],
  },
  {
    name: "Sawtooth Strobe",
    note: "Repeating ramp-and-snap pattern, 5 cycles.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "saw", cycles: 5, previewCycles: 5 })],
  },
  {
    name: "Staircase + Wobble",
    note: "Stacking demo: an 8-step staircase with a fast, low-amplitude sine riding on top.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [
      baseLayer({ type: "ramp", cycles: 1, quantize: 8 }),
      baseLayer({ type: "sine", cycles: 16, previewCycles: 16, amplitude: 0.08 }),
    ],
  },
  {
    name: "Linked Cycle Count",
    note: "Cycle count is pulled from a Fusion control instead of hardcoded.",
    progressSource: "Background1.Blend",
    normalize: true,
    layers: [baseLayer({ type: "square", cyclesMode: "linked", linkPath: "Custom1.CycleCount", previewCycles: 5 })],
  },
];
