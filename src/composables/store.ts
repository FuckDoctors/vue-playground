import {
  compileFile,
  File,
  mergeImportMap,
  useStore as useReplStore,
  type ImportMap,
  type StoreState,
} from '@vue/repl'
import { objectOmit } from '@vueuse/core'
import { IS_DEV } from '@/constants'
import {
  genCdnLink,
  genCompilerSfcLink,
  genImportMap,
} from '@/utils/dependency'
import { atou, utoa } from '@/utils/encode'
import elementPlusCode from '../template/element-plus.js?raw'
import mainCode from '../template/main.vue?raw'
import piniaCode from '../template/pinia.js?raw'
import tsconfigCode from '../template/tsconfig.json?raw'
import welcomeCode from '../template/welcome.vue?raw'

export interface Initial {
  serializedState?: string
  initialized?: () => void
}
export type VersionKey = 'vue' | 'elementPlus' | 'typescript' | 'pinia'
export type Versions = Record<VersionKey, string>
export interface UserOptions {
  styleSource?: string
  showHidden?: boolean
  showOutput?: boolean
  showCompileOutput?: boolean
  layout?: 'horizontal' | 'vertical'
}
export type SerializeState = Record<string, string> & {
  _o?: UserOptions
}

const MAIN_FILE = 'src/PlaygroundMain.vue'
const APP_FILE = 'src/App.vue'
const ELEMENT_PLUS_FILE = 'src/element-plus.js'
const LEGACY_IMPORT_MAP = 'src/import_map.json'
export const IMPORT_MAP = 'import-map.json'
export const TSCONFIG = 'tsconfig.json'
const PINIA_FILE = 'src/pinia.js'

