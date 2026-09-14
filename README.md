# Mini Head Studio

A head-only character customizer and motion playground derived from the interaction ideas in [bloub](https://github.com/jeremy-prt/bloub). Stella is the first reference character used to validate the system.

## Prototype features

- Three interchangeable Stella hairstyles
- Six expressions: Happy, Wink, Surprised, Cheeky, Sleepy, and Love
- Six looping motion presets with play, pause, replay, and speed controls
- Four preview/export backgrounds, including transparency
- One-click 1024 × 1024 PNG export
- Configurable motion export to GIF, MP4, or WebM with resolution, frame-rate, background, quality, and watermark controls
- Local persistence for the active look and motion
- Responsive desktop and mobile layouts

The first prototype intentionally uses a precomposed 3 × 6 sprite matrix. This makes every hair/expression combination seamless while validating the product experience. A production asset pack can later replace these images with independent back-hair, face, facial-feature, and front-hair layers without changing the selector API.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5190>.

```bash
pnpm test
pnpm build
```

## Asset map

The production-ready WebP sprites live in `public/assets/stella/`. The generated source atlas and lossless PNG masters are retained in `design-assets/stella/`, outside the deployed public bundle. The mapping is defined in `src/stella/catalog.ts`.

## Attribution

The original repository is MIT licensed. Its original license and copyright notice remain in `LICENSE`. Stella artwork in this prototype is project-specific and is not part of the upstream Bloub design.
