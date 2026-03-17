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

const handleFilesImported = async (importedFiles: File[]) => {
  if (importedFiles.length === 1 && (importedFiles[0].name.endsWith('.zip') || importedFiles[0].name.endsWith('.rmf'))) {
    const zip = await JSZip.loadAsync(importedFiles[0])
    await resetFs()
    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir) continue
      const content = await file.async('uint8array')
      if (path === 'manifest.json') {
        try {
          const text = new TextDecoder().decode(content)
          projectStore.manifest = { ...projectStore.manifest, ...JSON.parse(text) }
        } catch (e) {
          console.error("Manifest parse failed", e)
        }
      } else {
        await writeFile(path, content)
      }
    }
  } else {
    const manifestFile = importedFiles.find(f => f.name === 'manifest.json' || (f as any).webkitRelativePath?.endsWith('manifest.json'))
    let rootPath = ''
    if (manifestFile) {
      const relPath = (manifestFile as any).webkitRelativePath || manifestFile.name
      if (relPath.includes('/')) {
        rootPath = relPath.substring(0, relPath.lastIndexOf('/') + 1)
      }
    }
    await resetFs()
    for (const file of importedFiles) {
      let path = (file as any).webkitRelativePath || file.name
      if (rootPath && path.startsWith(rootPath)) {
        path = path.slice(rootPath.length)
      }
      if (path === 'manifest.json') {
        try {
          const text = await file.text()
          projectStore.manifest = { ...projectStore.manifest, ...JSON.parse(text) }
        } catch (e) {
          console.error("Manifest parse failed", e)
        }
      } else {
        await writeFile(path, file)
      }
    }
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
  align-items: start;
}

@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
