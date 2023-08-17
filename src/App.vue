<script setup lang="ts">
import { Repl, type SFCOptions } from '@vue/repl'
import Monaco from '@vue/repl/monaco-editor'
import { type ImportMap } from '@/utils/import-map'
import { type UserOptions } from '@/composables/store'

const loading = ref(true)

// enable experimental features
const sfcOptions: SFCOptions = {
  script: {
    reactivityTransform: true,
    defineModel: true,
  },
}

const initialUserOptions: UserOptions = {}

const debug = new URLSearchParams(location.search).get('debug')
if (debug) {
  initialUserOptions.showHidden = true
}

const showOutput = new URLSearchParams(location.search).get('showOutput')
if (showOutput) {
  initialUserOptions.showOutput = true
}

const showCompileOutput = new URLSearchParams(location.search).get(
  'showCompileOutput'
)
if (showCompileOutput) {
  initialUserOptions.showCompileOutput = true
}

const layout = new URLSearchParams(location.search).get('layout')
if (layout?.toLowerCase() === 'vertical') {
  initialUserOptions.layout = 'vertical'
} else {
  // initialUserOptions.layout = 'vertical'
  initialUserOptions.layout = 'horizontal'
}

const store = useStore({
  serializedState: location.hash.slice(1),
  userOptions: initialUserOptions,
})

// if (pr) {
//   const map: ImportMap = {
//     imports: {
//       'element-plus': `https://preview-${pr}-element-plus.surge.sh/bundle/index.full.min.mjs`,
//       'element-plus/': 'unsupported',
//     },
//   }
//   store.state.files[IMPORT_MAP].code = JSON.stringify(map, undefined, 2)
//   const url = `${location.origin}${location.pathname}#${store.serialize()}`
//   history.replaceState({}, '', url)
// }

store.init().then(() => (loading.value = false))

// eslint-disable-next-line no-console
// console.log('Store:', store)

const handleKeydown = (evt: KeyboardEvent) => {
  if ((evt.ctrlKey || evt.metaKey) && evt.code === 'KeyS') {
    evt.preventDefault()
    return
  }
}

const dark = useDark()

// persist state
watchEffect(() => history.replaceState({}, '', `#${store.serialize()}`))
</script>

<template>
  <div v-if="!loading" antialiased>
    <Header :store="store" />
    <Repl
      :theme="dark ? 'dark' : 'light'"
      :store="store"
      :editor="Monaco"
      :layout="store.userOptions.layout"
      :show-compile-output="store.userOptions.showCompileOutput || true"
      auto-resize
      :sfc-options="sfcOptions"
      :clear-console="false"
      @keydown="handleKeydown"
    />
  </div>
  <template v-else>
    <div v-loading="{ text: 'Loading...' }" h-100vh />
  </template>
</template>

<style>
body {
  --at-apply: m-none text-13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  --base: #444;
  --nav-height: 50px;
}

.vue-repl {
  height: calc(100vh - var(--nav-height)) !important;
}

.dark .vue-repl,
.vue-repl {
  --color-branding: var(--el-color-primary) !important;
}

.dark body {
  background-color: #1a1a1a;
}
</style>
