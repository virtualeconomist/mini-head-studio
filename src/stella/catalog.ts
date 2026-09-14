export const HAIRS = [
  { id: 'plush-bob', label: 'Plush Bob', detail: 'Stella original', row: 0 },
  { id: 'star-buns', label: 'Star Buns', detail: 'Playful twin buns', row: 1 },
  { id: 'soft-shag', label: 'Soft Shag', detail: 'Tousled plush crop', row: 2 }
] as const

export const EXPRESSIONS = [
  { id: 'happy', label: 'Happy', detail: 'Soft smile', column: 0 },
  { id: 'wink', label: 'Wink', detail: 'Playful hello', column: 1 },
  { id: 'surprised', label: 'Surprised', detail: 'Tiny gasp', column: 2 },
  { id: 'cheeky', label: 'Cheeky', detail: 'Big energy', column: 3 },
  { id: 'sleepy', label: 'Sleepy', detail: 'Quiet mode', column: 4 },
  { id: 'love', label: 'Love', detail: 'Heart eyes', column: 5 }
] as const

export const MOTIONS = [
  { id: 'idle', label: 'Soft idle', detail: 'Slow breathing', glyph: '○', duration: '3.2s', seconds: 3.2 },
  { id: 'bounce', label: 'Happy bounce', detail: 'Light and springy', glyph: '↟', duration: '1.1s', seconds: 1.1 },
  { id: 'pop', label: 'Surprise pop', detail: 'Fast reaction', glyph: '✦', duration: '0.75s', seconds: 0.75 },
  { id: 'sway', label: 'Sleepy sway', detail: 'Gentle side drift', glyph: '∿', duration: '2.8s', seconds: 2.8 },
  { id: 'spin', label: 'Star spin', detail: 'One clean turn', glyph: '↻', duration: '1.35s', seconds: 1.35 },
  { id: 'float', label: 'Dream float', detail: 'Soft hover loop', glyph: '⋆', duration: '2.4s', seconds: 2.4 },
  { id: 'follow', label: 'Cursor follow', detail: 'Tracks your pointer', glyph: '⌁', duration: 'LIVE', seconds: 3.2 }
] as const

export type HairId = (typeof HAIRS)[number]['id']
export type ExpressionId = (typeof EXPRESSIONS)[number]['id']
export type MotionId = (typeof MOTIONS)[number]['id']

export function spritePath(hairId: HairId, expressionId: ExpressionId) {
  const hair = HAIRS.find((item) => item.id === hairId) ?? HAIRS[0]
  const expression = EXPRESSIONS.find((item) => item.id === expressionId) ?? EXPRESSIONS[0]
  const index = hair.row * EXPRESSIONS.length + expression.column
  return `/assets/stella/stella-sprite-${String(index).padStart(2, '0')}.webp`
}
