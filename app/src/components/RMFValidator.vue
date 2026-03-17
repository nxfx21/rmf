<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  files: File[]
}>()

const emit = defineEmits(['validated', 'reset'])

const results = ref<{ type: 'success' | 'error', message: string }[]>([])
const manifestData = ref<any>(null)
const isValidating = ref(true)

const validate = async () => {
  isValidating.value = true
  const newResults: typeof results.value = []
  let manifestFile: File | null = null

  // Helper to find file by relative path
  const findFile = (name: string): File | null => {
    return props.files.find(f => {
      const path = (f as any).webkitRelativePath || f.name
      return path.split('/').pop() === name
    }) || null
  }

  // 1. Check for manifest.json
  manifestFile = findFile('manifest.json')
  
  if (!manifestFile) {
    newResults.push({ type: 'error', message: 'Missing REQUIRED manifest.json in root' })
  } else {
    newResults.push({ type: 'success', message: 'Found manifest.json' })
    
    try {
      const text = await manifestFile.text()
      const json = JSON.parse(text)
      manifestData.value = json
      
      // Check required fields
      const required = ['rmf_version', 'id', 'name', 'version', 'author']
      required.forEach(field => {
        if (!json[field]) {
          newResults.push({ type: 'error', message: `Manifest missing required field: ${field}` })
        } else {
          newResults.push({ type: 'success', message: `Validated field: ${field}` })
        }
      })
    } catch (e) {
      newResults.push({ type: 'error', message: 'Failed to parse manifest.json: Invalid JSON' })
    }
  }

  // 2. Platform-specific files (Recommendation 1)
  const platformFiles = ['.DS_Store', 'thumbs.db', '.plist', '.ini', '.dat']
  props.files.forEach(f => {
    const name = f.name.toLowerCase()
    if (platformFiles.some(pf => name.includes(pf))) {
      newResults.push({ type: 'error', message: `Found platform-specific file: ${f.name}. These should be removed.` })
    }
  })

  // 3. Optional Manifest Fields
  if (manifestData.value) {
    const optional = ['description', 'tags', 'links', 'dependencies']
    optional.forEach(field => {
      if (manifestData.value[field]) {
        newResults.push({ type: 'success', message: `Found optional field: ${field}` })
      }
    })
  }

  // 4. Media & Documentation Recommendations
  if (!findFile('icon.png') && !findFile('icon.svg')) {
    newResults.push({ type: 'error', message: 'Recommendation: Include icon.png or icon.svg (512x512)' })
  }
  
  if (!findFile('thumbnail.png') && !findFile('thumbnail.svg')) {
    newResults.push({ type: 'error', message: 'Recommendation: Include thumbnail.png or thumbnail.svg (1920x1080)' })
  }

  if (!findFile('README.md')) {
    newResults.push({ type: 'error', message: 'Recommendation: Include a README.md file' })
  }
  
  if (!props.files.some(f => (f as any).webkitRelativePath.includes('/content/'))) {
    newResults.push({ type: 'error', message: 'Recommendation: Place mod files in a /content/ directory' })
  }

  results.value = newResults
  isValidating.value = false
  
  const hasErrors = newResults.some(r => r.type === 'error')
  emit('validated', { 
    manifest: hasErrors ? null : manifestData.value, 
    results: newResults 
  })
}

onMounted(validate)
watch(() => props.files, validate)
</script>

<template>
  <div class="card validator-card">
    <div class="validator-header">
      <div class="title-group">
        <h2>Validation Results</h2>
        <p v-if="files.length > 0">{{ files.length }} files analyzed</p>
      </div>
      <button class="secondary" @click="emit('reset')">Reset</button>
    </div>

    <div v-if="isValidating" class="loading">
      Validating...
    </div>

    <ul v-else class="result-list">
      <li 
        v-for="(res, i) in results" 
        :key="i"
        class="result-item"
        :class="res.type"
      >
        <span class="icon">{{ res.type === 'success' ? '✅' : '⚠️' }}</span>
        <span class="message">{{ res.message }}</span>
        <span class="tag" :class="res.type">{{ res.type }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.validator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  text-align: left;
}

h2 {
  margin: 0;
  font-weight: 700;
}

.title-group p {
  margin: 0.2rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.loading {
  padding: 3rem;
  color: #888;
  font-style: italic;
}

.message {
  flex-grow: 1;
  font-size: 0.95rem;
}
</style>
