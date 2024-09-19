import { saveAs } from 'file-saver'
import type { ReplStore } from '@/composables/store'

import index from './template/index.html?raw'
import main from './template/main.js?raw'
import pkg from './template/package.json?raw'
import readme from './template/README.md?raw'
import config from './template/vite.config.js?raw'

export async function downloadProject(store: ReplStore) {
  // eslint-disable-next-line no-alert
  if (!confirm('Download project files?')) {
    return
  }

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  // basic structure
  zip.file('index.html', index)
  zip.file('package.json', pkg)
  zip.file('vite.config.js', config)
  zip.file('README.md', readme)

  // project src
  const src = zip.folder('src')!
  src.file('main.js', main)

  const files = store.state.files
  // eslint-disable-next-line no-restricted-syntax
  for (const file in files) {
    if (file !== 'import-map.json') {
      src.file(file, files[file].code)
    } else {
      zip.file(file, files[file].code)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, 'vue-project.zip')
}
