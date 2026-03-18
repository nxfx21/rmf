<script setup lang="ts">
import { ref } from 'vue'
import { Box, FolderOpen, Archive as ArchiveIcon, Plus } from 'lucide-vue-next'

const emit = defineEmits(['loaded', 'create'])
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const zipInput = ref<HTMLInputElement | null>(null)

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

const handlePaste = (e: ClipboardEvent) => {
  if (e.clipboardData?.files) {
    emit('loaded', Array.from(e.clipboardData.files))
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const triggerZipInput = () => {
  zipInput.value?.click()
}
</script>

<template>
  <div 
    class="card loader-zone"
    :class="{ dragging: isDragging }"
    tabindex="0"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @paste="handlePaste"
  >
    <div class="loader-content">
      <div class="icon-large">
        <Box :size="64" stroke-width="1.5" />
      </div>
      <h2>Get Started with RMF</h2>
      <p>Import an existing mod folder, a .zip/.rmd archive, or start a new project.</p>
      
      <div class="actions">
        <div class="split-button">
          <button class="primary main-btn" @click="triggerFileInput" title="Import from Folder">
            <FolderOpen :size="18" /> Import Folder
          </button>
          <button class="primary arrow-btn" @click="triggerZipInput" title="Import from ZIP/RMF">
            <ArchiveIcon :size="18" />
          </button>
        </div>
        <button class="secondary" @click="emit('create')">
          <Plus :size="18" /> Create New Mod
        </button>
        
        <!-- Folder Input -->
        <input 
          type="file" 
          ref="fileInput"
          webkitdirectory 
          directory 
          multiple 
          style="display: none" 
          @change="handleFileChange"
        />
        
        <!-- ZIP/RMF Input -->
        <input 
          type="file" 
          ref="zipInput"
          accept=".zip,.rmd,.rmf"
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
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.split-button {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 162, 255, 0.3);
}

.split-button button {
  border-radius: 0;
  border: none;
  box-shadow: none;
  margin: 0;
}

.main-btn {
  padding-right: 1.5rem;
  border-right: 1px solid rgba(0,0,0,0.1) !important;
}

.split-button button, .secondary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.arrow-btn {
  padding: 0 0.8rem !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 500px) {
  .actions {
    flex-direction: column;
    align-items: center;
  }
  .split-button {
    width: 100%;
  }
  .main-btn { flex: 1; }
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
