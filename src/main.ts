import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import App from './App.vue'
import './styles.css'
import { installFreeMotionToggle } from './free-motion'
import { installExpressionLoop } from './expression-loop'

createApp(App).mount('#app')
installFreeMotionToggle()
installExpressionLoop()
inject()
