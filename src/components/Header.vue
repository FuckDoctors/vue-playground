<script setup lang="ts">
import { languageToolsVersion } from '@vue/repl'
import { downloadProject } from '@/download/download'
import {
  cdn,
  getSupportedEpVersions,
  getSupportedPiniaVersions,
  getSupportedTSVersions,
  getSupportedVueVersions,
} from '@/utils/dependency'
import type { Store, VersionKey } from '@/composables/store'

import type { Ref } from 'vue'

const replVersion = import.meta.env.REPL_VERSION

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
const nightly = ref(false)
const dark = useDark()
const toggleDark = useToggle(dark)

const showSettingDrawer = ref(false)

const { store } = defineProps<{
  store: Store
}>()

interface Version {
  text: string
  published: Ref<string[]>
  active: string
}

const versions = reactive<Record<VersionKey, Version>>({
  elementPlus: {
    text: 'Element Plus',
    published: getSupportedEpVersions(nightly),
    active: store.versions.elementPlus,
  },
  vue: {
    text: 'Vue',
    published: getSupportedVueVersions(),
    active: store.versions.vue,
  },
  typescript: {
    text: 'TypeScript',
    published: getSupportedTSVersions(),
    active: store.versions.typescript,
  },
  pinia: {
    text: 'Pinia',
    published: getSupportedPiniaVersions(),
    active: store.versions.pinia,
  },
})

async function setVersion(key: VersionKey, v: string) {
  versions[key].active = `loading...`
  await store.setVersion(key, v)
  versions[key].active = v
}

const toggleNightly = () => {
  store.toggleNightly(nightly.value)
  setVersion('elementPlus', 'latest')
}

async function copyLink() {
  await navigator.clipboard.writeText(location.href)
  ElMessage.success('Sharable URL has been copied to clipboard.')
}

async function download() {
  await downloadProject(store)
}

function showSettings() {
  showSettingDrawer.value = true
}

function refreshView() {
  emit('refresh')
}
</script>

<template>
  <nav>
    <div leading="[var(--nav-height)]" m-0 flex items-center font-medium>
      <img relative mr-2 h-24px v="mid" top="-2px" alt="logo" src="../assets/logo.svg" />
      <div flex="~ gap-1" items-center lt-sm-hidden>
        <div text-xl>Playground</div>
        <el-tag size="small">repl v{{ replVersion }}</el-tag>
      </div>
    </div>

    <div flex="~ gap-2" items-center>
      <div flex="~ gap-4" text-lg>
        <button i-ri-refresh-line hover:color-primary @click="refreshView" />
        <button i-ri-share-line hover:color-primary @click="copyLink" />
        <button i-ri-download-line hover:color-primary @click="download" />
        <button i-ri-sun-line dark:i-ri-moon-line hover:color-primary @click="toggleDark()" />
        <a href="https://github.com/FuckDoctors/vue-playground" target="_blank" flex hover:color-primary>
          <button title="View on GitHub" i-ri-github-fill />
        </a>

        <button i-ri:settings-line hover:color-primary @click="showSettings" />
      </div>
    </div>
  </nav>

  <el-drawer v-model="showSettingDrawer" title="Settings" direction="rtl" size="300">
    <el-form :label-width="110">
      <el-form-item label="CDN">
        <el-select v-model="cdn">
          <el-option value="jsdelivr" label="jsDelivr" />
          <el-option value="jsdelivr-fastly" label="jsDelivr Fastly" />
          <el-option value="unpkg" label="unpkg" />
          <el-option value="npmmirror" label="npmmirror" />
        </el-select>
      </el-form-item>

      <template v-for="(v, key) of versions" :key="key">
        <el-form-item :label="v.text">
          <el-select :model-value="v.active" @update:model-value="setVersion(key, $event)">
            <el-option v-for="ver of v.published" :key="ver" :value="ver">
              {{ ver }}
            </el-option>
          </el-select>

          <el-checkbox v-if="key === 'elementPlus'" v-model="nightly" ml-1 @change="toggleNightly">
            nightly
          </el-checkbox>
        </el-form-item>
      </template>
    </el-form>
  </el-drawer>
</template>

<style lang="scss">
nav {
  --bg: #fff;
  --bg-light: #fff;
  --border: #ddd;

  --at-apply: 'box-border flex justify-between px-4 z-999 relative';

  height: var(--nav-height);
  background-color: var(--bg);
  box-shadow: 0 0 6px var(--el-color-primary);
}

.dark nav {
  --bg: #1a1a1a;
  --bg-light: #242424;
  --border: #383838;

  --at-apply: 'shadow-none';
  border-bottom: 1px solid var(--border);
}
</style>
