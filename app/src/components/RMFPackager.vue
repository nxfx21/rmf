<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
import Swal from 'sweetalert2'

const props = defineProps<{
  files: File[]
  manifest: any
}>()

const isPackaging = ref(false)

const packageMod = async () => {
  isPackaging.value = true
  
  try {
    const zip = new JSZip()
    
    // Determine the root directory name from the first file's webkitRelativePath
    // Usually it's "folder_name/..."
    const firstFile = props.files[0] as any
    const rootDir = firstFile.webkitRelativePath ? firstFile.webkitRelativePath.split('/')[0] : ''

    props.files.forEach(file => {
      let path = (file as any).webkitRelativePath || file.name
      // Strip the root directory if it exists
      if (rootDir && path.startsWith(rootDir + '/')) {
        path = path.slice(rootDir.length + 1)
      }
      zip.file(path, file)
    })

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.manifest.id || 'mod'}.rmf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Your RMF package is ready.',
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#00A2FF'
    })
  } catch (e) {
    console.error(e)
    Swal.fire({
      icon: 'error',
      title: 'Packaging Failed',
      text: 'Could not create the ZIP archive.',
      background: '#1a1a1a',
      color: '#fff'
    })
  } finally {
    isPackaging.value = false
  }
}
</script>

<template>
  <div class="card packaging-card animate-fade-in">
    <div class="packaging-content">
      <div class="mod-preview">
        <span class="mod-icon">📦</span>
        <div class="mod-info">
          <h3>{{ manifest.name }}</h3>
          <code>{{ manifest.id }} v{{ manifest.version }}</code>
        </div>
      </div>
      
      <button 
        class="full-width" 
        @click="packageMod" 
        :disabled="isPackaging"
      >
        {{ isPackaging ? 'Generating Package...' : 'Package & Download Mod' }}
      </button>
      
      <p class="hint">Will download as {{ manifest.id }}.rmf</p>
    </div>
  </div>
</template>

<style scoped>
.packaging-card {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(0, 230, 118, 0.05) 0%, rgba(0, 162, 255, 0.05) 100%);
}

.mod-preview {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.mod-icon {
  font-size: 3rem;
  background: rgba(255,255,255,0.05);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

code {
  color: var(--accent);
  font-size: 0.9rem;
}

.full-width {
  width: 100%;
}

.hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #666;
}
</style>
