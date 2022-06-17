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

const cdnRef = useLocalStorage('setting-cdn', 'unpkg')

export const useAppStore = defineStore('app', {
  state: () => {
    return {
      cdn: cdnRef.value,
      elementPlus: {
        name: 'Element Plus',
        enabled: false,
        version: 'latest',
      },
      pinia: {
        name: 'Pinia',
        enabled: false,
        version: 'latest',
      },
    }
  },
  getters: {
    isElementPlusEnabled: (state) => state.elementPlus.enabled,
    isPiniaEnabled: (state) => state.pinia.enabled,
    elementPlusVersion: (state) => state.elementPlus.version,
    piniaVersion: (state) => state.pinia.version,
  },
  actions: {
    toggleElementPlus() {
      this.elementPlus.enabled = !this.elementPlus.enabled
    },
    togglePinia() {
      this.pinia.enabled = !this.pinia.enabled
    },
    setElementPlusVersion(version: string) {
      this.elementPlus.version = version
    },
    setPiniaVersion(version: string) {
      this.pinia.version = version
    },
    setCdn(cdn: string) {
      this.cdn = cdn
      cdnRef.value = cdn
    },
  },
})
