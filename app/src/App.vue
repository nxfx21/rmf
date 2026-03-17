<script setup lang="ts">
import { ref, onMounted } from 'vue'
import RMFLoader from './components/RMFLoader.vue'
import RMFMetadataEditor from './components/RMFMetadataEditor.vue'
import RMFFileSystem from './components/RMFFileSystem.vue'
import RMFFilePreviewer from './components/RMFFilePreviewer.vue'
import RMFPackager from './components/RMFPackager.vue'
import { projectStore, useFileSystem } from './store'

const { writeFile, resetFs, initializeStore } = useFileSystem()
const selectedFile = ref('')

const onFileSelected = (path: string) => {
  selectedFile.value = path
}

onMounted(async () => {
  await initializeStore()
})

const handleFilesImported = async (importedFiles: File[]) => {
  // Try to find manifest.json
  const manifestFile = importedFiles.find(f => f.name === 'manifest.json' || (f as any).webkitRelativePath?.endsWith('manifest.json'))
  
  if (manifestFile) {
    try {
      const text = await manifestFile.text()
      const json = JSON.parse(text)
      projectStore.manifest = { ...projectStore.manifest, ...json }
    } catch (e) {
      console.error("Manifest parse failed", e)
    }
  }

  // Import files into LightningFS
  const rootDir = (importedFiles[0] as any).webkitRelativePath?.split('/')[0] || ''
  
  for (const file of importedFiles) {
    let path = (file as any).webkitRelativePath || file.name
    if (rootDir && path.startsWith(rootDir + '/')) {
      path = path.slice(rootDir.length + 1)
    }
    
    if (path === 'manifest.json') continue
    await writeFile(path, file)
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

  <main>
    <div v-if="!projectStore.isInitialized && !projectStore.manifest.id" class="animate-fade-in">
      <div class="initial-actions">
        <RMFLoader @loaded="handleFilesImported" @create="projectStore.manifest.id = 'com.new.mod'" />
      </div>
    </div>

    <div v-else class="project-dashboard animate-fade-in">
      <div class="dashboard-controls">
        <button class="secondary mini" @click="reset">← Reset Project</button>
        <RMFPackager />
      </div>

      <div class="dashboard-grid">
        <div class="col-main">
          <RMFMetadataEditor v-model="projectStore.manifest" />
          <RMFFilePreviewer v-if="selectedFile.endsWith('.md')" :filePath="selectedFile" />
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
  max-width: 600px;
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
