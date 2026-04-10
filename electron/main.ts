import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'HoloGraph | 全像星图',
    backgroundColor: '#0a0a0f',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development: load from Vite dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Production: load from asar or file system
    // Try multiple path strategies
    const possiblePaths = [
      // Standard asar structure
      path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
      // Unpacked asar
      path.join(app.getAppPath(), 'dist', 'index.html'),
      // Relative to __dirname (dist-electron)
      path.join(__dirname, '..', 'dist', 'index.html'),
      // Relative to current file
      path.join(__dirname, 'dist', 'index.html'),
    ]
    
    console.log('__dirname (ESM):', __dirname)
    console.log('resourcesPath:', process.resourcesPath)
    console.log('appPath:', app.getAppPath())
    console.log('Checking possible paths:')
    
    let indexPath: string | null = null
    for (const p of possiblePaths) {
      const exists = fs.existsSync(p)
      console.log(`  ${exists ? '✓' : '✗'} ${p}`)
      if (exists && !indexPath) {
        indexPath = p
      }
    }
    
    if (!indexPath) {
      console.error('Could not find index.html in any location!')
      mainWindow.loadURL(`data:text/html,
        <html>
          <body style="background: #0a0a0f; color: #fff; font-family: sans-serif; padding: 20px;">
            <h1>Error: Application files not found</h1>
            <p>Please check the installation.</p>
          </body>
        </html>
      `)
      return
    }
    
    console.log('Loading from:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Handle load failure
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    mainWindow?.loadURL(`data:text/html,
      <html>
        <body style="background: #0a0a0f; color: #fff; font-family: sans-serif; padding: 20px;">
          <h1>Failed to load application</h1>
          <p>Error code: ${errorCode}</p>
          <p>Error: ${errorDescription}</p>
          <p>Please check the console for more details.</p>
        </body>
      </html>
    `)
  })

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    const levelStr = ['debug', 'info', 'warn', 'error'][level] || 'log'
    console.log(`[Renderer ${levelStr}]`, message, `(${sourceId}:${line})`)
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready')
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize app
app.whenReady().then(() => {
  console.log('App ready, creating window...')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers
ipcMain.handle('get-graph-data', () => {
  return { nodes: [], edges: [] }
})

ipcMain.handle('save-graph-data', async (_, data) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  }
  return { success: !!filePath }
})

ipcMain.handle('export-graph', async (_, format: string) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: format.toUpperCase(), extensions: [format] }]
  })
  return { filePath, canceled: !filePath }
})

ipcMain.handle('import-graph', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (filePaths && filePaths.length > 0) {
    const data = fs.readFileSync(filePaths[0], 'utf-8')
    return { data, canceled: false }
  }
  return { data: null, canceled: true }
})
