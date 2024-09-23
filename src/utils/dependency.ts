import { gte } from 'semver'
import type { Versions } from '@/composables/store'
import type { ImportMap } from '@vue/repl'
import type { MaybeRef } from '@vueuse/core'
import type { Ref } from 'vue'

export interface Dependency {
  pkg?: string
  version?: string
  path: string
}

export type Cdn = 'unpkg' | 'jsdelivr' | 'jsdelivr-fastly' | 'npmmirror'
export const cdn = useLocalStorage<Cdn>('setting-cdn', 'npmmirror')

const queryCdn = new URLSearchParams(location.search).get('cdn')
if (queryCdn) {
  cdn.value = queryCdn as Cdn
}

export const genCdnLink = (
  pkg: string,
  version: string | undefined,
  path: string,
) => {
  let ver = version ? `@${version}` : ''
  switch (cdn.value) {
    case 'jsdelivr':
      return `https://cdn.jsdelivr.net/npm/${pkg}${ver}${path}`
    case 'jsdelivr-fastly':
      return `https://fastly.jsdelivr.net/npm/${pkg}${ver}${path}`
    case 'unpkg':
      return `https://unpkg.com/${pkg}${ver}${path}`
    case 'npmmirror':
      ver = version || 'latest'
      return `https://registry.npmmirror.com/${pkg}/${ver}/files${path}`
  }
}

export const genCompilerSfcLink = (version: string) => {
  return genCdnLink(
    '@vue/compiler-sfc',
    version,
    '/dist/compiler-sfc.esm-browser.js',
  )
}

export const genImportMap = (
  { vue, elementPlus, pinia }: Partial<Versions> = {},
  nightly: boolean,
): ImportMap => {
  const deps: Record<string, Dependency> = {
    vue: {
      pkg: '@vue/runtime-dom',
      version: vue,
      path: '/dist/runtime-dom.esm-browser.js',
    },
    '@vue/shared': {
      version: vue,
      path: '/dist/shared.esm-bundler.js',
    },
    'element-plus': {
      pkg: nightly ? '@element-plus/nightly' : 'element-plus',
      version: elementPlus,
      path: '/dist/index.full.min.mjs',
    },
    'element-plus/': {
      pkg: 'element-plus',
      version: elementPlus,
      path: '/',
    },
    '@element-plus/icons-vue': {
      version: '2',
      path: '/dist/index.min.js',
    },
    // for pinia
    '@vue/devtools-api': {
      path: '/dist/index.js',
    },
    '@vue/devtools-kit': {
      path: '/dist/index.js',
    },
    '@vue/devtools-shared': {
      path: '/dist/index.js',
    },
    'perfect-debounce': {
      path: '/dist/index.mjs',
    },
    'hookable': {
      path: '/dist/index.mjs',
    },
    'birpc': {
      path: '/dist/index.mjs',
    },
    '@vue/composition-api': {
      path: '/dist/vue-composition-api.mjs',
    },
    'vue-demi': {
      path: '/lib/index.mjs',
    },
    pinia: {
      version: pinia,
      path: '/dist/pinia.esm-browser.js',
    },
  }

  return {
    imports: Object.fromEntries(
      Object.entries(deps).map(([key, dep]) => [
        key,
        genCdnLink(dep.pkg ?? key, dep.version, dep.path),
      ]),
    ),
  }
}

export const getVersions = (pkg: MaybeRef<string>) => {
  const url = computed(
    () => `https://data.jsdelivr.com/v1/package/npm/${unref(pkg)}`,
  )
  return useFetch(url, {
    initialData: [],
    afterFetch: (ctx) => ((ctx.data = ctx.data.versions), ctx),
    refetch: true,
  }).json<string[]>().data as Ref<string[]>
}

export const getSupportedVueVersions = () => {
  const versions = getVersions('vue')
  return computed(() =>
    versions.value.filter((version) => gte(version, '3.2.0')),
  )
}

export const getSupportedTSVersions = () => {
  const versions = getVersions('typescript')
  return computed(() =>
    versions.value.filter(
      (version) => !version.includes('dev') && !version.includes('insiders'),
    ),
  )
}

export const getSupportedEpVersions = (nightly: MaybeRef<boolean>) => {
  const pkg = computed(() =>
    unref(nightly) ? '@element-plus/nightly' : 'element-plus',
  )
  const versions = getVersions(pkg)
  return computed(() => {
    if (unref(nightly)) return versions.value
    return versions.value.filter((version) => gte(version, '1.1.0-beta.18'))
  })
}

export const getSupportedPiniaVersions = () => {
  const versions = getVersions('pinia')
  return computed(() =>
    versions.value.filter(
      (version) => !version.includes('dev') && !version.includes('insiders'),
    ),
  )
}
