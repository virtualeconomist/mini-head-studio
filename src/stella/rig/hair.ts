export type ModularHairId = 'none' | 'plush-bob'
export type HairLayerPart = 'back' | 'front'

export type HairPlacement = Readonly<{
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}>

export type ModularHairDefinition = Readonly<{
  id: Exclude<ModularHairId, 'none'>
  label: string
  description: string
  vector: true
  defaultPlacement: HairPlacement
}>

export const DEFAULT_HAIR_PLACEMENT: HairPlacement = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0
}

export const STELLA_MODULAR_HAIRS: readonly ModularHairDefinition[] = [
  {
    id: 'plush-bob',
    label: 'Plush Bob',
    description: 'First independent Stella hair shell. Vector back and fringe layers surround the reusable face rig.',
    vector: true,
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  }
] as const

export function modularHairDefinition(id: ModularHairId) {
  if (id === 'none') return null
  return STELLA_MODULAR_HAIRS.find((hair) => hair.id === id) ?? STELLA_MODULAR_HAIRS[0]!
}

export function normalizeHairPlacement(
  placement: Partial<HairPlacement> = {}
): HairPlacement {
  const scale = Number.isFinite(placement.scale) ? placement.scale! : 1
  return {
    offsetX: Number.isFinite(placement.offsetX) ? placement.offsetX! : 0,
    offsetY: Number.isFinite(placement.offsetY) ? placement.offsetY! : 0,
    scale: Math.max(0.82, Math.min(1.18, scale)),
    rotation: Math.max(-8, Math.min(8, Number.isFinite(placement.rotation) ? placement.rotation! : 0))
  }
}

function transformFor(placement: HairPlacement) {
  const { offsetX, offsetY, scale, rotation } = placement
  return `translate(${offsetX} ${offsetY}) translate(256 256) rotate(${rotation}) scale(${scale}) translate(-256 -256)`
}

/** Shared definitions for the independent Plush Bob vector shell. */
export function renderStellaHairDefs() {
  return `<defs data-hair-defs="plush-bob">
    <linearGradient id="plush-bob-base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#66564f"/>
      <stop offset="42%" stop-color="#4c403c"/>
      <stop offset="100%" stop-color="#302a29"/>
    </linearGradient>
    <linearGradient id="plush-bob-front" x1="0.18" y1="0.06" x2="0.78" y2="0.94">
      <stop offset="0" stop-color="#806b61"/>
      <stop offset="34%" stop-color="#5f504a"/>
      <stop offset="100%" stop-color="#3d3431"/>
    </linearGradient>
    <linearGradient id="plush-bob-highlight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="48%" stop-color="#fff1e9" stop-opacity=".2"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="plush-bob-shadow" x="-20%" y="-20%" width="140%" height="155%">
      <feDropShadow dx="0" dy="11" stdDeviation="10" flood-color="#211918" flood-opacity=".22"/>
    </filter>
    <filter id="plush-bob-soft" x="-10%" y="-10%" width="120%" height="130%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>`
}

/**
 * Returns SVG markup for one independent hair layer. It intentionally knows
 * nothing about expression state, so the same hair asset can surround every
 * rig expression without producing hair × expression combinations.
 */
export function renderStellaHairLayer(
  id: ModularHairId,
  part: HairLayerPart,
  placementInput: Partial<HairPlacement> = {}
) {
  if (id === 'none') return ''
  const placement = normalizeHairPlacement(placementInput)
  const transform = transformFor(placement)

  if (part === 'back') {
    return `<g data-hair-id="${id}" data-hair-layer="back" transform="${transform}" filter="url(#plush-bob-shadow)">
      <path d="M 79 242
        C 76 143 145 66 255 61
        C 365 64 435 143 433 244
        C 432 313 410 378 374 414
        C 355 433 335 443 309 447
        L 302 374
        C 346 353 374 306 374 244
        C 374 160 329 116 256 114
        C 183 116 138 160 138 244
        C 138 306 166 353 210 374
        L 203 447
        C 176 443 154 432 136 413
        C 100 375 80 312 79 242 Z"
        fill="url(#plush-bob-base)"/>
      <path d="M 104 232 C 96 302 112 365 148 405 C 163 422 178 431 198 436 L 198 380 C 164 353 145 306 146 248 C 145 197 157 158 181 132 C 132 153 109 187 104 232 Z"
        fill="#766158" opacity=".34"/>
      <path d="M 408 231 C 416 302 400 365 364 405 C 349 422 334 431 314 436 L 314 380 C 348 353 367 306 366 248 C 367 197 355 158 331 132 C 380 153 403 187 408 231 Z"
        fill="#211d1c" opacity=".28"/>
    </g>`
  }

  return `<g data-hair-id="${id}" data-hair-layer="front" transform="${transform}">
    <path d="M 111 222
      C 108 140 169 83 255 80
      C 345 83 404 142 401 226
      C 380 206 359 193 336 184
      C 311 174 286 171 257 171
      C 226 171 198 175 176 185
      C 151 195 131 207 111 222 Z"
      fill="url(#plush-bob-front)"/>
    <path d="M 120 207
      C 123 151 164 101 224 88
      C 193 109 178 137 177 177
      C 176 210 164 236 142 253
      C 130 245 122 227 120 207 Z"
      fill="#756157" opacity=".86"/>
    <path d="M 177 180
      C 177 125 210 92 250 84
      C 237 112 232 145 235 177
      C 236 209 225 232 204 248
      C 188 231 178 209 177 180 Z"
      fill="url(#plush-bob-front)"/>
    <path d="M 235 177
      C 233 132 243 101 262 84
      C 289 103 304 133 304 174
      C 304 210 292 234 270 249
      C 252 231 240 209 235 177 Z"
      fill="#51443f" opacity=".94"/>
    <path d="M 303 177
      C 305 136 292 106 271 87
      C 326 97 365 133 388 189
      C 386 219 375 242 355 258
      C 344 228 327 201 303 177 Z"
      fill="#403735"/>
    <path d="M 146 192 C 175 124 230 99 291 101 C 248 107 211 130 188 171 C 174 196 163 214 146 229 Z"
      fill="url(#plush-bob-highlight)" opacity=".5" filter="url(#plush-bob-soft)"/>
    <path d="M 357 177 C 373 188 387 204 398 224 C 397 263 391 292 381 316 C 374 284 365 256 350 235 C 343 218 346 194 357 177 Z"
      fill="#2e2928" opacity=".9"/>
    <path d="M 154 181 C 139 195 126 213 116 235 C 117 272 123 300 132 323 C 139 290 149 260 163 238 C 170 218 166 194 154 181 Z"
      fill="#705d55" opacity=".82"/>
  </g>`
}
