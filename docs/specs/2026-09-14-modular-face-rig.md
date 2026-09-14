# Mini Head Studio — Modular Face Rig

Status: Phase 0 foundation
Branch: `feature/modular-face-rig`

## Goal

Move Mini Head Studio away from one baked raster image per hair × expression combination and toward a reusable character rig where head art, hair, accessories, and facial expression state are separate concerns.

The first milestone is intentionally small: define a renderer-agnostic data model for face state, codify the current Stella expressions as presets, and provide deterministic interpolation utilities. The live app should continue using the existing sprite renderer until a later milestone proves visual parity.

## Principles

1. **Do not break the current app.** The sprite renderer remains the production fallback until the rig renderer is visually acceptable.
2. **Expressions are state, not files.** `happy`, `wink`, `surprised`, etc. should resolve to structured numeric parameters instead of final composite images.
3. **Hair is independent from expression.** Hair, accessories, and head art should eventually be swappable without requiring a new expression atlas.
4. **One expression engine, multiple renderers.** Preview and export should consume the same `FaceRigState` so browser animation and GIF/MP4/WebM output cannot drift apart.
5. **No Three.js dependency yet.** A 2D SVG/Canvas renderer is the smallest path to crisp, interpolatable facial features. Three.js remains an optional future renderer if we need true depth, parallax, lighting, or mesh deformation.
6. **Prefer continuous parameters.** Shape families use blend weights where possible so transitions can be smooth instead of abruptly switching artwork.

## Layer model

Future character composition should be conceptually split into:

- base head / skin
- rear hair
- face rig
  - left eye
  - right eye
  - left brow
  - right brow
  - mouth
  - blush
  - optional expression effects
- front hair
- accessories
- global head motion transform

The current Stella sprites remain available as a reference/fallback during migration.

## Rig state

A `FaceRigState` contains numeric values only. Renderer-specific SVG paths, Canvas commands, textures, or Three.js geometry should not live in expression presets.

### Eyes

Each eye stores:

- openness
- scale X/Y
- rotation
- X/Y offset
- pupil scale
- weighted shape mix (`oval`, `arc`, `heart`, `chevron`)

Shape weights allow transitions such as oval → heart to be implemented by opacity/geometry blending rather than one abrupt enum swap.

### Brows

Each brow stores:

- X/Y offset
- rotation
- arch

### Mouth

The mouth stores:

- width
- openness
- smile amount
- roundness
- vertical offset

### Blush/effects

Blush and expression effects are independent opacity/intensity channels so they can animate without changing the base face.

## Coordinate system

All layout values use a canonical `512 × 512` character coordinate system, matching the existing face SVG and Stella artwork.

A `CharacterRigManifest` owns reusable anchor points. Expression presets must not contain character-specific absolute positions.

Stella initial anchors are derived from the existing vector-face implementation:

- left eye: `(199, 251)`
- right eye: `(313, 251)`
- left brow: `(199, 211)`
- right brow: `(313, 211)`
- mouth: `(256, 330)`
- left blush: `(166, 307)`
- right blush: `(346, 307)`

These are starting values, not a claim that the current raster sprites can be perfectly reconstructed from vectors.

## Expression presets

Phase 0 codifies the existing six Stella expression IDs:

- happy
- wink
- surprised
- cheeky
- sleepy
- love

Presets are reusable `FaceRigState` objects. They should be treated as design data and may be tuned later after visual comparison against the source sprites.

## Interpolation

`interpolateFaceRigState(from, to, t)`:

- clamps `t` to `0…1`
- linearly interpolates every scalar
- interpolates every shape weight
- returns a new immutable state

This is intentionally renderer-agnostic. Easing belongs in the animation controller, not the interpolation primitive.

Suggested animation controller flow:

1. Resolve expression A preset.
2. Resolve expression B preset.
3. Compute eased progress.
4. Interpolate A → B.
5. Render resulting state.
6. Use the same state path for live preview and export frames.

## Migration milestones

### Phase 0 — foundation (this branch)

- typed rig state
- Stella manifest / anchors
- expression presets
- interpolation utilities
- unit tests
- no production renderer changes

### Phase 1 — experimental vector renderer

- implement `renderFaceRigSvg(state, manifest)`
- render eyes/mouth/brows/blush as separate vector layers
- add an internal/dev-only comparison view: sprite reference vs rig render
- tune presets until basic identity reads correctly

### Phase 2 — live expression engine

- replace the current sprite-to-sprite Expression Loop transition with rig-state interpolation
- preserve existing head motion and Free Motion as an independent transform layer
- maintain current raster sprite fallback behind a feature flag

### Phase 3 — unified export

- make GIF/MP4/WebM frame generation consume the same rig state sequence used by preview
- combine backdrop + head motion + face animation in each rendered frame
- verify deterministic timing between preview and export

### Phase 4 — modular character assets

- extract or author separate base-head, hair, and accessory assets
- define per-character manifests and anchors
- support multiple characters/hairs without expression-specific composites

### Phase 5 — optional Three.js renderer

Consider Three.js only if we need capabilities that materially justify WebGL complexity, such as:

- z-depth/parallax between hair, head, and accessories
- dynamic lights/shadows
- real mesh deformation or morph targets
- camera perspective beyond the current CSS-style head tilt

The rig data model should remain unchanged if this renderer is added.

## Non-goals for Phase 0

- no new dependency
- no Three.js
- no automatic tracing of raster artwork
- no removal of sprite assets
- no production UI rewrite
- no claim of perfect visual parity yet

## Acceptance criteria

Phase 0 is complete when:

- all six expression IDs resolve to valid rig states
- interpolation at `t=0` equals the source state
- interpolation at `t=1` equals the target state
- midpoint interpolation produces expected numeric averages
- shape weights remain normalized or intentionally bounded
- build and existing tests continue to pass

## Next implementation decision

After Phase 0, the next smallest useful experiment is a single SVG renderer for Stella's face only. It should render one expression and a 50% blend between two expressions side-by-side with the current sprite reference. That gives us a visual checkpoint before replacing any production animation code.
