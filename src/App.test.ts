// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import App from './App.vue'

afterEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

describe('Mini Head Studio shell', () => {
  it('renders advanced backdrop and cursor-follow controls', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    createApp(App).mount(host)

    expect(host.textContent).toContain('Gradient')
    expect(host.textContent).toContain('Image')

    const motionTab = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Motion')
    )
    motionTab?.click()
    await nextTick()

    expect(host.textContent).toContain('Cursor follow')
    expect(host.textContent).toContain('7 presets')
  })
})
