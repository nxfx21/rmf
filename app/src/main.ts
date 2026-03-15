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
