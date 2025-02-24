import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './reset.css'
import './style.css'
import App from './App.vue'
import { router } from './routes'

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
