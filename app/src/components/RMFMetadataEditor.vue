<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as zod from 'zod'
import { CheckCircle2, AlertTriangle, Plus, X, Link, Image as ImageIcon, Trash2 } from 'lucide-vue-next'
import { useFileSystem } from '../store'
import Swal from 'sweetalert2'

const { writeFile, readFile } = useFileSystem()

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

// Zod Schema for RMF Manifest
const schema = zod.object({
  rmf_version: zod.string().default('1.0.0'),
  id: zod.string().min(3, 'ID must be at least 3 characters').regex(/^[a-z0-9.]+$/, 'ID must be lowercase alphanumeric with dots'),
  name: zod.string().min(1, 'Name is required'),
  version: zod.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be SemVer (e.g. 1.0.0)'),
  author: zod.string().min(1, 'Author is required'),
  description: zod.string().optional(),
  tags: zod.array(zod.string()).default([]),
  links: zod.record(zod.string(), zod.string().url('Must be a valid URL')).default({})
})

const { values, errors, defineField, setValues } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: props.modelValue
})

const [id, idProps] = defineField('id')
const [name, nameProps] = defineField('name')
const [version, versionProps] = defineField('version')
const [author, authorProps] = defineField('author')
const [description, descriptionProps] = defineField('description')

// Reactive sync with parent
onMounted(() => {
  setValues(props.modelValue)
})

const updateParent = () => {
  emit('update:modelValue', values)
}

// Tag Management
const tagInput = ref('')
const addTag = () => {
  if (tagInput.value && !values.tags.includes(tagInput.value)) {
    const newTags = [...values.tags, tagInput.value]
    setValues({ ...values, tags: newTags })
    updateParent()
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const newTags = values.tags.filter((t: string) => t !== tag)
  setValues({ ...values, tags: newTags })
  updateParent()
}

// Link Management
const linkKey = ref('')
const linkUrl = ref('')
const addLink = () => {
  if (linkKey.value && linkUrl.value) {
    const newLinks = { ...values.links, [linkKey.value]: linkUrl.value }
    setValues({ ...values, links: newLinks })
    updateParent()
    linkKey.value = ''
    linkUrl.value = ''
  }
}

const removeLink = (key: string) => {
  const newLinks = { ...values.links }
  delete newLinks[key]
  setValues({ ...values, links: newLinks })
  updateParent()
}

// Asset Management (Images)
const iconPreview = ref<string | null>(null)
const thumbPreview = ref<string | null>(null)

const loadExistingAssets = async () => {
  try {
    const iconData = await readFile('icon.png')
    iconPreview.value = URL.createObjectURL(new Blob([iconData as any], { type: 'image/png' }))
  } catch (e) {}
  try {
    const thumbData = await readFile('thumbnail.png')
    thumbPreview.value = URL.createObjectURL(new Blob([thumbData as any], { type: 'image/png' }))
  } catch (e) {}
}

onMounted(() => {
  setValues(props.modelValue)
  loadExistingAssets()
})

const validateImage = (file: File, aspectWidth: number, aspectHeight: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const actualRatio = img.width / img.height
      const targetRatio = aspectWidth / aspectHeight
      // Allow minor deviation
      if (Math.abs(actualRatio - targetRatio) > 0.05) {
        Swal.fire('Asset Error', `Image must be ${aspectWidth}:${aspectHeight} aspect ratio. Found ${actualRatio.toFixed(2)}`, 'error')
        resolve(false)
      } else {
        resolve(true)
      }
    }
    img.src = URL.createObjectURL(file)
  })
}

const handleAssetUpload = async (e: Event, type: 'icon' | 'thumb') => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const isValid = type === 'icon' 
    ? await validateImage(file, 1, 1)
    : await validateImage(file, 3, 2)

  if (isValid) {
    const fileName = type === 'icon' ? 'icon.png' : 'thumbnail.png'
    await writeFile(fileName, file)
    const previewUrl = URL.createObjectURL(file)
    if (type === 'icon') iconPreview.value = previewUrl
    else thumbPreview.value = previewUrl
    Swal.fire('Success', `${type.toUpperCase()} uploaded and saved to project.`, 'success')
  }
}
</script>

