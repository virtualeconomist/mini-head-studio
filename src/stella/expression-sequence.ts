import { EXPRESSIONS, type ExpressionId } from './catalog'

export type SequenceEasingId = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
export type SequenceTransitionStyle = 'crossfade' | 'pop' | 'blink' | 'snap'

export type ExpressionSequenceStep = Readonly<{
  expression: ExpressionId
  holdMs: number
}>

export type ExpressionSequence = Readonly<{
  steps: readonly ExpressionSequenceStep[]
  transitionMs: number
  easing: SequenceEasingId
  easeStrength: number
  seamless: boolean
  transitionStyle: SequenceTransitionStyle
}>

export type ExpressionSequenceSample = Readonly<{
  stepIndex: number
  nextIndex: number
  from: ExpressionId
  to: ExpressionId
  rawProgress: number
  easedProgress: number
  inTransition: boolean
}>

export type StoredExpressionLoopState = Readonly<{
  enabled: boolean
  selected: readonly ExpressionId[]
  intervalMs: number
  transition: SequenceTransitionStyle
}>

const STORAGE_KEY = 'mini-head-expression-loop'
const VALID_EXPRESSIONS = new Set<ExpressionId>(EXPRESSIONS.map((item) => item.id))
const VALID_TRANSITIONS = new Set<SequenceTransitionStyle>(['crossfade', 'pop', 'blink', 'snap'])

export function applySequenceEasing(value: number, easing: SequenceEasingId, strength = 2.4) {
  const t = Math.max(0, Math.min(1, value))
  const power = Math.max(1, strength)
  if (easing === 'linear') return t
  if (easing === 'ease-in') return Math.pow(t, power)
  if (easing === 'ease-out') return 1 - Math.pow(1 - t, power)
  return t < 0.5
    ? 0.5 * Math.pow(t * 2, power)
    : 1 - 0.5 * Math.pow((1 - t) * 2, power)
}

export function expressionSequenceDurationMs(sequence: ExpressionSequence) {
  if (!sequence.steps.length) return 0
  const holdDuration = sequence.steps.reduce((total, step) => total + Math.max(0, step.holdMs), 0)
  const transitionCount = sequence.seamless
    ? sequence.steps.length
    : Math.max(0, sequence.steps.length - 1)
  return holdDuration + transitionCount * Math.max(0, sequence.transitionMs)
}

export function sampleExpressionSequence(
  sequence: ExpressionSequence,
  elapsedMs: number
): ExpressionSequenceSample {
  const steps = sequence.steps
  if (!steps.length) {
    return {
      stepIndex: 0,
      nextIndex: 0,
      from: 'happy',
      to: 'happy',
      rawProgress: 0,
      easedProgress: 0,
      inTransition: false
    }
  }

  if (steps.length === 1) {
    return {
      stepIndex: 0,
      nextIndex: 0,
      from: steps[0]!.expression,
      to: steps[0]!.expression,
      rawProgress: 0,
      easedProgress: 0,
      inTransition: false
    }
  }

  const duration = expressionSequenceDurationMs(sequence)
  if (duration <= 0) {
    return {
      stepIndex: 0,
      nextIndex: 0,
      from: steps[0]!.expression,
      to: steps[0]!.expression,
      rawProgress: 0,
      easedProgress: 0,
      inTransition: false
    }
  }

  const normalizedElapsed = ((elapsedMs % duration) + duration) % duration
  let cursor = 0

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]!
    const holdMs = Math.max(0, step.holdMs)
    if (normalizedElapsed < cursor + holdMs) {
      return {
        stepIndex: index,
        nextIndex: index,
        from: step.expression,
        to: step.expression,
        rawProgress: 0,
        easedProgress: 0,
        inTransition: false
      }
    }
    cursor += holdMs

    const hasNext = index < steps.length - 1 || sequence.seamless
    if (!hasNext) continue

    const nextIndex = index < steps.length - 1 ? index + 1 : 0
    const transitionMs = Math.max(0, sequence.transitionMs)
    if (transitionMs <= 0) continue

    if (normalizedElapsed < cursor + transitionMs) {
      const rawProgress = (normalizedElapsed - cursor) / transitionMs
      return {
        stepIndex: index,
        nextIndex,
        from: step.expression,
        to: steps[nextIndex]!.expression,
        rawProgress,
        easedProgress: applySequenceEasing(rawProgress, sequence.easing, sequence.easeStrength),
        inTransition: true
      }
    }
    cursor += transitionMs
  }

  const lastIndex = steps.length - 1
  return {
    stepIndex: lastIndex,
    nextIndex: lastIndex,
    from: steps[lastIndex]!.expression,
    to: steps[lastIndex]!.expression,
    rawProgress: 0,
    easedProgress: 0,
    inTransition: false
  }
}

export function readStoredExpressionLoopState(): StoredExpressionLoopState {
  if (typeof window === 'undefined') {
    return { enabled: false, selected: ['happy', 'wink', 'cheeky'], intervalMs: 700, transition: 'pop' }
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<StoredExpressionLoopState>
    const selected = Array.isArray(stored.selected)
      ? stored.selected.filter((id): id is ExpressionId => VALID_EXPRESSIONS.has(id as ExpressionId)).slice(0, 6)
      : []
    const intervalMs = typeof stored.intervalMs === 'number'
      ? Math.max(200, Math.min(3000, stored.intervalMs))
      : 700
    const transition = VALID_TRANSITIONS.has(stored.transition as SequenceTransitionStyle)
      ? stored.transition as SequenceTransitionStyle
      : 'pop'

    return {
      enabled: stored.enabled === true && selected.length >= 2,
      selected: selected.length >= 2 ? selected : ['happy', 'wink', 'cheeky'],
      intervalMs,
      transition
    }
  } catch {
    return { enabled: false, selected: ['happy', 'wink', 'cheeky'], intervalMs: 700, transition: 'pop' }
  }
}

/** Converts the current raster Expression Loop settings into the shared timeline model. */
export function sequenceFromStoredExpressionLoop(
  state = readStoredExpressionLoopState()
): ExpressionSequence | null {
  if (!state.enabled || state.selected.length < 2) return null
  const transitionMs = Math.max(120, Math.min(320, Math.round(state.intervalMs * 0.32)))
  const holdMs = Math.max(0, state.intervalMs - transitionMs)
  return {
    steps: state.selected.map((expression) => ({ expression, holdMs })),
    transitionMs,
    easing: 'ease-in-out',
    easeStrength: 2.2,
    seamless: true,
    transitionStyle: state.transition
  }
}
