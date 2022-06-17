<script setup lang="ts">
import { getSupportedEpVersions } from '@/utils/dependency'
import { useAppStore } from '../store/app'

const props = defineProps<{
  show?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const appStore = useAppStore()
const { toggleElementPlus, togglePinia, setCdn, setElementPlusVersion } =
  appStore

const show = ref(props.show)
watch(
  () => props.show,
  (val) => {
    console.log('watch show', val)
    show.value = val
  }
)

const close = () => {
  show.value = false
  emit('close')
}

const cdns = [
  {
    name: 'Unpkg',
    value: 'unpkg',
  },
  {
    name: 'JsDelivr',
    value: 'jsdelivr',
  },
  {
    name: 'JsDelivr Fastly',
    value: 'jsdelivr-fastly',
  },
]
const handleCdnChange = (evt: Event) => {
  const target = evt.target as HTMLSelectElement
  setCdn(target.value)
}

const expandedState = reactive<Record<string, boolean>>({
  elementPlus: false,
  vue: false,
})

async function setVersion(key: string, v: string) {
  expandedState[key] = false
  if (key === 'elementPlus') {
    setElementPlusVersion(v)
  }
}

async function toggle(key: string) {
  collapseAll(key)
  expandedState[key] = !expandedState[key]
}

const collapseAll = (excludeKey: string | undefined = undefined) => {
  Object.entries(expandedState).forEach(([key]) => {
    if (key !== excludeKey) {
      expandedState[key] = false
    }
  })
}

const epVersions = getSupportedEpVersions(false)
</script>

<template>
  <div class="setting" :class="{ show: show }">
    <div class="header">
      <button @click="close" title="关闭">X</button>
    </div>
    <div class="item">
      <div class="title">CDN</div>
      <div class="control">
        <select :value="appStore.cdn" @change="handleCdnChange">
          <option v-for="cdn in cdns" :value="cdn.value">{{ cdn.name }}</option>
        </select>
      </div>
    </div>
    <div class="item">
      <div class="title">Element-Plus</div>
      <div class="control">
        <label>
          <input
            type="checkbox"
            :checked="appStore.isElementPlusEnabled"
            @click="toggleElementPlus"
          />
          启用
        </label>
      </div>
    </div>
    <div class="item">
      <div class="title"></div>
      <div class="control">
        <div class="flex items-center version">
          <div
            class="active-version mr-1 truncate"
            @click="toggle('elementPlus')"
          >
            {{ appStore.elementPlusVersion }}
          </div>
          <ul
            class="versions"
            :class="{ expanded: expandedState['elementPlus'] }"
          >
            <li v-if="!epVersions || epVersions.length === 0">
              <a>loading versions...</a>
            </li>
            <li v-for="version of epVersions">
              <a @click="setVersion('elementPlus', version)">v{{ version }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="item">
      <div class="title">Pinia</div>
      <div class="control">
        <label>
          <input
            type="checkbox"
            :checked="appStore.isPiniaEnabled"
            @click="togglePinia"
          />
          启用
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 9999;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  width: 200px;
  height: 100%;
  overflow-y: auto;
  transform: translateX(calc(200px + 2rem));
  transition: transform 0.3s ease-in-out;
}
.setting.show {
  transform: translateX(0);
}

.setting .header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.setting .item {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.setting .title {
  font-size: 0.9em;
  font-weight: 500;
  margin-bottom: 0.5rem;
  width: 100px;
}
.setting .control {
  flex: 1;
  display: flex;
}

.setting .active-version {
  line-height: normal;
}
.setting .active-version:after {
  top: 7px;
}
.setting .versions {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  top: 20px;
  width: auto;
  z-index: 10000;
  max-height: 500px;
  overflow-y: auto;
}
</style>
