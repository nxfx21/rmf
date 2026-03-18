<script setup lang="ts">
import { ref, onMounted } from 'vue'
import JSZip from 'jszip'
import { RotateCcw, LayoutPanelLeft, Eye } from 'lucide-vue-next'
import RMFLoader from './components/RMFLoader.vue'
import RMFMetadataEditor from './components/RMFMetadataEditor.vue'
import RMFFileSystem from './components/RMFFileSystem.vue'
import RMFFilePreviewer from './components/RMFFilePreviewer.vue'
import RMFPackager from './components/RMFPackager.vue'
import RMFPreview from './components/RMFPreview.vue'
import { projectStore, useFileSystem } from './store'

const { writeFile, resetFs, initializeStore } = useFileSystem()
const selectedFile = ref('')
const viewMode = ref<'edit' | 'preview'>('edit')

const onFileSelected = (path: string) => {
  selectedFile.value = path
}

onMounted(async () => {
  await initializeStore()
})

const findCommonPrefix = (files: File[]) => {
  const paths = files.map(f => (f as any).webkitRelativePath || f.name).filter(p => p.includes('/'))
  if (paths.length === 0) return ''
  
  const parts = paths[0].split('/')
  let commonParts = parts.slice(0, -1)
  
  for (let i = 1; i < paths.length; i++) {
    const currentParts = paths[i].split('/')
    for (let j = 0; j < commonParts.length; j++) {
      if (commonParts[j] !== currentParts[j]) {
        commonParts = commonParts.slice(0, j)
        break
      }
    }
  }
  
  return commonParts.length > 0 ? commonParts.join('/') + '/' : ''
}

const handleFilesImported = async (importedFiles: File[]) => {
  await resetFs()
  let rootPath = ''
  let manifestFound = false
  
  // Strategy: Try to find manifest.json first to define the root

  if (importedFiles.length === 1 && (importedFiles[0].name.endsWith('.zip') || importedFiles[0].name.endsWith('.rmf') || importedFiles[0].name.endsWith('.rmd'))) {
    const zip = await JSZip.loadAsync(importedFiles[0])
    const zipPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir)
    
    // Scan for manifest.json in ZIP
    const manifestPath = zipPaths.find(p => p.endsWith('manifest.json'))
    if (manifestPath) {
      rootPath = manifestPath.substring(0, manifestPath.lastIndexOf('manifest.json'))
    } else {
      rootPath = findCommonPrefix(importedFiles) // Fallback for legacy
    }

    for (const [rawPath, file] of Object.entries(zip.files)) {
      if (file.dir) continue
      let path = rawPath
      if (rootPath && path.startsWith(rootPath)) path = path.slice(rootPath.length)
      
      const content = await file.async('uint8array')
      if (path === 'manifest.json') {
        try {
          const text = new TextDecoder().decode(content)
          projectStore.manifest = { ...projectStore.manifest, ...JSON.parse(text) }
          manifestFound = true
        } catch (e) {
          console.error("Manifest parse failed", e)
        }
      } else {
        await writeFile(path, content)
      }
    }
  } else {
    // Scan for manifest.json in Folder upload
    const manifestFile = importedFiles.find(f => f.name === 'manifest.json' || (f as any).webkitRelativePath?.endsWith('manifest.json'))
    if (manifestFile) {
      const relPath = (manifestFile as any).webkitRelativePath || manifestFile.name
      rootPath = relPath.substring(0, relPath.lastIndexOf('manifest.json'))
    } else {
      rootPath = findCommonPrefix(importedFiles) // Fallback for legacy
    }

    for (const file of importedFiles) {
      let path = (file as any).webkitRelativePath || file.name
      if (rootPath && path.startsWith(rootPath)) path = path.slice(rootPath.length)
      
      if (path === 'manifest.json') {
        try {
          const text = await file.text()
          projectStore.manifest = { ...projectStore.manifest, ...JSON.parse(text) }
          manifestFound = true
        } catch (e) {
          console.error("Manifest parse failed", e)
        }
      } else {
        await writeFile(path, file)
      }
    }
  }

  // Fallback for legacy mods without manifest
  if (!manifestFound) {
    const folderName = rootPath.split('/').filter(Boolean).pop() || (importedFiles.length === 1 ? importedFiles[0].name.split('.')[0] : 'legacy-mod')
    projectStore.manifest.name = folderName
    projectStore.manifest.id = `com.legacy.${folderName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mod'}`
  }

  projectStore.isInitialized = true
}

const reset = async () => {
  await resetFs()
  projectStore.manifest = {
    rmf_version: '1.0.0',
    id: '',
    name: '',
    version: '1.0.0',
    author: '',
    description: '',
    tags: [],
    links: {}
  }
  projectStore.isInitialized = false
}
</script>

<template>
  <header class="animate-fade-in">
    <h1>Roblox Mod Format</h1>
    <p class="subtitle">Spec-Compliant Mod Management</p>
  </header>

  <main :class="{ 'onboarding-wrapper': !projectStore.isInitialized && !projectStore.manifest.id }">
    <div v-if="!projectStore.isInitialized && !projectStore.manifest.id" class="animate-fade-in onboarding-content">
      <div class="initial-actions">
        <RMFLoader @loaded="handleFilesImported" @create="projectStore.manifest.id = 'com.new.mod'" />
      </div>
    </div>

    <div v-else class="project-dashboard animate-fade-in">
      <div class="dashboard-controls">
        <div class="left-controls">
          <button class="secondary mini flex-btn" @click="reset">
            <RotateCcw :size="14" /> Reset Project
          </button>
          <div class="mode-switcher">
            <button :class="{ secondary: viewMode !== 'edit' }" @click="viewMode = 'edit'" class="flex-btn">
              <LayoutPanelLeft :size="14" /> Editor
            </button>
            <button :class="{ secondary: viewMode !== 'preview' }" @click="viewMode = 'preview'" class="flex-btn">
              <Eye :size="14" /> Preview
            </button>
          </div>
        </div>
        <RMFPackager />
      </div>

      <div class="dashboard-grid">
        <div class="col-main">
          <div v-if="viewMode === 'edit'" class="animate-fade-in">
            <RMFMetadataEditor v-model="projectStore.manifest" />
            <RMFFilePreviewer v-if="selectedFile.endsWith('.md')" :filePath="selectedFile" />
          </div>
          <div v-else class="animate-fade-in">
            <RMFPreview />
          </div>
        </div>
        <div class="col-side">
          <RMFFileSystem @select="onFileSelected" />
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div class="safety-disclaimer card">
      <h3>🛡️ Safety First</h3>
      <p>RMF is an asset data format. It does not load scripts into the Roblox client.</p>
    </div>
    <p class="footer-note">Roblox Mod Format Tool</p>
  </footer>
</template>

<style>
.initial-actions {
  max-width: 700px;
  margin: 0 auto;
}

.project-dashboard {
  text-align: left;
}

.dashboard-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.mode-switcher {
  background: rgba(255,255,255,0.02);
  padding: 0.3rem;
  border-radius: 12px;
  display: flex;
  gap: 0.3rem;
}

.mode-switcher button {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  box-shadow: none;
}

.flex-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;
  align-items: stretch;
}

.dashboard-grid .card {
  margin-bottom: 0;
  height: 100%;
}

@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
