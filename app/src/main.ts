import './style.css'
import JSZip from 'jszip'

const dropZone = document.getElementById('drop-zone')! as HTMLDivElement
const resultsContainer = document.getElementById('results-container')! as HTMLDivElement
const resultsLog = document.getElementById('results-log')! as HTMLDivElement
const packageBtn = document.getElementById('package-btn')! as HTMLButtonElement
const resetBtn = document.getElementById('reset-btn')! as HTMLButtonElement

let currentFiles: { path: string; file: File | Blob }[] = []
let manifestData: any = null

const REQUIRED_FIELDS = ["rmf_version", "id", "name", "version", "author"]
const FORBIDDEN_EXTENSIONS = [".plist", ".ini", ".dat", ".ds_store", "thumbs.db"]

// --- UI Helpers ---
function log(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  const entry = document.createElement('div')
  entry.className = `log-entry log-${type}`
  entry.innerText = msg
  resultsLog.appendChild(entry)
  resultsContainer.classList.remove('hidden')
}

function clearLog() {
  resultsLog.innerHTML = ''
  resultsContainer.classList.add('hidden')
  packageBtn.classList.add('hidden')
  currentFiles = []
  manifestData = null
}

// --- Validation Logic ---
async function validateRMF() {
  log('Starting validation...', 'info')
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Check for manifest.json
  const manifestFile = currentFiles.find(f => f.path.toLowerCase() === 'manifest.json')
  if (!manifestFile) {
    errors.push('Missing required file: manifest.json')
  } else {
    try {
      const content = await (manifestFile.file as File).text()
      manifestData = JSON.parse(content)
      for (const field of REQUIRED_FIELDS) {
        if (!manifestData[field]) {
          errors.push(`Manifest missing required field: ${field}`)
        }
      }
      log('[SUCCESS] manifest.json is valid.', 'success')
    } catch (e) {
      errors.push('manifest.json is not valid JSON.')
    }
  }

  // 2. Check for forbidden files
  for (const f of currentFiles) {
    const lowPath = f.path.toLowerCase()
    if (FORBIDDEN_EXTENSIONS.some(ext => lowPath.endsWith(ext))) {
      errors.push(`Forbidden platform-specific file found: ${f.path}`)
    }
  }

  // 3. Recommended files
  const recommended = ['README.md', 'icon.svg', 'thumbnail.svg']
  for (const rec of recommended) {
    if (!currentFiles.some(f => f.path.toLowerCase() === rec)) {
      warnings.push(`Missing recommended file: ${rec}`)
    }
  }

  // Display results
  warnings.forEach(w => log(`[WARNING] ${w}`, 'info'))
  errors.forEach(e => log(`[ERROR] ${e}`, 'error'))

  if (errors.length === 0) {
    log('Validation Passed!', 'success')
    packageBtn.classList.remove('hidden')
  } else {
    log('Validation Failed.', 'error')
  }
}

// --- Drag & Drop ---
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.classList.add('active')
})

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('active')
})

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault()
  dropZone.classList.remove('active')
  clearLog()
  
  const items = e.dataTransfer?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i].webkitGetAsEntry()
    if (item) {
      await traverseFileTree(item, '')
    }
  }

  if (currentFiles.length > 0) {
    validateRMF()
  }
})

// Recursive tree traversal for folders
async function traverseFileTree(item: any, path: string) {
  if (item.isFile) {
    const file = await new Promise<File>((resolve) => item.file(resolve))
    currentFiles.push({ path: path + item.name, file })
  } else if (item.isDirectory) {
    const dirReader = item.createReader()
    const entries = await new Promise<any[]>((resolve) => dirReader.readEntries(resolve))
    for (const entry of entries) {
      await traverseFileTree(entry, path + item.name + '/')
    }
  }
}

// --- Packaging ---
packageBtn.addEventListener('click', async () => {
  const zip = new JSZip()
  for (const f of currentFiles) {
    zip.file(f.path, f.file)
  }
  
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = (manifestData?.id || 'mod') + '.rmf'
  a.click()
  URL.revokeObjectURL(url)
  log(`Package generated: ${a.download}`, 'success')
})

resetBtn.addEventListener('click', clearLog)

// --- Tab Switching ---
const tabValidator = document.getElementById('tab-validator')! as HTMLButtonElement
const tabBuilder = document.getElementById('tab-builder')! as HTMLButtonElement
const viewValidator = document.getElementById('view-validator')! as HTMLDivElement
const viewBuilder = document.getElementById('view-builder')! as HTMLDivElement

tabValidator.addEventListener('click', () => {
  tabValidator.classList.add('active')
  tabBuilder.classList.remove('active')
  viewValidator.classList.remove('hidden')
  viewBuilder.classList.add('hidden')
})

tabBuilder.addEventListener('click', () => {
  tabBuilder.classList.add('active')
  tabValidator.classList.remove('active')
  viewBuilder.classList.remove('hidden')
  viewValidator.classList.add('hidden')
})

// --- Builder Logic ---
const builderForm = document.getElementById('builder-form')! as HTMLFormElement

// --- Meta Filesystem Logic ---
const fsRootChildren = document.getElementById('fs-root-children')! as HTMLDivElement

