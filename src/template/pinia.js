import { getCurrentInstance } from 'vue'
import { createPinia } from 'pinia'

let isPiniainstalled = false

export function setupPinia() {
  if (isPiniainstalled) return

  const instance = getCurrentInstance()
  instance.appContext.app.use(createPinia())
  isPiniainstalled = true
}
