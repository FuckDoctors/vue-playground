import { createApp } from 'vue'
import '@vue/repl/style.css'
import 'uno.css'

import { createPinia } from 'pinia'

import App from '@/App.vue'

// @ts-expect-error Custom window property
window.VUE_DEVTOOLS_CONFIG = {
  defaultSelectedAppId: 'repl',
}

const app = createApp(App)
app.use(createPinia())

app.mount('#app')
