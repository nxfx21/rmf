import { reactive, watch } from 'vue'
import FS from '@isomorphic-git/lightning-fs'

// Initialize LightningFS
const fs = new FS('rmf-project')
const pfs = fs.promises

export interface ProjectState {
  manifest: {
    rmf_version: string
    id: string
    name: string
    version: string
    author: string
    description: string
    tags: string[]
    links: Record<string, string>
  }
  isInitialized: boolean
}

export const projectStore = reactive<ProjectState>({
  manifest: {
    rmf_version: '1.0.0',
    id: '',
    name: '',
    version: '1.0.0',
    author: '',
    description: '',
    tags: [],
    links: {}
  },
  isInitialized: false
})

// Watcher for automatic manifest syncing
watch(() => projectStore.manifest, async (newManifest: ProjectState['manifest']) => {
  if (projectStore.isInitialized) {
    const { writeFile } = useFileSystem()
    await writeFile('manifest.json', JSON.stringify(newManifest, null, 2))
  }
}, { deep: true })

export const useFileSystem = () => {
  const writeFile = async (path: string, content: string | Uint8Array | Blob) => {
    const parts = (path.startsWith('/') ? path.slice(1) : path).split('/')
    if (parts.length > 1) {
      let current = ''
      for (let i = 0; i < parts.length - 1; i++) {
        current += (current ? '/' : '') + parts[i]
        try { await pfs.mkdir(current) } catch (e) {}
      }
    }
    
    let buffer: Uint8Array
    if (content instanceof Blob) {
      buffer = new Uint8Array(await content.arrayBuffer())
    } else if (typeof content === 'string') {
      buffer = new TextEncoder().encode(content)
    } else {
      buffer = content
    }
    
    await pfs.writeFile(path.startsWith('/') ? path : `/${path}`, buffer)
  }

  const readFile = async (path: string) => {
    const target = path.startsWith('/') ? path : `/${path}`
    return await pfs.readFile(target)
  }

  const unlink = async (path: string) => {
    const target = path.startsWith('/') ? path : `/${path}`
    const stat = await pfs.stat(target)
    if (stat.isDirectory()) {
      await deleteRecursive(target)
    } else {
      await pfs.unlink(target)
    }
  }

  const deleteRecursive = async (dir: string) => {
    const contents = await pfs.readdir(dir)
    for (const item of contents) {
      const path = `${dir}/${item}`
      const stat = await pfs.stat(path)
      if (stat.isDirectory()) await deleteRecursive(path)
      else await pfs.unlink(path)
    }
    await pfs.rmdir(dir)
  }

  const readDirRecursive = async (dir: string = '/'): Promise<string[]> => {
    const files = await pfs.readdir(dir)
    let results: string[] = []
    for (const file of files) {
      const path = dir === '/' ? `/${file}` : `${dir}/${file}`
      const stat = await pfs.stat(path)
      if (stat.isDirectory()) {
        results = results.concat(await readDirRecursive(path))
      } else {
        results.push(path)
      }
    }
    return results
  }

  const resetFs = async () => {
    const files = await pfs.readdir('/')
    for (const file of files) {
      await unlink(`/${file}`)
    }
  }

  const initializeStore = async () => {
    try {
      const manifestData = await readFile('manifest.json')
      const manifestText = new TextDecoder().decode(manifestData)
      projectStore.manifest = JSON.parse(manifestText)
      projectStore.isInitialized = true
    } catch (e) {
      // No manifest found or parse error, stay uninitialized
    }
  }

  return { writeFile, readFile, unlink, readDirRecursive, resetFs, initializeStore, pfs }
}
