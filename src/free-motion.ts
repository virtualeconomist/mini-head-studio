type EditorTab = 'character' | 'motion'

type MotionSnapshot = {
  motionLabel: string
  playing: boolean
  tab: EditorTab
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

function buttons(selector: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(selector))
}

function railButton(label: string) {
  return buttons('.rail__button').find((button) => button.textContent?.trim().includes(label))
}

function currentTab(): EditorTab {
  return railButton('Motion')?.classList.contains('rail__button--active') ? 'motion' : 'character'
}

function currentMotionLabel() {
  const summary = document.querySelector('.preview-copy p')?.textContent ?? ''
  return summary.split('·').at(-1)?.trim() || 'Soft idle'
}

function isPlaying() {
  return document.querySelector<HTMLButtonElement>('.transport__play')?.textContent?.trim() === 'Ⅱ'
}

function setPlaying(playing: boolean) {
  const control = document.querySelector<HTMLButtonElement>('.transport__play')
  if (!control || isPlaying() === playing) return
  const wasDisabled = control.disabled
  control.disabled = false
  control.click()
  control.disabled = wasDisabled
}

function isFollowing() {
  return document.querySelector('.preview-frame')?.classList.contains('preview-frame--follow') ?? false
}

async function showTab(tab: EditorTab) {
  const control = railButton(tab === 'motion' ? 'Motion' : 'Character')
  if (!control?.classList.contains('rail__button--active')) {
    control?.click()
    await nextFrame()
  }
}

async function selectMotion(label: string) {
  await showTab('motion')
  const card = buttons('.motion-card').find((button) => button.textContent?.includes(label))
  if (!card) throw new Error(`Motion control not found: ${label}`)
  card.click()
  await nextFrame()
}

function installStyles() {
  if (document.getElementById('mini-head-free-motion-styles')) return
  const style = document.createElement('style')
  style.id = 'mini-head-free-motion-styles'
  style.textContent = `
    .preview-frame__follow-toggle {
      position: absolute;
      z-index: 6;
      top: 18px;
      right: 18px;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid rgb(23 21 20 / .2);
      border-radius: 999px;
      background: rgb(255 255 255 / .82);
      color: #171514;
      box-shadow: 0 8px 24px rgb(23 21 20 / .08);
      backdrop-filter: blur(14px);
      cursor: pointer;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .02em;
      transition: transform 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    .preview-frame__follow-toggle:hover { transform: translateY(-1px); border-color: rgb(23 21 20 / .38); }
    .preview-frame__follow-toggle.is-active { background: #171514; color: #fff; border-color: #171514; }
    .preview-frame--follow .stella-head__shadow,
    .preview-frame--follow .stella-head__spark { animation: none !important; }
    .mhs-cursor-follow-active .transport__track span { animation-play-state: paused !important; }
    .mhs-cursor-follow-active .transport__play,
    .mhs-cursor-follow-active .transport__replay,
    .mhs-cursor-follow-active .speed-control { opacity: .45; }
    @media (max-width: 620px) {
      .preview-frame__follow-toggle { top: 13px; right: 13px; min-height: 32px; padding: 0 10px; font-size: 9px; }
    }
  `
  document.head.append(style)
}

export function installFreeMotionToggle() {
  installStyles()

  let snapshot: MotionSnapshot | null = null
  let switching = false

  const ensureButton = () => {
    const frame = document.querySelector<HTMLElement>('.preview-frame')
    if (!frame) return null
    let button = frame.querySelector<HTMLButtonElement>('.preview-frame__follow-toggle')
    if (!button) {
      button = document.createElement('button')
      button.type = 'button'
      button.className = 'preview-frame__follow-toggle'
      button.addEventListener('click', async () => {
        if (switching) return
        switching = true
        button!.disabled = true
        try {
          if (isFollowing()) {
            const targetMotion = snapshot?.motionLabel && snapshot.motionLabel !== 'Cursor follow'
              ? snapshot.motionLabel
              : 'Soft idle'
            const targetPlaying = snapshot?.playing ?? true
            const targetTab = snapshot?.tab ?? currentTab()
            await selectMotion(targetMotion)
            setPlaying(targetPlaying)
            await showTab(targetTab)
            snapshot = null
          } else {
            snapshot = {
              motionLabel: currentMotionLabel(),
              playing: isPlaying(),
              tab: currentTab()
            }
            await selectMotion('Cursor follow')
            setPlaying(false)
            await showTab(snapshot.tab)
          }
        } catch (error) {
          console.error('[cursor-follow] toggle failed', error)
        } finally {
          switching = false
          button!.disabled = false
          sync()
        }
      })
      frame.append(button)
    }
    return button
  }

  const sync = () => {
    const button = ensureButton()
    const active = isFollowing()
    document.documentElement.classList.toggle('mhs-cursor-follow-active', active)

    // Cursor-follow is deliberately non-animated. This also catches activation
    // from the existing Motion card instead of only the preview toggle.
    if (active && isPlaying()) setPlaying(false)

    if (button) {
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
      button.setAttribute(
        'aria-label',
        active ? 'Disable cursor follow and restore the previous motion' : 'Enable free-motion cursor follow'
      )
      const label = active ? '● Free Motion On' : '⌁ Cursor Follow'
      if (button.textContent !== label) button.textContent = label
    }

    const play = document.querySelector<HTMLButtonElement>('.transport__play')
    const replay = document.querySelector<HTMLButtonElement>('.transport__replay')
    const speed = document.querySelector<HTMLInputElement>('.speed-control input')
    if (play) play.disabled = active
    if (replay) replay.disabled = active
    if (speed) speed.disabled = active
  }

  sync()
  const host = document.querySelector('#app')
  if (!host) return

  const observer = new MutationObserver(() => {
    if (!switching) sync()
  })
  observer.observe(host, { subtree: true, attributes: true, attributeFilter: ['class'] })
}
