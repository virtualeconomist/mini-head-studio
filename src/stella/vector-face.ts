import type { ExpressionId } from './catalog'

const freckles = `
  <g fill="#d93333" opacity=".92">
    <circle cx="150" cy="305" r="5"/><circle cx="169" cy="316" r="4"/><circle cx="184" cy="299" r="3.5"/>
    <circle cx="362" cy="305" r="5"/><circle cx="343" cy="316" r="4"/><circle cx="328" cy="299" r="3.5"/>
  </g>`

const smile = `<path d="M239 326 Q256 340 273 326" fill="none" stroke="#c77d73" stroke-width="6" stroke-linecap="round"/>`
const openEyes = `<ellipse cx="199" cy="251" rx="21" ry="32" fill="#171514"/><ellipse cx="313" cy="251" rx="21" ry="32" fill="#171514"/>`

function features(expression: ExpressionId) {
  switch (expression) {
    case 'wink':
      return `<path d="M176 254 Q199 232 222 254 M290 254 Q313 232 336 254" fill="none" stroke="#171514" stroke-width="9" stroke-linecap="round"/>${smile}`
    case 'surprised':
      return `${openEyes}<circle cx="256" cy="333" r="13" fill="none" stroke="#b96860" stroke-width="7"/>`
    case 'cheeky':
      return `<path d="M177 235 L218 263 L178 280 M335 235 L294 263 L334 280" fill="none" stroke="#171514" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>${smile}`
    case 'sleepy':
      return `<path d="M177 257 Q199 278 221 257 M291 257 Q313 278 335 257" fill="none" stroke="#171514" stroke-width="8" stroke-linecap="round"/><path d="M246 330 Q256 324 266 330" fill="none" stroke="#c77d73" stroke-width="6" stroke-linecap="round"/>`
    case 'love':
      return `<path d="M198 279 C175 258 166 241 166 224 C166 204 190 197 199 216 C208 197 232 204 232 224 C232 241 222 258 198 279 Z M314 279 C291 258 282 241 282 224 C282 204 306 197 315 216 C324 197 348 204 348 224 C348 241 338 258 314 279 Z" fill="#d93333"/>${smile}`
    default:
      return `${openEyes}${smile}`
  }
}

/** A genuinely scalable, face-only asset. Raster plush hair remains outside this SVG. */
export function createStellaFaceSvg(expression: ExpressionId) {
  const label = `${expression.charAt(0).toUpperCase()}${expression.slice(1)} Stella expression`
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="skin" cx="44%" cy="32%" r="72%">
      <stop offset="0" stop-color="#fff3ea"/>
      <stop offset="1" stop-color="#f5cdb3"/>
    </radialGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#6f4936" flood-opacity=".18"/>
    </filter>
  </defs>
  <path d="M96 224 C96 130 163 82 256 82 C349 82 416 130 416 224 L416 302 C416 389 350 432 256 432 C162 432 96 389 96 302 Z" fill="url(#skin)" filter="url(#soft-shadow)"/>
  ${features(expression)}
  ${freckles}
</svg>`
}
