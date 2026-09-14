type ExpressionId = 'happy' | 'wink' | 'surprised' | 'cheeky' | 'sleepy' | 'love'
type TransitionStyle = 'crossfade' | 'pop' | 'blink' | 'snap'

type ExpressionOption = {
  id: ExpressionId
  label: string
  column: number
}

type LoopState = {
  enabled: boolean
  selected: ExpressionId[]
  intervalMs: number
  transition: TransitionStyle
}

const STORAGE_KEY = 'mini-head-expression-loop'
const EXPRESSIONS: readonly ExpressionOption[] = [
  { id: 'happy', label: 'Happy', column: 0 },
  { id: 'wink', label: 'Wink', column: 1 },
  { id: 'surprised', label: 'Surprised', column: 2 },
  { id: 'cheeky', label: 'Cheeky', column: 3 },
  { id: 'sleepy', label: 'Sleepy', column: 4 },
  { id: 'love', label: 'Love', column: 5 }
]
const INTERVALS = [400, 700, 1000, 1500] as const
const TRANSITIONS: readonly TransitionStyle[] = ['crossfade', 'pop', 'blink', 'snap']

function readState(): LoopState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<LoopState>
    const selected = Array.isArray(stored.selected)
      ? stored.selected.filter((id): id is ExpressionId => EXPRESSIONS.some((item) => item.id === id))
      : []
    return {
      enabled: stored.enabled === true && selected.length >= 2,
      selected: selected.length >= 2 ? selected.slice(0, 6) : ['happy', 'wink', 'cheeky'],
      intervalMs: INTERVALS.includes(stored.intervalMs as (typeof INTERVALS)[number]) ? stored.intervalMs! : 700,
      transition: TRANSITIONS.includes(stored.transition as TransitionStyle)
        ? stored.transition as TransitionStyle
        : 'pop'
    }
  } catch {
    return { enabled: false, selected: ['happy', 'wink', 'cheeky'], intervalMs: 700, transition: 'pop' }
  }
}

