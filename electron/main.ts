import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

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
    // __dirname is dist-electron/ (in asar)
    // Need to go up one level to reach dist/
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html')
    console.log('Loading index from:', indexPath)
    console.log('__dirname:', __dirname)
    console.log('Current directory contents:', fs.readdirSync(path.resolve(__dirname, '..')))
    
    // Check if file exists
    if (!fs.existsSync(indexPath)) {
      console.error('Index file not found at:', indexPath)
      // Try alternative paths
      const altPath1 = path.resolve(__dirname, 'dist', 'index.html')
      const altPath2 = path.resolve(process.resourcesPath, 'dist', 'index.html')
      const altPath3 = path.resolve(app.getAppPath(), 'dist', 'index.html')
      
      console.log('Trying alternative paths:')
      console.log('  alt1:', altPath1, 'exists:', fs.existsSync(altPath1))
      console.log('  alt2:', altPath2, 'exists:', fs.existsSync(altPath2))
      console.log('  alt3:', altPath3, 'exists:', fs.existsSync(altPath3))
      console.log('  resourcesPath:', process.resourcesPath)
      console.log('  appPath:', app.getAppPath())
    }
    
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

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed')
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize app
app.whenReady().then(() => {
  console.log('App ready, creating window...')
  console.log('resourcesPath:', process.resourcesPath)
  console.log('appPath:', app.getAppPath())
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
  // Return empty data - graph data is now managed by the frontend
  return { nodes: [], edges: [] }
})

ipcMain.handle('save-graph-data', async (_, data) => {
  // Save to a file
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (filePath) {
    const fs = await import('fs')
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
    const fs = await import('fs')
    const data = fs.readFileSync(filePaths[0], 'utf-8')
    return { data, canceled: false }
  }
  return { data: null, canceled: true }
})