<template>
  <div class="card spec-editor">
    <div class="header">
      <h2>Mod Manifest</h2>
      <span class="badge" :class="{ 'badge-success': Object.keys(errors).length === 0, 'badge-error': Object.keys(errors).length > 0 }">
        <CheckCircle2 v-if="Object.keys(errors).length === 0" :size="14" />
        <AlertTriangle v-else :size="14" />
        {{ Object.keys(errors).length === 0 ? 'Valid' : 'Invalid' }}
      </span>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label>RMF ID</label>
        <input v-model="id" v-bind="idProps" placeholder="com.example.mod" @input="updateParent" />
        <span class="error-msg" v-if="errors.id">{{ errors.id }}</span>
      </div>

      <div class="form-group">
        <label>Friendly Name</label>
        <input v-model="name" v-bind="nameProps" placeholder="My Awesome Mod" @input="updateParent" />
        <span class="error-msg" v-if="errors.name">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label>Version (SemVer)</label>
        <input v-model="version" v-bind="versionProps" placeholder="1.0.0" @input="updateParent" />
        <span class="error-msg" v-if="errors.version">{{ errors.version }}</span>
      </div>

      <div class="form-group">
        <label>Author</label>
        <input v-model="author" v-bind="authorProps" placeholder="Creator Name" @input="updateParent" />
        <span class="error-msg" v-if="errors.author">{{ errors.author }}</span>
      </div>

      <div class="form-group full-width">
        <label>Description</label>
        <textarea v-model="description" v-bind="descriptionProps" rows="2" placeholder="Brief description..." @input="updateParent"></textarea>
      </div>

      <div class="form-group full-width">
        <label>Tags</label>
        <div class="input-row">
          <input v-model="tagInput" placeholder="Add tag..." @keyup.enter="addTag" />
          <button class="secondary mini" @click="addTag"><Plus :size="14" /></button>
        </div>
        <div class="chips-container">
          <span v-for="tag in values.tags" :key="tag" class="chip clickable" @click="removeTag(tag)">
            {{ tag }} <X :size="12" class="close" />
          </span>
        </div>
      </div>

      <div class="form-group full-width assets-row">
        <div class="asset-upload-container">
          <label>Mod Icon (1:1)</label>
          <div class="asset-preview icon-preview" :style="{ backgroundImage: iconPreview ? `url(${iconPreview})` : '' }">
            <span v-if="!iconPreview" class="empty-asset"><ImageIcon :size="24" /> No Icon</span>
            <input type="file" accept="image/png,image/jpeg" @change="handleAssetUpload($event, 'icon')" />
          </div>
          <p class="asset-hint">PNG, 1:1 ratio (e.g. 512x512)</p>
        </div>

        <div class="asset-upload-container">
          <label>Mod Thumbnail (3:2)</label>
          <div class="asset-preview thumb-preview" :style="{ backgroundImage: thumbPreview ? `url(${thumbPreview})` : '' }">
            <span v-if="!thumbPreview" class="empty-asset"><ImageIcon :size="24" /> No Thumbnail</span>
            <input type="file" accept="image/png,image/jpeg" @change="handleAssetUpload($event, 'thumb')" />
          </div>
          <p class="asset-hint">PNG, 3:2 ratio (e.g. 1200x800)</p>
        </div>
      </div>

      <div class="form-group full-width">
        <label>Links (GitHub, Discord, etc.)</label>
        <div class="input-row multi">
          <input v-model="linkKey" placeholder="Label" class="short" />
          <input v-model="linkUrl" placeholder="https://..." class="long" />
          <button class="secondary mini" @click="addLink"><Plus :size="14" /></button>
        </div>
        <div class="link-list">
          <div v-for="(url, key) in values.links" :key="String(key)" class="link-item">
            <Link :size="14" class="link-icon" />
            <div class="link-info">
              <strong>{{ key }}:</strong> <span>{{ url }}</span>
            </div>
            <button class="icon-btn danger" @click="removeLink(String(key))">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spec-editor {
  text-align: left;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h2 { margin: 0; }

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.badge-success { background: rgba(0, 230, 118, 0.2); color: var(--success); }
.badge-error { background: rgba(255, 74, 74, 0.2); color: var(--error); }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width { grid-column: span 2; }

label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 1px;
}

input, textarea {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 0.8rem;
  color: white;
  font-family: inherit;
  font-size: 0.95rem;
}

input:focus, textarea:focus {
  border-color: var(--accent);
  outline: none;
  background: rgba(0, 162, 255, 0.05);
}

.error-msg {
  color: var(--error);
  font-size: 0.75rem;
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

.input-row button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
}

.input-row.multi .short { flex: 1; }
.input-row.multi .long { flex: 2; }

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.chip {
  background: rgba(0, 162, 255, 0.1);
  color: var(--accent);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(0, 162, 255, 0.2);
}

.chip.clickable { cursor: pointer; transition: all 0.2s; }
.chip.clickable:hover { background: rgba(0, 162, 255, 0.2); }

.link-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.link-item {
  background: rgba(255,255,255,0.01);
  padding: 0.8rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  border: 1px solid var(--glass-border);
}

.link-icon { color: #555; }
.link-info { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
.link-info span { color: #888; overflow: hidden; text-overflow: ellipsis; }

.empty-asset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.4;
}

.icon-btn.danger {
  background: none;
  border: none;
  color: var(--error);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.assets-row {
  display: flex !important;
  gap: 2rem;
  border-top: 1px solid var(--glass-border);
  padding-top: 2rem;
  margin-top: 1rem;
}

.asset-upload-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.asset-preview {
  position: relative;
  border: 2px dashed var(--glass-border);
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: rgba(255,255,255,0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 0.8rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.asset-preview:hover {
  border-color: var(--accent);
  background-color: var(--accent-muted);
}

.asset-preview input {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0;
  cursor: pointer;
}

.icon-preview {
  width: 100px;
  height: 100px;
}

.thumb-preview {
  width: 100%;
  height: 100px;
}

.asset-hint {
  font-size: 0.7rem;
  color: #666;
  font-style: italic;
}
</style>
