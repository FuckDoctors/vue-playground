<script setup lang="ts">
import { downloadProject } from '../download/download'
import { ref, onMounted } from 'vue'
import Sun from '../icons/Sun.vue'
import Moon from '../icons/Moon.vue'
import Share from '../icons/Share.vue'
import Download from '../icons/Download.vue'
import GitHub from '../icons/Github.vue'
import Setting from '../icons/Setting.vue'
import SettingDialog from './SettingDialog.vue'
// @ts-ignore

import {
  getSupportedEpVersions,
  getSupportedVueVersions,
} from '../utils/dependency'
import type { ComputedRef } from 'vue'
import type { ReplStore, VersionKey } from '@/composables/store'

const appVersion = import.meta.env.APP_VERSION
const replVersion = import.meta.env.REPL_VERSION

const nightly = $ref(false)

const { store } = defineProps<{
  store: ReplStore
}>()

// const emit = defineEmits(['change-deps'])
const emit = defineEmits<{
  (e: 'before-deps-change', key: VersionKey, version: string): void
  (e: 'deps-changed', key: VersionKey, version: string): void
}>()

interface Version {
  text: string
  title?: string
  published: ComputedRef<string[]>
  active: string
}

const versions = reactive<Record<VersionKey, Version>>({
  elementPlus: {
    text: 'Element+',
    title: 'Element Plus',
    published: getSupportedEpVersions($$(nightly)),
    active: store.versions.elementPlus,
  },
  vue: {
    text: 'Vue',
    published: getSupportedVueVersions(),
    active: store.versions.vue,
  },
})

const expandedState = reactive<Record<VersionKey, boolean>>({
  elementPlus: false,
  vue: false,
})

async function setVersion(key: VersionKey, v: string) {
  emit('before-deps-change', key, versions[key].active)
  expandedState[key] = false
  versions[key].active = `loading...`
  await store.setVersion(key, v)
  versions[key].active = v
  emit('deps-changed', key, versions[key].active)
}

const toggleNightly = (val: boolean) => {
  store.toggleNightly(val)
  setVersion('elementPlus', 'latest')
}

async function toggle(key: VersionKey) {
  collapseAll(key)
  expandedState[key] = !expandedState[key]
}

const collapseAll = (excludeKey: VersionKey | undefined = undefined) => {
  // Object.values(expandedState).forEach(v => (v = false))
  Object.entries(expandedState).forEach(([key, val]) => {
    if (key !== excludeKey) {
      expandedState[key as VersionKey] = false
    }
  })
}

async function copyLink() {
  await navigator.clipboard.writeText(location.href)
  alert('Sharable URL has been copied to clipboard.')
}
function toggleDark() {
  const cls = document.documentElement.classList
  cls.toggle('dark')
  localStorage.setItem(
    'vue-sfc-playground-prefer-dark',
    String(cls.contains('dark'))
  )
}

const showSettings = ref(false)
function toggleSetting() {
  showSettings.value = !showSettings.value
}

onMounted(async () => {
  window.addEventListener('click', () => {
    collapseAll()
  })
})
</script>

<template>
  <nav>
    <h1>
      <img alt="logo" src="../assets/logo.svg" />
      <span>Vue Playground</span>
    </h1>
    <div class="links">
      <div
        v-for="(v, key) of versions"
        :key="key"
        :title="v.title || v.text"
        class="flex items-center lt-sm-hidden version"
        @click.stop
      >
        <span class="active-version mr-1 truncate" @click="toggle(key)">
          {{ v.text }}: {{ v.active }}
        </span>
        <ul class="versions" :class="{ expanded: expandedState[key] }">
          <li v-if="!v.published"><a>loading versions...</a></li>
          <li v-for="version of v.published">
            <a @click="setVersion(key, version)">v{{ version }}</a>
          </li>
        </ul>
      </div>

      <button title="Toggle dark mode" class="toggle-dark" @click="toggleDark">
        <Sun class="light" />
        <Moon class="dark" />
      </button>
      <button title="Copy sharable URL" class="share" @click="copyLink">
        <Share />
      </button>
      <button
        title="Download project files"
        class="download"
        @click="downloadProject(store)"
      >
        <Download />
      </button>
      <button title="View on GitHub" class="github">
        <a href="https://github.com/FuckDoctors/vue-playground" target="_blank">
          <GitHub />
        </a>
      </button>
      <button title="Setting" class="setting" @click="toggleSetting">
        <Setting />
      </button>
    </div>
  </nav>
  <SettingDialog :show="showSettings" @close="showSettings = false" />
</template>

<style>
nav {
  --bg: #fff;
  --bg-light: #fff;
  --border: #ddd;
  color: var(--base);
  height: var(--nav-height);
  box-sizing: border-box;
  padding: 0 1em;
  background-color: var(--bg);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.33);
  position: relative;
  z-index: 999;
  display: flex;
  justify-content: space-between;
}
.dark nav {
  --base: #ddd;
  --bg: #1a1a1a;
  --bg-light: #242424;
  --border: #383838;
  box-shadow: none;
  border-bottom: 1px solid var(--border);
}
h1 {
  margin: 0;
  line-height: var(--nav-height);
  font-weight: 500;
  display: inline-block;
  vertical-align: middle;
}
h1 img {
  height: 24px;
  vertical-align: middle;
  margin-right: 10px;
  position: relative;
  top: -2px;
}
@media (max-width: 560px) {
  h1 span {
    font-size: 0.9em;
  }
}
@media (max-width: 520px) {
  h1 span {
    display: none;
  }
}
.links {
  display: flex;
}
.version {
  /* display: inline-block; */
  margin-right: 12px;
  position: relative;
}
.active-version {
  cursor: pointer;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  line-height: var(--nav-height);
  padding-right: 15px;
}
.active-version:after {
  content: '';
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid #aaa;
  position: absolute;
  right: 0;
  top: 22px;
}
.toggle-dark svg {
  width: 18px;
  height: 18px;
  fill: #666;
}
.toggle-dark .dark,
.dark .toggle-dark .light {
  display: none;
}
.dark .toggle-dark .dark {
  display: inline-block;
}
.version:hover .active-version:after {
  border-top-color: var(--base);
}
.dark .version:hover .active-version:after {
  border-top-color: #fff;
}
.versions {
  display: none;
  position: absolute;
  left: 0;
  top: 40px;
  background-color: var(--bg-light);
  border: 1px solid var(--border);
  border-radius: 4px;
  list-style-type: none;
  padding: 8px;
  margin: 0;
  width: 200px;
  max-height: calc(100vh - 70px);
  overflow: scroll;
}
.versions a {
  display: block;
  padding: 6px 12px;
  text-decoration: none;
  cursor: pointer;
  color: var(--base);
}
.versions a:hover {
  color: #3ca877;
}
.versions.expanded {
  display: block;
}
.share,
.download,
.github {
  margin: 0 2px;
}
</style>
