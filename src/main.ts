import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import { installFreeMotionToggle } from './free-motion'
import { installExpressionLoop } from './expression-loop'

createApp(App).mount('#app')
installFreeMotionToggle()
installExpressionLoop()

if (new URLSearchParams(window.location.search).get('lab') === 'rig') {
  const mount = document.createElement('div')
  mount.id = 'rig-lab-root'
  document.body.append(mount)

  void import('./components/RigComparisonLab.vue').then(({ default: RigComparisonLab }) => {
    createApp(RigComparisonLab).mount(mount)
  })
}
