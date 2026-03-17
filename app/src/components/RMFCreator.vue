<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
import Swal from 'sweetalert2'

const emit = defineEmits(['created'])

const form = ref({
  rmf_version: '1.0.0',
  id: 'com.example.mymod',
  name: 'My Awesome Mod',
  version: '1.0.0',
  author: '',
  description: '',
  tags: [] as string[],
  links: {} as Record<string, string>
})

const tagInput = ref('')
const linkKey = ref('')
const linkValue = ref('')

const addTag = () => {
  if (tagInput.value && !form.value.tags.includes(tagInput.value)) {
    form.value.tags.push(tagInput.value)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

const addLink = () => {
  if (linkKey.value && linkValue.value) {
    form.value.links[linkKey.value] = linkValue.value
    linkKey.value = ''
    linkValue.value = ''
  }
}

const removeLink = (key: string) => {
  delete form.value.links[key]
}

const isCreating = ref(false)

const createMod = async () => {
  if (!form.value.id || !form.value.name || !form.value.version || !form.value.author) {
    Swal.fire({
      icon: 'error',
      title: 'Missing Fields',
      text: 'Please fill in all required fields (ID, Name, Version, Author).',
      background: '#1a1a1a',
      color: '#fff'
    })
    return
  }

  isCreating.value = true
  try {
    const zip = new JSZip()
    
    // Create manifest.json
    const manifestContent = JSON.stringify(form.value, null, 2)
    zip.file('manifest.json', manifestContent)
    
    // Create empty directories for structure
    zip.folder('content')
    zip.folder('assets')
    
    // Create a dummy README.md
    zip.file('README.md', `# ${form.value.name}\n\nGenerated with Roblox Mod Format (RMF) Creator.\n\nDescription: ${form.value.description}`)

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form.value.id}.rmf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Swal.fire({
      icon: 'success',
      title: 'Mod Created!',
      text: `Your mod "${form.value.name}" has been generated and downloaded.`,
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#00A2FF'
    })

    emit('created')
  } catch (e) {
    console.error(e)
    Swal.fire({
      icon: 'error',
      title: 'Creation Failed',
      text: 'Could not generate the RMF package.',
      background: '#1a1a1a',
      color: '#fff'
    })
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="card creator-card animate-fade-in">
    <h2>Create New Mod</h2>
    <p class="description">Fill in the details below to generate a new RMF project template.</p>
    
    <div class="form-grid">
      <div class="form-group">
        <label>Mod ID (Unique)</label>
        <input v-model="form.id" placeholder="e.g. com.nexus.supermod" />
      </div>
      
      <div class="form-group">
        <label>Display Name</label>
        <input v-model="form.name" placeholder="e.g. Super Mod" />
      </div>
      
      <div class="form-group">
        <label>Version (SemVer)</label>
        <input v-model="form.version" placeholder="1.0.0" />
      </div>
      
      <div class="form-group">
        <label>Author</label>
        <input v-model="form.author" placeholder="Your name or handle" />
      </div>
      
      <div class="form-group full-width">
        <label>Description</label>
        <textarea v-model="form.description" placeholder="A short summary of what the mod does..." rows="2"></textarea>
      </div>

      <div class="form-group full-width">
        <label>Tags</label>
        <div class="input-with-button">
          <input v-model="tagInput" placeholder="Add a tag..." @keyup.enter="addTag" />
          <button class="secondary mini" @click="addTag">Add</button>
        </div>
        <div class="tags-container">
          <span v-for="tag in form.tags" :key="tag" class="tag success clickable" @click="removeTag(tag)">
            {{ tag }} ✕
          </span>
        </div>
      </div>

      <div class="form-group full-width">
        <label>Links</label>
        <div class="input-with-button">
          <input v-model="linkKey" placeholder="Label (e.g. GitHub)" style="flex: 1" />
          <input v-model="linkValue" placeholder="URL" style="flex: 2" />
          <button class="secondary mini" @click="addLink">Add</button>
        </div>
        <div class="links-container">
          <div v-for="(url, key) in form.links" :key="key" class="link-item">
            <code>{{ key }}:</code> <span>{{ url }}</span>
            <button class="mini danger" @click="removeLink(key)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="full-width" @click="createMod" :disabled="isCreating">
        {{ isCreating ? 'Generating...' : 'Create & Download RMF' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.creator-card {
  text-align: left;
}

h2 {
  margin-top: 0;
  font-weight: 800;
  letter-spacing: -1px;
}

.description {
  color: #888;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group.full-width {
  grid-column: span 2;
}

label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

input, textarea {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  color: white;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(0, 162, 255, 0.05);
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button input {
  flex-grow: 1;
}

button.mini {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

button.danger {
  background: transparent;
  color: var(--error);
  border: none;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  filter: none;
  box-shadow: none;
}

button.danger:hover {
  background: rgba(255, 74, 74, 0.1);
  transform: none;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag.clickable {
  cursor: pointer;
}

.tag.clickable:hover {
  background: rgba(0, 230, 118, 0.2);
}

.links-container {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.02);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.link-item code {
  color: var(--accent);
}

.link-item span {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #888;
}

.actions {
  margin-top: 1rem;
}

.full-width {
  width: 100%;
}
</style>
