// Re-export from storage service for compatibility
import { storageService } from './storage'

// Adapter to match the old dbService interface
export const dbService = {
  async getAllNodes() {
    return storageService.loadNodes()
  },
  
  async getAllEdges() {
    return storageService.loadEdges()
  },
  
  async createNode(nodeData: any) {
    const newNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...nodeData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await storageService.saveNode(newNode)
    return newNode
  },
  
  async updateNode(id: string, updates: any) {
    const nodes = await storageService.loadNodes()
    const node = nodes.find((n) => n.id === id)
    if (node) {
      const updated = { ...node, ...updates, updatedAt: Date.now() }
      await storageService.saveNode(updated)
    }
  },
  
  async deleteNode(id: string) {
    await storageService.deleteNode(id)
  },
  
  async createEdge(edgeData: any) {
    const newEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...edgeData,
      createdAt: Date.now(),
    }
    await storageService.saveEdge(newEdge)
    return newEdge
  },
  
  async updateEdge(id: string, updates: any) {
    const edges = await storageService.loadEdges()
    const edge = edges.find((e) => e.id === id)
    if (edge) {
      const updated = { ...edge, ...updates }
      await storageService.saveEdge(updated)
    }
  },
  
  async deleteEdge(id: string) {
    await storageService.deleteEdge(id)
  },
}
