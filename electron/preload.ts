import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script loaded')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Graph data
  getGraphData: () => ipcRenderer.invoke('get-graph-data'),
  saveGraphData: (data: unknown) => ipcRenderer.invoke('save-graph-data', data),
  
  // Import/Export
  exportGraph: (format: string) => ipcRenderer.invoke('export-graph', format),
  importGraph: () => ipcRenderer.invoke('import-graph'),
  
  // Platform info
  platform: process.platform,
  versions: process.versions,
})

console.log('Preload script completed')
