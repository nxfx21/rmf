<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFileSystem } from '../store'

const props = defineProps<{
  filePath: string
}>()

const { readFile } = useFileSystem()
const content = ref('')
const isLoading = ref(false)

const loadContent = async () => {
  if (!props.filePath || !props.filePath.endsWith('.md')) {
    content.value = ''
    return
  }

  isLoading.value = true
  try {
    const data = await readFile(props.filePath)
    content.value = new TextDecoder().decode(data)
  } catch (e) {
    content.value = 'Failed to load content.'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.filePath, loadContent)
onMounted(loadContent)
</script>

<template>
  <div class="card preview-card animate-fade-in">
    <div class="header">
      <h3>📖 Documentation Preview</h3>
      <span class="file-name">{{ filePath }}</span>
    </div>
    
    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-else-if="content" class="markdown-body">
      <pre>{{ content }}</pre>
    </div>
    <div v-else class="empty-preview">
      Select a .md file to preview its content.
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  text-align: left;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h3 { margin: 0; font-size: 1rem; }

.file-name {
  font-size: 0.75rem;
  color: var(--accent);
  background: rgba(0, 162, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.markdown-body {
  flex-grow: 1;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--glass-border);
  overflow: auto;
  font-family: inherit;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
  margin: 0;
  color: #ccc;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #555;
  font-style: italic;
  font-size: 0.9rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
  color: #666;
}
</style>
