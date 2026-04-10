// Simple database service using localStorage instead of SQLite
import type { KnowledgeNode, KnowledgeEdge } from '@mytypes'
import { v4 as uuidv4 } from 'uuid'
import { storageService } from './storage'

// Helper to parse database rows (for compatibility)
function parseNode(row: any): KnowledgeNode {
  return {
    id: row.id,
    label: row.label,
    content: row.content || '',
    type: row.type || 'concept',
    tags: row.tags || [],
    createdAt: row.createdAt || Date.now(),
    updatedAt: row.updatedAt || Date.now(),
    position: row.position || { x: 0, y: 0 },
    metadata: row.metadata || {},
  }
}

function parseEdge(row: any): KnowledgeEdge {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    label: row.label || '',
    strength: row.strength || 0.5,
    type: row.type || 'manual',
    createdAt: row.createdAt || Date.now(),
  }
}

// Node operations
export const dbService = {
  // Load all data
  async loadAll(): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    return storageService.load()
  },

  // Nodes
  async getAllNodes(): Promise<KnowledgeNode[]> {
    const { nodes } = storageService.load()
    return nodes.map(parseNode)
  },

  async getNodeById(id: string): Promise<KnowledgeNode | null> {
    const { nodes } = storageService.load()
    const node = nodes.find((n) => n.id === id)
    return node ? parseNode(node) : null
  },

  async searchNodes(query: string): Promise<KnowledgeNode[]> {
    const { nodes } = storageService.load()
    const lowerQuery = query.toLowerCase()
    
    const filtered = nodes.filter((n) =>
      n.label.toLowerCase().includes(lowerQuery) ||
      n.content.toLowerCase().includes(lowerQuery) ||
      n.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    )
    
    return filtered.map(parseNode)
  },

  async createNode(nodeData: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeNode> {
    const id = uuidv4()
    const now = Date.now()
    const newNode: KnowledgeNode = {
      ...nodeData,
      id,
      createdAt: now,
      updatedAt: now,
    }

    const { nodes, edges } = storageService.load()
    nodes.push(newNode)
    storageService.save({ nodes, edges })

    return newNode
  },

  async updateNode(id: string, updates: Partial<KnowledgeNode>): Promise<void> {
    const { nodes, edges } = storageService.load()
    const index = nodes.findIndex((n) => n.id === id)
    
    if (index !== -1) {
      nodes[index] = {
        ...nodes[index],
        ...updates,
        updatedAt: Date.now(),
      }
      storageService.save({ nodes, edges })
    }
  },

  async deleteNode(id: string): Promise<void> {
    const { nodes, edges } = storageService.load()
    const filteredNodes = nodes.filter((n) => n.id !== id)
    // Also delete related edges
    const filteredEdges = edges.filter((e) => e.source !== id && e.target !== id)
    storageService.save({ nodes: filteredNodes, edges: filteredEdges })
  },

  // Edges
  async getAllEdges(): Promise<KnowledgeEdge[]> {
    const { edges } = storageService.load()
    return edges.map(parseEdge)
  },

  async getEdgesByNodeId(nodeId: string): Promise<KnowledgeEdge[]> {
    const { edges } = storageService.load()
    const filtered = edges.filter((e) => e.source === nodeId || e.target === nodeId)
    return filtered.map(parseEdge)
  },

  async createEdge(edgeData: Omit<KnowledgeEdge, 'id' | 'createdAt'>): Promise<KnowledgeEdge> {
    const id = uuidv4()
    const now = Date.now()
    const newEdge: KnowledgeEdge = {
      ...edgeData,
      id,
      createdAt: now,
    }

    const { nodes, edges } = storageService.load()
    edges.push(newEdge)
    storageService.save({ nodes, edges })

    return newEdge
  },

  async updateEdge(id: string, updates: Partial<KnowledgeEdge>): Promise<void> {
    const { nodes, edges } = storageService.load()
    const index = edges.findIndex((e) => e.id === id)
    
    if (index !== -1) {
      edges[index] = { ...edges[index], ...updates }
      storageService.save({ nodes, edges })
    }
  },

  async deleteEdge(id: string): Promise<void> {
    const { nodes, edges } = storageService.load()
    const filteredEdges = edges.filter((e) => e.id !== id)
    storageService.save({ nodes, edges: filteredEdges })
  },
}
