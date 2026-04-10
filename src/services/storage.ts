import type { KnowledgeNode, KnowledgeEdge, ExportData } from '@mytypes'

const STORAGE_KEY = 'holograph_data'
const BACKUP_KEY = 'holograph_backup'

interface StorageData {
  version: string
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  lastSync: number
}

let debouncedSaveTimer: ReturnType<typeof setInterval> | null = null

export const storageService = {
  save(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): void {
    const storageData: StorageData = {
      version: '1.0.0',
      nodes: data.nodes,
      edges: data.edges,
      lastSync: Date.now(),
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
      localStorage.setItem(BACKUP_KEY, JSON.stringify(storageData))
    } catch (error) {
      console.error('Failed to save data:', error)
      throw new Error('Storage full, please delete some data')
    }
  },

  load(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return { nodes: [], edges: [] }
      }
      
      const parsed: StorageData = JSON.parse(data)
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      return this.restoreFromBackup()
    }
  },

  restoreFromBackup(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    try {
      const backup = localStorage.getItem(BACKUP_KEY)
      if (!backup) {
        return { nodes: [], edges: [] }
      }
      
      const parsed: StorageData = JSON.parse(backup)
      localStorage.setItem(STORAGE_KEY, backup)
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
      }
    } catch (error) {
      return { nodes: [], edges: [] }
    }
  },

  exportToFile(): ExportData {
    const { nodes, edges } = this.load()
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    }
  },

  importFromFile(data: ExportData): boolean {
    try {
      if (!data.nodes || !data.edges) {
        throw new Error('Invalid data format')
      }
      
      this.save({
        nodes: data.nodes,
        edges: data.edges,
      })
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(BACKUP_KEY)
  },

  getStats(): { nodes: number; edges: number; lastSync: number | null } {
    const { nodes, edges } = this.load()
    const data = localStorage.getItem(STORAGE_KEY)
    const lastSync = data ? JSON.parse(data).lastSync : null
    
    return {
      nodes: nodes.length,
      edges: edges.length,
      lastSync,
    }
  },

  setupAutoSave(
    getData: () => { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] },
    interval: number = 30000
  ): void {
    if (debouncedSaveTimer) {
      clearInterval(debouncedSaveTimer)
    }

    debouncedSaveTimer = setInterval(() => {
      const data = getData()
      this.save(data)
      console.log('Auto-saved at', new Date().toLocaleTimeString())
    }, interval)
  },

  stopAutoSave(): void {
    if (debouncedSaveTimer) {
      clearInterval(debouncedSaveTimer)
      debouncedSaveTimer = null
    }
  },
}

export const memoryStorage = {
  data: {
    nodes: [] as KnowledgeNode[],
    edges: [] as KnowledgeEdge[],
  },

  save(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): void {
    this.data = { ...data }
  },

  load(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    return { ...this.data }
  },

  clear(): void {
    this.data = { nodes: [], edges: [] }
  },
}
