<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
import Swal from 'sweetalert2'
import { projectStore, useFileSystem } from '../store'

const { readFile, readDirRecursive } = useFileSystem()
const isPackaging = ref(false)

const packageMod = async () => {
  const manifest = projectStore.manifest
  if (!manifest.id || !manifest.name) {
    Swal.fire({
      icon: 'error',
      title: 'Incomplete Project',
      text: 'ID and Name are required.',
      background: '#1a1a1a',
      color: '#fff'
    })
    return
  }

  isPackaging.value = true
  
  try {
    const zip = new JSZip()
    
    // Add manifest
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // Gather all files from LightningFS
    const files = await readDirRecursive()
    for (const path of files) {
      if (path === 'manifest.json') continue
      const data = await readFile(path)
      zip.file(path, data)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${manifest.id}.rmf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Swal.fire({
      icon: 'success',
      title: 'Packaged!',
      text: `${manifest.id}.rmf downloaded successfully.`,
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#00A2FF'
    })
  } catch (e) {
    console.error(e)
    Swal.fire({
      icon: 'error',
      title: 'Packaging Error',
      text: 'Check console for details.',
      background: '#1a1a1a',
      color: '#fff'
    })
  } finally {
    isPackaging.value = false
  }
}
</script>

<template>
  <div class="packaging-row">
    <button @click="packageMod" :disabled="isPackaging" class="package-btn">
      <i class="pi pi-box"></i> {{ isPackaging ? 'Processing...' : 'Package Mod' }}
    </button>
  </div>
</template>

<style scoped>
.package-btn {
  background: linear-gradient(135deg, var(--success) 0%, #00B676 100%);
}
</style>

<style scoped>
.packaging-row {
  display: inline-block;
}

button {
  background: linear-gradient(135deg, var(--success) 0%, #00B676 100%);
  box-shadow: 0 4px 12px rgba(0, 230, 118, 0.3);
}

button:hover {
  box-shadow: 0 6px 20px rgba(0, 230, 118, 0.4);
}
</style>
