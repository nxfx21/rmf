<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Tree from 'primevue/tree'
import { Folder, FileText, Trash2, Plus, RefreshCw, AlertCircle, Upload, Settings, Info, Image as ImageIcon } from 'lucide-vue-next'
import { useFileSystem } from '../store'
import Swal from 'sweetalert2'

const { writeFile, unlink, readDirRecursive, pfs } = useFileSystem()
const nodes = ref<any[]>([])
const selectedKey = ref<Record<string, boolean>>({})
const emit = defineEmits(['select'])

watch(selectedKey, (newVal) => {
  const key = Object.keys(newVal)[0]
  if (key) emit('select', key)
})

const refreshTree = async () => {
  const files = await readDirRecursive()
  const root: any[] = []
  
  files.sort().forEach(path => {
    const parts = (path.startsWith('/') ? path.slice(1) : path).split('/')
    let currentLevel = root
    
    parts.forEach((part, index) => {
      let existingPath = parts.slice(0, index + 1).join('/')
      if (!existingPath.startsWith('/')) existingPath = '/' + existingPath
      
      let node = currentLevel.find(n => n.label === part)
      
      if (!node) {
        const isFile = index === parts.length - 1
        let type = isFile ? 'file' : 'directory'
        let subType = 'default'
        let styleClass = ''
        
        // Spec Indicators
        if (isFile) {
          if (part === 'manifest.json') subType = 'manifest';
          else if (part === 'README.md') subType = 'readme';
          else if (part === 'icon.png' || part === 'thumbnail.png') subType = 'image';
          
          // Warnings for platform specific files
          if (['.DS_Store', 'thumbs.db', '.plist', '.ini', '.dat'].includes(part)) {
            styleClass = 'warning-node'
          }
        }
        
        node = {
          key: existingPath,
          label: part,
          type: type,
          subType: subType,
          styleClass: styleClass,
          children: isFile ? undefined : []
        }
        currentLevel.push(node)
      }
      currentLevel = node.children || []
    })
  });
  
  nodes.value = root
}

const handleFileUpload = async (event: any) => {
  const files = event.target.files
  for (const file of files) {
    const path = file.webkitRelativePath || file.name
    await writeFile(path, file)
  }
  await refreshTree()
}

const createNew = async (type: 'file' | 'folder') => {
  const selectedPath = Object.keys(selectedKey.value)[0] || '/'
  const { value: name } = await Swal.fire({
    title: `New ${type}`,
    input: 'text',
    inputLabel: 'Name',
    showCancelButton: true,
    background: '#1a1a1a',
    color: '#fff',
    inputValidator: (value) => {
      if (!value) return 'Name is required'
    }
  })

  if (name) {
    const fullPath = selectedPath === '/' ? `/${name}` : `${selectedPath}/${name}`
    try {
      if (type === 'file') {
        await writeFile(fullPath, '')
      } else {
        await pfs.mkdir(fullPath)
      }
      await refreshTree()
    } catch (e) {
      Swal.fire('Error', String(e), 'error')
    }
  }
}

const deleteSelected = async () => {
  const key = Object.keys(selectedKey.value)[0]
  if (key) {
    const result = await Swal.fire({
      title: 'Delete?',
      text: `Are you sure you want to delete ${key}?`,
      icon: 'warning',
      showCancelButton: true,
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#ff4a4a'
    })

    if (result.isConfirmed) {
      try {
        await unlink(key)
        selectedKey.value = {}
        await refreshTree()
      } catch (e) {
        Swal.fire('Error', String(e), 'error')
      }
    }
  }
}

onMounted(refreshTree)

defineExpose({ refreshTree })
</script>

<template>
  <div class="card fs-explorer animate-fade-in">
    <div class="header">
      <h3>Project Explorer</h3>
      <div class="actions">
        <button 
          class="mini secondary action-btn" 
          title="Refresh Tree" 
          @click="refreshTree"
        >
          <RefreshCw :size="16" />
        </button>
        <label title="Upload Files" class="custom-action action-btn">
          <Upload :size="16" />
          <input type="file" multiple @change="handleFileUpload" hidden />
        </label>
        <button 
          class="mini secondary action-btn"
          title="New File"
          @click="createNew('file')"
        >
          <Plus :size="14" /> <FileText :size="12" />
        </button>
        <button 
          class="mini secondary action-btn"
          title="New Folder"
          @click="createNew('folder')"
        >
          <Plus :size="14" /> <Folder :size="12" />
        </button>
        <button 
          class="mini secondary danger action-btn"
          title="Delete selected"
          :disabled="Object.keys(selectedKey).length === 0"
          @click="deleteSelected"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <div class="tree-container">
      <Tree 
        :value="nodes" 
        selectionMode="single" 
        v-model:selectionKeys="selectedKey"
        class="rmf-tree"
      >
        <template #nodeicon="slotProps">
          <Folder v-if="slotProps.node.type === 'directory'" :size="16" class="node-icon dir" />
          <Settings v-else-if="slotProps.node.subType === 'manifest'" :size="16" class="node-icon manifest" />
          <Info v-else-if="slotProps.node.subType === 'readme'" :size="16" class="node-icon readme" />
          <ImageIcon v-else-if="slotProps.node.subType === 'image'" :size="16" class="node-icon image" />
          <FileText v-else :size="16" class="node-icon file" />
        </template>
      </Tree>
      <div v-if="nodes.length === 0" class="empty-hint">
        Import a project or use the buttons above to start.
      </div>
    </div>

    <div class="footer-info">
      <div class="legend">
        <AlertCircle :size="12" style="color: var(--error)" /> Non-compliant file
      </div>
      <p>LightningFS VFS</p>
    </div>
  </div>
</template>

<style scoped>
.fs-explorer {
  text-align: left;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; }

.actions { display: flex; gap: 0.5rem; }

.action-btn {
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}

.tree-container {
  flex-grow: 1;
  min-height: 350px;
  max-height: 550px;
  overflow-y: auto;
  background: rgba(0,0,0,0.15);
  border-radius: 12px;
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  position: relative;
}

.empty-hint {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #444;
  font-size: 0.8rem;
  text-align: center;
  width: 80%;
}

.footer-info {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

:deep(.p-tree) {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 0.85rem;
}

:deep(.p-tree-node-content) {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

:deep(.p-tree-toggler) { 
  color: #555; 
  width: 1.5rem;
  height: 1.5rem;
}

:deep(.p-tree-node-content.p-highlight) { 
  background: rgba(0, 162, 255, 0.1); 
  color: var(--accent); 
}

.node-icon { margin-right: 0.5rem; }
.node-icon.dir { color: var(--accent); }
.node-icon.manifest { color: #facc15; }
.node-icon.readme { color: #38bdf8; }
.node-icon.image { color: #a855f7; }
.node-icon.file { color: #71717a; }

:deep(.warning-node) .p-treenode-label {
  color: var(--error);
  text-decoration: line-through;
  opacity: 0.5;
}

button.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}
</style>
