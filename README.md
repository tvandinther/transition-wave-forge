# transition-wave-forge

**Wave Expression Forge** — interactively build a stacked-oscillator transition waveform
and export it as a single-line expression for DaVinci Resolve Fusion.

Stack ramp/saw/square/PWM/sine layers, tweak amplitude, cycles (fixed or linked to a
Fusion control), phase, duty cycle and quantization, watch the combined curve on a live
scope, then copy the generated expression straight into a Fusion expression field. The
expression is normalized so it always starts at 0 and ends at 1, regardless of the shape
in between.

## Stack

Vite + React + TypeScript + Tailwind CSS v4. Ships as a static site with no backend.

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build locally
npm run lint      # oxlint
```

## Deploying to Cloudflare Pages

**Dashboard (Git integration):**

1. Push this repo to GitHub/GitLab and connect it in the Cloudflare Pages dashboard.
2. Build command: `npm run build`
3. Build output directory: `dist`

**CLI:**

```bash
npm run build
npx wrangler pages deploy dist
```

A `wrangler.toml` is included with the project name and output directory preconfigured.
