<script setup lang="ts">
import { ref } from 'vue'
import RMFLoader from './components/RMFLoader.vue'
import RMFValidator from './components/RMFValidator.vue'
import RMFPackager from './components/RMFPackager.vue'

const files = ref<File[]>([])
const manifest = ref<any>(null)
const validationResults = ref<{ type: 'success' | 'error', message: string }[]>([])

const handleFilesLoaded = (loadedFiles: File[]) => {
  files.value = loadedFiles
}

const handleValidated = (data: { manifest: any, results: any[] }) => {
  manifest.value = data.manifest
  validationResults.value = data.results
}

const reset = () => {
  files.value = []
  manifest.value = null
  validationResults.value = []
}
</script>

<template>
  <header class="animate-fade-in">
    <h1>Roblox Mod Format</h1>
    <p class="subtitle">Validate and package your Roblox modifications with ease.</p>
  </header>

  <main>
    <div v-if="files.length === 0" class="animate-fade-in">
      <RMFLoader @loaded="handleFilesLoaded" />
    </div>

    <div v-else class="animate-fade-in">
      <RMFValidator 
        :files="files" 
        @validated="handleValidated" 
        @reset="reset"
      />
      
      <RMFPackager 
        v-if="manifest" 
        :files="files" 
        :manifest="manifest" 
      />
    </div>
  </main>

  <footer class="animate-fade-in" style="margin-top: 4rem; color: #555; font-size: 0.9rem;">
    <p>RMF Spec v1.0.0 • Built with Vue & Vite</p>
  </footer>
</template>
