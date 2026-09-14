import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import { installFreeMotionToggle } from './free-motion'

createApp(App).mount('#app')
installFreeMotionToggle()