function saveState(state: LoopState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function currentHairRow() {
  const src = document.querySelector<HTMLImageElement>('.preview-frame .stella-head__image')?.src ?? ''
  const match = src.match(/stella-sprite-(\d+)\.webp/)
  if (!match) return 0
  return Math.max(0, Math.min(2, Math.floor(Number(match[1]) / EXPRESSIONS.length)))
}

function spritePath(row: number, expression: ExpressionId) {
  const column = EXPRESSIONS.find((item) => item.id === expression)?.column ?? 0
  return `/assets/stella/stella-sprite-${String(row * EXPRESSIONS.length + column).padStart(2, '0')}.webp`
}

function labelFor(expression: ExpressionId) {
  return EXPRESSIONS.find((item) => item.id === expression)?.label ?? expression
}

function transitionLabel(transition: TransitionStyle) {
  return transition.charAt(0).toUpperCase() + transition.slice(1)
}

function installStyles() {
  if (document.getElementById('mini-head-expression-loop-styles')) return
  const style = document.createElement('style')
  style.id = 'mini-head-expression-loop-styles'
  style.textContent = `
    .expression-loop-panel {
      margin: 18px 0 22px;
      padding: 16px;
      border: 1px solid rgb(23 21 20 / .14);
      border-radius: 20px;
      background: rgb(255 255 255 / .48);
    }
    .expression-loop__heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .expression-loop__heading h3 { margin:3px 0 0; font-size:15px; letter-spacing:-.02em; }
    .expression-loop__toggle {
      min-width: 72px; height: 34px; padding: 0 12px; border: 1px solid rgb(23 21 20 / .18);
      border-radius: 999px; background: #fff; cursor:pointer; font-size:10px; font-weight:900;
    }
    .expression-loop__toggle.is-active { background:#171514; color:#fff; border-color:#171514; }
    .expression-loop__intro { margin:10px 0 12px; color:#766f68; font-size:10px; line-height:1.45; }
    .expression-loop__grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
    .expression-loop__face {
      position:relative; min-width:0; padding:7px 6px 8px; border:1px solid transparent; border-radius:14px;
      background:rgb(255 255 255 / .7); cursor:pointer; text-align:center;
    }
    .expression-loop__face:hover { border-color:rgb(23 21 20 / .22); }
    .expression-loop__face.is-selected { border-color:#171514; box-shadow:0 0 0 1px #171514 inset; }
    .expression-loop__face img { display:block; width:100%; aspect-ratio:1; object-fit:contain; }
    .expression-loop__face span { display:block; margin-top:3px; font-size:9px; font-weight:850; }
    .expression-loop__order {
      position:absolute; top:6px; right:6px; width:20px; height:20px; border-radius:50%;
      display:grid !important; place-items:center; margin:0 !important; background:#d93333; color:#fff; font-size:9px !important;
    }
    .expression-loop__timeline { min-height:27px; margin:11px 0 3px; display:flex; flex-wrap:wrap; align-items:center; gap:5px; }
    .expression-loop__timeline-item { padding:5px 7px; border-radius:999px; background:#f4efe6; color:#766f68; font-size:9px; font-weight:800; transition:background 150ms ease,color 150ms ease,transform 150ms ease; }
    .expression-loop__timeline-item.is-current { background:#171514; color:#fff; transform:translateY(-1px); }
    .expression-loop__arrow { color:#aaa29a; font-size:10px; }
    .expression-loop__setting { margin-top:12px; }
    .expression-loop__setting-head { margin-bottom:7px; display:flex; justify-content:space-between; gap:10px; font-size:9px; color:#766f68; }
    .expression-loop__setting-head strong { color:#171514; font-size:10px; }
    .expression-loop__choices { display:flex; flex-wrap:wrap; gap:6px; }
    .expression-loop__choices button {
      min-height:30px; padding:0 9px; border:1px solid rgb(23 21 20 / .14); border-radius:10px;
      background:#fff; cursor:pointer; font-size:9px; font-weight:800;
    }
    .expression-loop__choices button.is-selected { background:#171514; color:#fff; border-color:#171514; }
    .expression-loop__hint { margin:10px 0 0; color:#8b837b; font-size:9px; line-height:1.4; }
    .expression-loop__status {
      position:absolute; z-index:6; top:58px; right:18px; min-height:30px; padding:0 10px;
      border:1px solid rgb(23 21 20 / .18); border-radius:999px; background:rgb(255 255 255 / .82);
      box-shadow:0 8px 24px rgb(23 21 20 / .08); backdrop-filter:blur(14px); color:#171514;
      display:none; align-items:center; gap:6px; cursor:pointer; font-size:9px; font-weight:850;
    }
    .preview-frame.expression-loop-active .expression-loop__status { display:flex; }
    .preview-frame .stella-head__motion { position:relative; }
    .preview-frame.expression-loop-active .stella-head__image { opacity:0; }
    .expression-loop-layer {
      position:absolute; inset:0; z-index:1; width:100%; height:100%; object-fit:contain; object-position:center;
      user-select:none; pointer-events:none; opacity:0; filter:drop-shadow(0 18px 20px rgb(28 20 15 / .13));
      transition-property:opacity,transform,filter; transition-duration:var(--expression-loop-transition,220ms);
      transition-timing-function:cubic-bezier(.2,.75,.25,1); will-change:opacity,transform,filter;
    }
    .preview-frame .stella-head__spark { z-index:2; }
    .expression-loop-layer--crossfade { transform:scale(1); }
    .expression-loop-layer--pop { transform:scale(.8) rotate(-2deg); }
    .expression-loop-layer--blink { transform:scaleY(.08) scaleX(.97); filter:blur(2px) drop-shadow(0 18px 20px rgb(28 20 15 / .13)); }
    .expression-loop-layer--snap { transform:translateY(5%) scale(1.07); filter:blur(7px) drop-shadow(0 18px 20px rgb(28 20 15 / .13)); }
    .expression-loop-layer.is-visible { opacity:1; transform:none; filter:drop-shadow(0 18px 20px rgb(28 20 15 / .13)); }
    @media (max-width:620px) {
      .expression-loop__grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .expression-loop__status { top:52px; right:13px; }
    }
    @media (prefers-reduced-motion:reduce) {
      .expression-loop-layer { transition-duration:.01ms !important; }
    }
  `
  document.head.append(style)
}

export function installExpressionLoop() {
  installStyles()

  const state = readState()
  let timer = 0
  let currentIndex = 0
  let activeLayer = 0
  let lastHairRow = currentHairRow()
  let syncScheduled = false

  const previewFrame = () => document.querySelector<HTMLElement>('.preview-frame')

  const ensureLayers = () => {
    const motion = document.querySelector<HTMLElement>('.preview-frame .stella-head__motion')
    if (!motion) return null
    let first = motion.querySelector<HTMLImageElement>('.expression-loop-layer[data-layer="0"]')
    let second = motion.querySelector<HTMLImageElement>('.expression-loop-layer[data-layer="1"]')
    if (!first) {
      first = document.createElement('img')
      first.className = 'expression-loop-layer'
      first.dataset.layer = '0'
      first.alt = ''
      first.setAttribute('aria-hidden', 'true')
      motion.append(first)
    }
    if (!second) {
      second = document.createElement('img')
      second.className = 'expression-loop-layer'
      second.dataset.layer = '1'
      second.alt = ''
      second.setAttribute('aria-hidden', 'true')
      motion.append(second)
    }
    return [first, second] as const
  }

  const ensureStatus = () => {
    const frame = previewFrame()
    if (!frame) return null
    let status = frame.querySelector<HTMLButtonElement>('.expression-loop__status')
    if (!status) {
      status = document.createElement('button')
      status.type = 'button'
      status.className = 'expression-loop__status'
      status.title = 'Turn expression loop off'
      status.addEventListener('click', () => {
        state.enabled = false
        saveState(state)
        restart()
      })
      frame.append(status)
    }
    return status
  }

  const updateCurrentMarkers = () => {
    const current = state.selected[currentIndex] ?? state.selected[0]
    document.querySelectorAll<HTMLElement>('.expression-loop__timeline-item').forEach((item) => {
      item.classList.toggle('is-current', item.dataset.expression === current)
    })
    const status = ensureStatus()
    if (status && current) {
      status.textContent = `↻ ${labelFor(current)} · ${state.selected.length} faces · ${(state.intervalMs / 1000).toFixed(1)}s`
    }
  }

  const showExpression = (expression: ExpressionId, immediate = false) => {
    const layers = ensureLayers()
    if (!layers) return
    const frame = previewFrame()
    if (!frame) return
    const transitionMs = Math.max(120, Math.min(320, Math.round(state.intervalMs * 0.32)))
    frame.style.setProperty('--expression-loop-transition', `${transitionMs}ms`)

    const current = layers[activeLayer]!
    const nextIndex = activeLayer === 0 ? 1 : 0
    const next = layers[nextIndex]!
    next.src = spritePath(currentHairRow(), expression)
    next.className = `expression-loop-layer expression-loop-layer--${state.transition}`

    if (immediate) {
      current.classList.remove('is-visible')
      next.style.transition = 'none'
      next.classList.add('is-visible')
      requestAnimationFrame(() => { next.style.transition = '' })
    } else {
      // Force the entering state to paint before we reveal it.
      void next.offsetWidth
      current.classList.remove('is-visible')
      next.classList.add('is-visible')
    }
    activeLayer = nextIndex
    updateCurrentMarkers()
  }

  const stopTimer = () => {
    window.clearInterval(timer)
    timer = 0
  }

  const deactivateLayers = () => {
    const frame = previewFrame()
    frame?.classList.remove('expression-loop-active')
    document.documentElement.classList.remove('mhs-expression-loop-active')
    const layers = ensureLayers()
    layers?.forEach((layer) => layer.classList.remove('is-visible'))
  }

  const tick = () => {
    if (!state.enabled || state.selected.length < 2) return
    currentIndex = (currentIndex + 1) % state.selected.length
    showExpression(state.selected[currentIndex]!)
  }

  const restart = () => {
    stopTimer()
    if (!state.enabled || state.selected.length < 2) {
      state.enabled = false
      deactivateLayers()
      renderPanel()
      updateCurrentMarkers()
      return
    }
    currentIndex = Math.min(currentIndex, state.selected.length - 1)
    previewFrame()?.classList.add('expression-loop-active')
    document.documentElement.classList.add('mhs-expression-loop-active')
    showExpression(state.selected[currentIndex]!, true)
    timer = window.setInterval(tick, state.intervalMs)
    renderPanel()
  }

  const toggleExpression = (expression: ExpressionId) => {
    const index = state.selected.indexOf(expression)
    if (index >= 0) state.selected.splice(index, 1)
    else if (state.selected.length < 6) state.selected.push(expression)
    if (state.selected.length < 2) state.enabled = false
    currentIndex = 0
    saveState(state)
    restart()
  }

  const panelMarkup = () => {
    const row = currentHairRow()
    const selectedOrder = new Map(state.selected.map((id, index) => [id, index + 1]))
    const faces = EXPRESSIONS.map((item) => {
      const order = selectedOrder.get(item.id)
      return `<button type="button" class="expression-loop__face${order ? ' is-selected' : ''}" data-expression="${item.id}" aria-pressed="${Boolean(order)}">
        <img src="${spritePath(row, item.id)}" alt="" />
        ${order ? `<i class="expression-loop__order">${order}</i>` : ''}
        <span>${item.label}</span>
      </button>`
    }).join('')
    const timeline = state.selected.map((id, index) =>
      `${index ? '<span class="expression-loop__arrow">→</span>' : ''}<span class="expression-loop__timeline-item${index === currentIndex && state.enabled ? ' is-current' : ''}" data-expression="${id}">${labelFor(id)}</span>`
    ).join('')
    const intervals = INTERVALS.map((value) =>
      `<button type="button" data-interval="${value}" class="${state.intervalMs === value ? 'is-selected' : ''}">${(value / 1000).toFixed(1)}s</button>`
    ).join('')
    const transitions = TRANSITIONS.map((value) =>
      `<button type="button" data-transition="${value}" class="${state.transition === value ? 'is-selected' : ''}">${transitionLabel(value)}</button>`
    ).join('')

    return `
      <div class="expression-loop__heading">
        <div><span class="eyebrow">FACE ANIMATION</span><h3>Expression Loop</h3></div>
        <button type="button" class="expression-loop__toggle${state.enabled ? ' is-active' : ''}" data-action="toggle" aria-pressed="${state.enabled}">${state.enabled ? 'ON' : 'OFF'}</button>
      </div>
      <p class="expression-loop__intro">Pick 2–6 faces. Selection order becomes playback order, independent of the head-motion preset.</p>
      <div class="expression-loop__grid">${faces}</div>
      <div class="expression-loop__timeline">${timeline}</div>
      <div class="expression-loop__setting">
        <div class="expression-loop__setting-head"><strong>Beat</strong><span>Time per face</span></div>
        <div class="expression-loop__choices">${intervals}</div>
      </div>
      <div class="expression-loop__setting">
        <div class="expression-loop__setting-head"><strong>Transition</strong><span>Between expressions</span></div>
        <div class="expression-loop__choices">${transitions}</div>
      </div>
      <p class="expression-loop__hint">Tip: Expression Loop can run at the same time as Bounce, Sway, Float, or Free Motion.</p>
    `
  }

  const ensurePanel = () => {
    const motionList = document.querySelector<HTMLElement>('.panel .motion-list')
    if (!motionList) return null
    let panel = document.querySelector<HTMLElement>('.expression-loop-panel')
    if (!panel) {
      panel = document.createElement('section')
      panel.className = 'expression-loop-panel'
      panel.addEventListener('click', (event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
        if (!target) return
        if (target.dataset.action === 'toggle') {
          if (state.selected.length < 2) return
          state.enabled = !state.enabled
          saveState(state)
          restart()
          return
        }
        const expression = target.dataset.expression as ExpressionId | undefined
        if (expression && EXPRESSIONS.some((item) => item.id === expression)) {
          toggleExpression(expression)
          return
        }
        const interval = Number(target.dataset.interval)
        if (INTERVALS.includes(interval as (typeof INTERVALS)[number])) {
          state.intervalMs = interval
          saveState(state)
          restart()
          return
        }
        const transition = target.dataset.transition as TransitionStyle | undefined
        if (transition && TRANSITIONS.includes(transition)) {
          state.transition = transition
          saveState(state)
          if (state.enabled) showExpression(state.selected[currentIndex]!, true)
          renderPanel()
        }
      })
      motionList.before(panel)
      panel.innerHTML = panelMarkup()
    }
    return panel
  }

  const renderPanel = () => {
    const panel = ensurePanel()
    if (panel) panel.innerHTML = panelMarkup()
    updateCurrentMarkers()
  }

  const sync = () => {
    syncScheduled = false
    ensureStatus()
    ensurePanel()
    const row = currentHairRow()
    const rowChanged = row !== lastHairRow
    lastHairRow = row
    if (rowChanged) {
      renderPanel()
      if (state.enabled) showExpression(state.selected[currentIndex]!, true)
    }
    if (state.enabled) {
      previewFrame()?.classList.add('expression-loop-active')
      document.documentElement.classList.add('mhs-expression-loop-active')
      const layers = ensureLayers()
      if (layers && !layers.some((layer) => layer.classList.contains('is-visible'))) {
        showExpression(state.selected[currentIndex]!, true)
      }
    }
    updateCurrentMarkers()
  }

  const scheduleSync = () => {
    if (syncScheduled) return
    syncScheduled = true
    requestAnimationFrame(sync)
  }

  const host = document.querySelector('#app')
  if (host) {
    new MutationObserver(scheduleSync).observe(host, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'src']
    })
  }

  sync()
  if (state.enabled) restart()
}
