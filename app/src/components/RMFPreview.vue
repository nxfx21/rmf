<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { projectStore, useFileSystem } from '../store'

const { readFile } = useFileSystem()
const iconUrl = ref<string | null>(null)
const thumbUrl = ref<string | null>(null)

const refreshAssets = async () => {
  try {
    const iconData = await readFile('icon.png')
    iconUrl.value = URL.createObjectURL(new Blob([iconData as any], { type: 'image/png' }))
  } catch (e) {
    iconUrl.value = null
  }

  try {
    const thumbData = await readFile('thumbnail.png')
    thumbUrl.value = URL.createObjectURL(new Blob([thumbData as any], { type: 'image/png' }))
  } catch (e) {
    thumbUrl.value = null
  }
}

onMounted(refreshAssets)

// Watch for changes in the manifest (which might trigger asset updates via FS)
// Or better, let the user trigger a refresh or use a more reactive approach
// For now, let's refresh when the store reports initialization
watch(() => projectStore.isInitialized, refreshAssets)

// Also exposed a manual refresh method for the parent if needed
defineExpose({ refreshAssets })

</script>

<template>
  <div class="card preview-card">
    <div class="preview-header">
      <div class="p-icon" :style="{ backgroundImage: iconUrl ? `url(${iconUrl})` : '' }">
        <span v-if="!iconUrl">📦</span>
      </div>
      <div class="p-info">
        <h3>{{ projectStore.manifest.name || 'Untitled Mod' }}</h3>
        <p class="p-id">{{ projectStore.manifest.id || 'com.example.mod' }}</p>
        <p class="p-meta">v{{ projectStore.manifest.version }} • by {{ projectStore.manifest.author || 'Anonymous' }}</p>
      </div>
    </div>
    
    <div class="p-thumbnail" :style="{ backgroundImage: thumbUrl ? `url(${thumbUrl})` : '' }">
      <div v-if="!thumbUrl" class="no-thumb">No Thumbnail Provided</div>
    </div>

    <div class="p-body">
      <p class="p-desc">{{ projectStore.manifest.description || 'No description provided.' }}</p>
      
      <div class="p-tags" v-if="projectStore.manifest.tags?.length">
        <span v-for="tag in projectStore.manifest.tags" :key="tag" class="p-tag">#{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  text-align: left;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--glass-border);
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
}

.preview-header {
  padding: 1.5rem;
  display: flex;
  gap: 1.2rem;
  align-items: center;
}

.p-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background-color: rgba(255,255,255,0.05);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border: 1px solid var(--glass-border);
}

.p-info h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.p-id {
  font-size: 0.75rem;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  margin: 2px 0;
}

.p-meta {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
}

.p-thumbnail {
  width: 100%;
  aspect-ratio: 3/2;
  background-color: rgba(0,0,0,0.2);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
}

.no-thumb {
  font-size: 0.8rem;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.p-body {
  padding: 1.5rem;
}

.p-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #aaa;
  margin-bottom: 1rem;
}

.p-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.p-tag {
  font-size: 0.7rem;
  color: var(--accent);
  background: rgba(0, 162, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
</style>
