/**
 * https://github.com/element-plus/element-plus-playground/blob/main/src/utils/dependency.ts
 * 
 * The MIT License (MIT)

Copyright (c) 2021-PRESENT Element Plus (https://github.com/element-plus)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import { compare } from 'compare-versions'
import type { MaybeRef } from '@vueuse/core'
import type { Versions } from '@/composables/store'
import type { Ref } from 'vue'
import type { ImportMap } from '@/utils/import-map'

interface Dependency {
  pkg?: string
  version?: string
  path: string
  source?: 'unpkg' | 'jsdelivr'
}

export type CDN = 'unpkg' | 'jsdelivr' | 'jsdelivr-fastly'
export const cdn = useLocalStorage<CDN>('setting-cdn', 'unpkg')

export const genCdnLink = (
  pkg: string,
  version: string | undefined,
  path: string
) => {
  version = version ? `@${version}` : ''
  switch (cdn.value) {
    case 'jsdelivr':
      return `https://cdn.jsdelivr.net/npm/${pkg}${version}${path}`
    case 'jsdelivr-fastly':
      return `https://fastly.jsdelivr.net/npm/${pkg}${version}${path}`
    case 'unpkg':
      return `https://unpkg.com/${pkg}${version}${path}`
  }
}

export const genUnpkgLink = (
  pkg: string,
  version: string | undefined,
  path: string
) => {
  version = version ? `@${version}` : ''
  return `https://unpkg.com/${pkg}${version}${path}`
}

export const genJsdelivrLink = (
  pkg: string,
  version: string | undefined,
  path: string
) => {
  version = version ? `@${version}` : ''
  return `https://cdn.jsdelivr.net/npm/${pkg}${version}${path}`
}

export const genVueLink = (version: string) => {
  const compilerSfc = genCdnLink(
    '@vue/compiler-sfc',
    version,
    '/dist/compiler-sfc.esm-browser.js'
  )
  const runtimeDom = genCdnLink(
    '@vue/runtime-dom',
    version,
    '/dist/runtime-dom.esm-browser.js'
  )
  return {
    compilerSfc,
    runtimeDom,
  }
}

export const genImportMap = (
  { vue, elementPlus }: Partial<Versions> = {},
  nightly: boolean
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
      path: '/dist/index.min.js',
    },
    // for pinia
    '@vue/devtools-api': {
      path: '/lib/esm/index.js',
    },
    '@vue/composition-api': {
      path: '/dist/vue-composition-api.mjs',
    },
    'vue-demi': {
      path: '/lib/index.mjs',
    },
    pinia: {
      path: '/dist/pinia.mjs',
    },
  }

  return {
    imports: Object.fromEntries(
      Object.entries(deps).map(([key, dep]) => [
        key,
        genCdnLink(dep.pkg ?? key, dep.version, dep.path),
      ])
    ),
  }
}

export const getVersions = (pkg: MaybeRef<string>) => {
  const url = computed(
    () => `https://data.jsdelivr.com/v1/package/npm/${unref(pkg)}`
  )
  return useFetch(url, {
    initialData: [],
    afterFetch: (ctx) => ((ctx.data = ctx.data.versions), ctx),
    refetch: true,
  }).json<string[]>().data as Ref<string[]>
}

export const getSupportedVueVersions = () => {
  const versions = $(getVersions('vue'))
  return computed(() =>
    versions.filter((version) => compare(version, '3.2.0', '>='))
  )
}

export const getSupportedEpVersions = (nightly: MaybeRef<boolean>) => {
  const pkg = computed(() =>
    unref(nightly) ? '@element-plus/nightly' : 'element-plus'
  )
  const versions = $(getVersions(pkg))
  return computed(() => {
    if (unref(nightly)) return versions
    return versions.filter((version) => compare(version, '2.0.0', '>='))
  })
}
