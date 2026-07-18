# Aurelia Coachworks · The Grand Assembly Line

An interactive 3D **luxury grand-tourer assembly line game** — Next.js (App Router, TypeScript) + Three.js.

You are the line master at a fictional 1920s-style coachworks. Walk a bespoke motor car through eight stations — bare spaceframe to final sign-off — then certify six quality seals by hand before Commission Nº 001 is released from the atelier.

![Final sign-off](docs/signoff.png)

## Play it

```bash
git clone https://github.com/rohitguta2432/grand-assembly.git
cd grand-assembly
npm install
npm run dev          # http://localhost:4173
```

Append `?demo` to the URL for a ~15-second cinematic auto-run of the entire line (the mode used to record [docs/demo.mp4](docs/demo.mp4)).

## The eight stations

| # | Station | What happens |
|---|---------|--------------|
| 01 | The Spaceframe | Aluminium rails and cross-members fly in |
| 02 | The V12 Heart | 12-cylinder block with gold cam cover |
| 03 | Rolling Chassis | Forged eight-spoke wheels and suspension |
| 04 | The Marriage | The painted shell is lowered onto the chassis |
| 05 | Coach Doors | Rear-hinged doors, swung open and shut by ear |
| 06 | Brightwork | Pantheon grille, winged mascot, hand-painted coachline |
| 07 | The Bespoke Cabin | Cognac hides, walnut fascia, 90-fibre starlight headliner |
| 08 | Final Sign-Off | **Mini-game:** click six glowing seals to certify the car |

## Architecture

```
app/            Next.js App Router — layout (next/font), page, globals
components/     AssemblyGame.tsx — React HUD, driven by engine hooks
lib/engine.ts   Framework-agnostic Three.js engine (no React imports)
styles/         tokens.css — atelier design tokens (synced via DesignSync)
ds/             Component sheet for the Claude Design system project
```

The split is deliberate: **the engine knows nothing about React.** It renders the scene, runs the tween timeline and the QC raycasts, and reports everything through a small `GameHooks` interface. The React component owns every pixel of HUD and calls back through a 4-method `GameApi`. Swap the HUD without touching the 3D, or reuse the engine anywhere.

## How it works

- **Procedural car** — the entire grand tourer is ~120 Three.js primitives (boxes, cylinders, a torus) grouped into seven install units. No models, no textures downloaded.
- **Hand-rolled tween engine** — ~15 lines. Every part animates from 7 units above its resting place with staggered ease-out timing, so each station "rains" into position.
- **PMREM environment lighting** — metallic paint, chrome and gold get their colour from a baked `RoomEnvironment` map; without it, metals render black.
- **QC mini-game** — pulsing canvas-texture sprites raycast against pointer-up events (with a drag-distance guard so orbiting never triggers a stamp).
- **Cinematic camera** — every station has a framed camera position, lerped alongside OrbitControls so you can grab the wheel at any moment.
- **Design tokens** — the ivory/gold atelier theme lives in `styles/tokens.css` and is mirrored to a Claude Design system project ("Rohit Dev Tools UI") through DesignSync.

## Stack

Next.js 15 · React 19 · TypeScript · Three.js 0.161 · CSS custom-property tokens.

## License

MIT