export const useStore = (initial: Initial) => {
  const saved: SerializeState | undefined = initial.serializedState
    ? deserialize(initial.serializedState)
    : undefined
  const pr =
    new URLSearchParams(location.search).get('pr') ||
    saved?._o?.styleSource?.split('-', 2)[1]
  const versions = reactive<Versions>({
    vue: 'latest',
    elementPlus: pr ? 'preview' : 'latest',
    typescript: 'latest',
    pinia: 'latest',
  })
  const userOptions: UserOptions = {}
  // retrieve some configuration options from the URL
  const query = new URLSearchParams(location.search)
  if (query.has('debug')) {
    userOptions.showHidden = true
  }

  const showOutput = query.get('showOutput')
  if (showOutput?.toLowerCase() === 'false') {
    userOptions.showOutput = false
  } else {
    userOptions.showOutput = true
  }

  const showCompileOutput = query.get('showCompileOutput')
  if (showCompileOutput?.toLowerCase() === 'false') {
    userOptions.showCompileOutput = false
  } else {
    userOptions.showCompileOutput = true
  }

  const layout = query.get('layout')
  if (layout?.toLowerCase() === 'vertical') {
    userOptions.layout = 'vertical'
  } else {
    userOptions.layout = 'horizontal'
  }

  const hideFile = !IS_DEV && !userOptions.showHidden

  const [nightly, toggleNightly] = useToggle(false)
  const builtinImportMap = computed<ImportMap>(() => {
    let importMap = genImportMap(versions, nightly.value)
    if (pr)
      importMap = mergeImportMap(importMap, {
        imports: {
          'element-plus': `https://preview-${pr}-element-plus.surge.sh/bundle/index.full.min.mjs`,
          'element-plus/': 'unsupported',
        },
      })
    return importMap
  })

  const storeState: Partial<StoreState> = toRefs(
    reactive({
      files: initFiles(),
      mainFile: MAIN_FILE,
      activeFilename: APP_FILE,
      vueVersion: computed(() => versions.vue),
      typescriptVersion: versions.typescript,
      builtinImportMap,
      template: {
        welcomeSFC: mainCode,
      },
      sfcOptions: {
        script: {
          propsDestructure: true,
        },
      },
    }),
  )
  const store = useReplStore(storeState)
  store.files[ELEMENT_PLUS_FILE].hidden = hideFile
  store.files[PINIA_FILE].hidden = hideFile
  store.files[MAIN_FILE].hidden = hideFile
  setVueVersion(versions.vue).then(() => {
    initial.initialized?.()
  })

  watch(
    () => versions.elementPlus,
    (version) => {
      store.files[ELEMENT_PLUS_FILE].code = generateElementPlusCode(
        version,
        userOptions.styleSource,
      ).trim()
      compileFile(store, store.files[ELEMENT_PLUS_FILE]).then(
        (errs) => (store.errors = errs),
      )
    },
    { immediate: true },
  )

  watch(
    builtinImportMap,
    (newBuiltinImportMap) => {
      const importMap = JSON.parse(store.files[IMPORT_MAP].code)
      store.files[IMPORT_MAP].code = JSON.stringify(
        mergeImportMap(importMap, newBuiltinImportMap),
        undefined,
        2,
      )
    },
    { deep: true },
  )

  function generateElementPlusCode(version: string, styleSource?: string) {
    const style = styleSource
      ? styleSource.replace('#VERSION#', version)
      : genCdnLink(
          nightly.value ? '@element-plus/nightly' : 'element-plus',
          version,
          '/dist/index.css',
        )
    const darkStyle = style.replace(
      '/dist/index.css',
      '/theme-chalk/dark/css-vars.css',
    )
    return elementPlusCode
      .replace('#STYLE#', style)
      .replace('#DARKSTYLE#', darkStyle)
  }

  function init() {
    watchEffect(() => {
      compileFile(store, store.activeFile).then((errs) => (store.errors = errs))
    })
    for (const [filename, file] of Object.entries(store.files)) {
      if (filename === store.activeFilename) continue
      compileFile(store, file).then((errs) => store.errors.push(...errs))
    }

    watch(
      () => [
        store.files[TSCONFIG]?.code,
        store.typescriptVersion,
        store.locale,
        store.dependencyVersion,
        store.vueVersion,
      ],
      useDebounceFn(() => store.reloadLanguageTools?.(), 300),
      { deep: true },
    )
  }

  watch(
    () => versions.pinia,
    () => {
      store.files[PINIA_FILE].code = piniaCode.trim()
      compileFile(store, store.files[PINIA_FILE]).then(
        (errs) => (store.errors = errs),
      )
    },
    { immediate: true },
  )

  function serialize() {
    const state: SerializeState = { ...store.getFiles() }
    state._o = userOptions
    return utoa(JSON.stringify(state))
  }
  function deserialize(text: string): SerializeState {
    const state = JSON.parse(atou(text))
    return state
  }
  function initFiles() {
    const files: Record<string, File> = Object.create(null)
    if (saved) {
      for (let [filename, file] of Object.entries(objectOmit(saved, ['_o']))) {
        if (
          ![IMPORT_MAP, TSCONFIG].includes(filename) &&
          !filename.startsWith('src/')
        ) {
          filename = `src/${filename}`
        }
        if (filename === LEGACY_IMPORT_MAP) {
          filename = IMPORT_MAP
        }
        files[filename] = new File(filename, file as string)
      }
    } else {
      files[APP_FILE] = new File(APP_FILE, welcomeCode)
    }
    if (!files[ELEMENT_PLUS_FILE]) {
      files[ELEMENT_PLUS_FILE] = new File(
        ELEMENT_PLUS_FILE,
        generateElementPlusCode(versions.elementPlus, userOptions.styleSource),
      )
    }
    if (!files[PINIA_FILE]) {
      files[PINIA_FILE] = new File(PINIA_FILE, piniaCode.trim(), hideFile)
    }
    if (!files[TSCONFIG]) {
      files[TSCONFIG] = new File(TSCONFIG, tsconfigCode)
    }
    return files
  }

  async function setVueVersion(version: string) {
    store.compiler = await import(
      /* @vite-ignore */ genCompilerSfcLink(version)
    )
    versions.vue = version
  }

  function setActive(filename: string) {
    const file = store.files[filename]
    if (file.hidden) return
    store.activeFile = store.files[filename]
  }

  function addFile(fileOrFilename: string | File) {
    const file =
      typeof fileOrFilename === 'string'
        ? new File(fileOrFilename)
        : fileOrFilename
    store.files[file.filename] = file
    setActive(file.filename)
  }

  function renameFile(oldFilename: string, newFilename: string) {
    const file = store.files[oldFilename]

    if (!file) {
      store.errors = [`Could not rename "${oldFilename}", file not found`]
      return
    }

    if (!newFilename || oldFilename === newFilename) {
      store.errors = [`Cannot rename "${oldFilename}" to "${newFilename}"`]
      return
    }

    if (
      file.hidden ||
      [APP_FILE, MAIN_FILE, ELEMENT_PLUS_FILE, PINIA_FILE, IMPORT_MAP].includes(
        oldFilename,
      )
    ) {
      store.errors = [`Cannot rename ${oldFilename}`]
      return
    }

    file.filename = newFilename

    const newFiles: Record<string, File> = {}

    // Preserve iteration order for files
    for (const name of Object.keys(store.files)) {
      if (name === oldFilename) {
        newFiles[newFilename] = file
      } else {
        newFiles[name] = store.files[name]
      }
    }

    store.files = newFiles
    compileFile(store, file)
  }

  async function deleteFile(filename: string) {
    if (
      [ELEMENT_PLUS_FILE, MAIN_FILE, APP_FILE, PINIA_FILE, IMPORT_MAP].includes(
        filename,
      )
    ) {
      ElMessage.warning('You cannot remove it, because playground requires it.')
      return
    }

    if (
      await ElMessageBox.confirm(
        `Are you sure you want to delete ${filename.replace(/^src\//, '')}?`,
        {
          title: 'Delete File',
          type: 'warning',
          center: true,
        },
      )
    ) {
      if (store.activeFile.filename === filename) {
        setActive(APP_FILE)
      }
      delete store.files[filename]
    }
  }

  function getTsConfig() {
    try {
      return JSON.parse(store.files[TSCONFIG].code)
    } catch {
      return {}
    }
  }

  async function setVersion(key: VersionKey, version: string) {
    switch (key) {
      case 'vue':
        await setVueVersion(version)
        break
      case 'elementPlus':
        versions.elementPlus = version
        break
      case 'typescript':
        store.typescriptVersion = version
        break
      case 'pinia':
        versions.pinia = version
        break
    }
  }

  const utils = {
    versions,
    pr,
    setVersion,
    toggleNightly,
    serialize,
    init,
    userOptions,
  }
  Object.assign(store, utils)

  return store as typeof store & typeof utils
}

export type Store = ReturnType<typeof useStore>
