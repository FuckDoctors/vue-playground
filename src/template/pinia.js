import { createPinia } from 'pinia'
import { getCurrentInstance } from 'vue'

let isPiniainstalled = false

export function setupPinia() {
  if (isPiniainstalled) return

  const instance = getCurrentInstance()
  instance.appContext.app.use(createPinia())
  isPiniainstalled = true
}
