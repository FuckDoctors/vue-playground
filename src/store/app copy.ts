import { defineStore } from 'pinia'

export interface Feature {
  name: string
  enabled?: boolean
  version?: string | undefined
}

export interface AppState {
  cdn: string
  elementPlus: Feature
  pinia: Feature
}

export const useAppStore = defineStore('app', {
  state: () => {
    const appState: AppState = {
      cdn: useLocalStorage('setting-cdn', 'unpkg').value,
      elementPlus: {
        name: 'Element Plus',
        enabled: false,
        version: undefined,
      },
      pinia: {
        name: 'Pinia',
        enabled: false,
        version: undefined,
      },
    }

    return appState
  },
  getters: {
    cdn: (state) => state.cdn,
    isElementPlusEnabled: (state: AppState) => state.elementPlus.enabled,
    isPiniaEnabled: (state: AppState) => state.pinia.enabled,
    elementPlusVersion: (state: AppState) => state.elementPlus.version,
    piniaVersion: (state: AppState) => state.pinia.version,
  },
  actions: {
    toggleElementPlus: () => {
      this.elementPlus.enabled = !this.elementPlus.enabled
    },
    togglePinia: () => {
      this.pinia.enabled = !this.pinia.enabled
    },
    setElementPlusVersion: (version: string) => {
      this.elementPlus.version = version
    },
    setPiniaVersion: (version: string) => {
      this.pinia.version = version
    },
    setCdn: (cdn: string) => {
      this.cdn = cdn
    },
  },
})