function updateMetaFilesystem() {
  const iconInput = document.getElementById('b-icon') as HTMLInputElement
  const thumbInput = document.getElementById('b-thumb') as HTMLInputElement
  const contentInput = document.getElementById('b-content') as HTMLInputElement
  const idValue = (document.getElementById('b-id') as HTMLInputElement).value
  
  if (!idValue && !iconInput.files?.length && !thumbInput.files?.length && !contentInput.files?.length) {
      fsRootChildren.innerHTML = '<p class="fs-empty">Fill out the form and add files to see the package preview.</p>'
      return
  }
  
  fsRootChildren.innerHTML = ''
  
  // 1. Manifest
  const manifestEl = document.createElement('div')
  manifestEl.className = 'fs-item'
  manifestEl.innerHTML = '<span class="icon">📄</span> <span class="name">manifest.json</span>'
  fsRootChildren.appendChild(manifestEl)
  
  // 2. Icon
  if (iconInput.files && iconInput.files.length > 0) {
    const iconEl = document.createElement('div')
    iconEl.className = 'fs-item'
    iconEl.innerHTML = `<span class="icon">🖼️</span> <span class="name">icon.${iconInput.files[0].name.split('.').pop()}</span>`
    fsRootChildren.appendChild(iconEl)
  }
  
  // 3. Thumbnail
  if (thumbInput.files && thumbInput.files.length > 0) {
    const thumbEl = document.createElement('div')
    thumbEl.className = 'fs-item'
    thumbEl.innerHTML = `<span class="icon">🖼️</span> <span class="name">thumbnail.${thumbInput.files[0].name.split('.').pop()}</span>`
    fsRootChildren.appendChild(thumbEl)
  }
  
  // 4. Content Folder
  if (contentInput.files && contentInput.files.length > 0) {
    const contentDirEl = document.createElement('div')
    contentDirEl.className = 'fs-item folder'
    contentDirEl.innerHTML = `<span class="icon">📁</span> <span class="name">content/</span>`
    fsRootChildren.appendChild(contentDirEl)
    
    // Add up to 5 items to show a preview
    const previewCount = Math.min(5, contentInput.files.length)
    for (let i = 0; i < previewCount; i++) {
        const file = contentInput.files[i]
        const parts = file.webkitRelativePath.split('/')
        parts.shift()
        const newPath = parts.length > 0 ? parts.join('/') : file.name
        
        const fileEl = document.createElement('div')
        fileEl.className = 'fs-item nested'
        fileEl.innerHTML = `<span class="icon">📄</span> <span class="name">${newPath}</span>`
        fsRootChildren.appendChild(fileEl)
    }
    
    if (contentInput.files.length > 5) {
        const moreEl = document.createElement('div')
        moreEl.className = 'fs-item nested more'
        moreEl.innerHTML = `<span>... and ${contentInput.files.length - 5} more files</span>`
        fsRootChildren.appendChild(moreEl)
    }
  }
}

// Attach listeners
document.getElementById('b-id')?.addEventListener('input', updateMetaFilesystem)
document.getElementById('b-icon')?.addEventListener('change', updateMetaFilesystem)
document.getElementById('b-thumb')?.addEventListener('change', updateMetaFilesystem)
document.getElementById('b-content')?.addEventListener('change', updateMetaFilesystem)


builderForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const idValue = (document.getElementById('b-id') as HTMLInputElement).value
  const nameValue = (document.getElementById('b-name') as HTMLInputElement).value
  const versionValue = (document.getElementById('b-version') as HTMLInputElement).value
  const authorValue = (document.getElementById('b-author') as HTMLInputElement).value
  const descValue = (document.getElementById('b-desc') as HTMLTextAreaElement).value
  
  const iconInput = document.getElementById('b-icon') as HTMLInputElement
  const thumbInput = document.getElementById('b-thumb') as HTMLInputElement
  const contentInput = document.getElementById('b-content') as HTMLInputElement
  
  const newManifest = {
    rmf_version: "1.0",
    id: idValue,
    name: nameValue,
    version: versionValue,
    author: authorValue,
    description: descValue || undefined
  }
  
  const zip = new JSZip()
  
  // Add manifest
  zip.file('manifest.json', JSON.stringify(newManifest, null, 2))
  
  // Add icon
  if (iconInput.files && iconInput.files.length > 0) {
    const ext = iconInput.files[0].name.split('.').pop()
    zip.file(`icon.${ext}`, iconInput.files[0])
  }
  
  // Add thumbnail
  if (thumbInput.files && thumbInput.files.length > 0) {
    const ext = thumbInput.files[0].name.split('.').pop()
    zip.file(`thumbnail.${ext}`, thumbInput.files[0])
  }
  
  // Add content files
  if (contentInput.files && contentInput.files.length > 0) {
    const contentFolder = zip.folder('content')
    for (let i = 0; i < contentInput.files.length; i++) {
        const file = contentInput.files[i]
        // webkitRelativePath contains the full relative path, e.g. "foldername/file.txt"
        // Strip the top-level folder name to nest it nicely inside content/
        const parts = file.webkitRelativePath.split('/')
        parts.shift() 
        const newPath = parts.length > 0 ? parts.join('/') : file.name
        contentFolder?.file(newPath, file)
    }
  }
  
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${newManifest.id}.rmf`
  a.click()
  URL.revokeObjectURL(url)
})
