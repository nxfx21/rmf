<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Tree from 'primevue/tree'
import Button from 'primevue/button'
import { useFileSystem } from '../store'
import Swal from 'sweetalert2'

const { writeFile, unlink, readDirRecursive, pfs } = useFileSystem()

const emit = defineEmits(['select'])
const nodes = ref<any[]>([])
const selectedKey = ref<Record<string, boolean>>({})

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
        let icon = isFile ? 'pi pi-file' : 'pi pi-folder'
        let styleClass = ''
        
        // Spec Indicators
        if (isFile) {
          if (part === 'manifest.json') icon = 'pi pi-cog';
          else if (part === 'README.md') icon = 'pi pi-info-circle';
          else if (part === 'icon.png' || part === 'thumbnail.png') icon = 'pi pi-image';
          
          // Warnings for platform specific files
          if (['.DS_Store', 'thumbs.db', '.plist', '.ini', '.dat'].includes(part)) {
            styleClass = 'warning-node'
          }
        }
        
        node = {
          key: existingPath,
          label: part,
          icon: icon,
          styleClass: styleClass,
          children: isFile ? undefined : []
        }
        currentLevel.push(node)
      }
      currentLevel = node.children || []
    })
  })
  
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
      <h3>📁 Project Explorer</h3>
      <div class="actions">
        <label title="Upload Files" class="custom-action p-button p-button-sm p-button-secondary">
          <i class="pi pi-upload"></i>
          <input type="file" multiple @change="handleFileUpload" hidden />
        </label>
        <Button 
          icon="pi pi-file-plus" 
          severity="secondary" 
          size="small" 
          title="New File"
          @click="createNew('file')"
        />
        <Button 
          icon="pi pi-folder-plus" 
          severity="secondary" 
          size="small" 
          title="New Folder"
          @click="createNew('folder')"
        />
        <Button 
          icon="pi pi-trash" 
          severity="danger" 
          size="small" 
          title="Delete selected"
          :disabled="Object.keys(selectedKey).length === 0"
          @click="deleteSelected"
        />
      </div>
    </div>

    <div class="tree-container">
      <Tree 
        :value="nodes" 
        selectionMode="single" 
        v-model:selectionKeys="selectedKey"
        class="rmf-tree"
      />
      <div v-if="nodes.length === 0" class="empty-hint">
        Import a project or use the buttons above to start.
      </div>
    </div>

    <div class="footer-info">
      <div class="legend">
        <span class="warning-dot"></span> Non-compliant file warning
      </div>
      <p>LightningFS Powered VFS</p>
    </div>
  </div>
</template>

<style scoped>
.fs-explorer {
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

h3 { margin: 0; font-size: 1.1rem; }

.actions { display: flex; gap: 0.25rem; }

.tree-container {
  flex-grow: 1;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  position: relative;
}

.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #555;
  font-size: 0.8rem;
  text-align: center;
  width: 80%;
}

.custom-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 4px;
}

.footer-info {
  margin-top: 1rem;
  font-size: 0.7rem;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-dot {
  width: 8px;
  height: 8px;
  background: var(--error);
  border-radius: 50%;
}

:deep(.p-tree) {
  background: transparent;
  border: none;
  color: #ccc;
  font-size: 0.9rem;
}

:deep(.p-tree-toggler) { color: var(--accent); }
:deep(.p-tree-node-content.p-highlight) { background: rgba(0, 162, 255, 0.1); color: var(--accent); }

:deep(.warning-node) .p-treenode-label {
  color: var(--error);
  text-decoration: line-through;
  opacity: 0.6;
}

:deep(.warning-node) .p-treenode-icon {
  color: var(--error);
}
</style>
