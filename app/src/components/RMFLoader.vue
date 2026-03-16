<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['loaded'])
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    emit('loaded', Array.from(target.files))
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    emit('loaded', Array.from(e.dataTransfer.files))
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div 
    class="card loader-zone"
    :class="{ dragging: isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div class="loader-content">
      <div class="icon-large">📦</div>
      <h2>Select your mod folder</h2>
      <p>Drag and drop your mod directory here, or click to browse.</p>
      
      <div class="actions">
        <button @click="triggerFileInput">Select Folder</button>
        <input 
          type="file" 
          ref="fileInput"
          webkitdirectory 
          directory 
          multiple 
          style="display: none" 
          @change="handleFileChange"
        />
      </div>
      
      <div class="info-badges">
        <span class="badge">Requires manifest.json</span>
        <span class="badge">supports icon.png</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader-zone {
  border: 2px dashed var(--glass-border);
  padding: 4rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.loader-zone.dragging {
  border-color: var(--accent);
  background: var(--accent-muted);
  transform: scale(1.02);
}

.icon-large {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 20px rgba(255,255,255,0.1));
}

h2 {
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.loader-content p {
  color: #888;
  margin-bottom: 2rem;
}

.actions {
  margin-bottom: 2rem;
}

.info-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.badge {
  font-size: 0.75rem;
  color: #666;
  background: rgba(255,255,255,0.05);
  padding: 0.4rem 0.8rem;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.02);
}
</style>
