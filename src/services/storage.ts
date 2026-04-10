import type { KnowledgeNode, KnowledgeEdge, ExportData } from '@mytypes'

// Storage keys
const STORAGE_KEYS = {
  NODES: 'holograph:nodes',
  EDGES: 'holograph:edges',
  SESSIONS: 'holograph:sessions',
  SETTINGS: 'holograph:settings',
  VERSION: 'holograph:version',
}

// Current data version for migrations
const CURRENT_VERSION = '2.0.0'

/**
 * Storage Service - 处理本地数据持久化
 * 使用 localStorage 存储图谱数据
 */
export const storageService = {
  // ===== 版本管理 =====
  
  getVersion(): string {
    return localStorage.getItem(STORAGE_KEYS.VERSION) || '1.0.0'
  },
  
  setVersion(version: string): void {
    localStorage.setItem(STORAGE_KEYS.VERSION, version)
  },
  
  // ===== 节点操作 =====
  
  async loadNodes(): Promise<KnowledgeNode[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NODES)
      if (!data) return []
      
      const nodes = JSON.parse(data) as KnowledgeNode[]
      
      // 数据迁移：为旧数据添加 metadata
      return nodes.map((node) => this.migrateNode(node))
    } catch (error) {
      console.error('Failed to load nodes:', error)
      return []
    }
  },
  
  async saveNode(node: KnowledgeNode): Promise<void> {
    try {
      const nodes = await this.loadNodes()
      const index = nodes.findIndex((n) => n.id === node.id)
      
      if (index >= 0) {
        nodes[index] = node
      } else {
        nodes.push(node)
      }
      
      localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes))
    } catch (error) {
      console.error('Failed to save node:', error)
      throw error
    }
  },
  
  async deleteNode(id: string): Promise<void> {
    try {
      const nodes = await this.loadNodes()
      const filtered = nodes.filter((n) => n.id !== id)
      localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete node:', error)
      throw error
    }
  },
  
  // ===== 边操作 =====
  
  async loadEdges(): Promise<KnowledgeEdge[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EDGES)
      if (!data) return []
      
      const edges = JSON.parse(data) as KnowledgeEdge[]
      return edges.map((edge) => this.migrateEdge(edge))
    } catch (error) {
      console.error('Failed to load edges:', error)
      return []
    }
  },
  
  async saveEdge(edge: KnowledgeEdge): Promise<void> {
    try {
      const edges = await this.loadEdges()
      const index = edges.findIndex((e) => e.id === edge.id)
      
      if (index >= 0) {
        edges[index] = edge
      } else {
        edges.push(edge)
      }
      
      localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(edges))
    } catch (error) {
      console.error('Failed to save edge:', error)
      throw error
    }
  },
  
  async deleteEdge(id: string): Promise<void> {
    try {
      const edges = await this.loadEdges()
      const filtered = edges.filter((e) => e.id !== id)
      localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete edge:', error)
      throw error
    }
  },
  
  // ===== 批量操作 =====
  
  async saveNodes(nodes: KnowledgeNode[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes))
  },
  
  async saveEdges(edges: KnowledgeEdge[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(edges))
  },
  
  async saveAll(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(data.nodes))
    localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(data.edges))
    this.setVersion(CURRENT_VERSION)
  },
  
  // ===== 导入/导出 =====
  
  exportToJSON(): string {
    const nodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NODES) || '[]')
    const edges = JSON.parse(localStorage.getItem(STORAGE_KEYS.EDGES) || '[]')
    
    const exportData: ExportData = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
      sessions: [], // TODO: 导出会话数据
      exportSettings: {
        includeMetadata: true,
        includeStats: true,
        format: 'json',
      },
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalSessions: 0,
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  },
  
  importFromJSON(json: string): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    try {
      const data = JSON.parse(json) as ExportData
      
      // 验证数据格式
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid data format: nodes array missing')
      }
      
      // 数据迁移
      const migratedNodes = data.nodes.map((n) => this.migrateNode(n))
      const migratedEdges = (data.edges || []).map((e) => this.migrateEdge(e))
      
      // 保存到存储
      this.saveAll({ nodes: migratedNodes, edges: migratedEdges })
      
      return { nodes: migratedNodes, edges: migratedEdges }
    } catch (error) {
      console.error('Failed to import data:', error)
      throw error
    }
  },
  
  // ===== 数据迁移 =====
  
  migrateNode(node: any): KnowledgeNode {
    // 如果已经是新格式，直接返回
    if (node.metadata && typeof node.metadata === 'object') {
      return node as KnowledgeNode
    }
    
    // 旧格式迁移到新格式
    const migrated: KnowledgeNode = {
      id: node.id || `node-${Date.now()}-${Math.random()}`,
      label: node.label || 'Untitled',
      content: node.content || '',
      type: this.migrateNodeType(node.type),
      position: node.position || { x: 0, y: 0 },
      createdAt: node.createdAt || Date.now(),
      updatedAt: node.updatedAt || Date.now(),
      tags: node.tags || [],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: {
          level: 3,
          collapsed: false,
          childCount: 0,
        },
        // 保留旧数据的所有字段
        ...node.metadata,
      },
    }
    
    return migrated
  },
  
  migrateNodeType(type: string): KnowledgeNode['type'] {
    const typeMap: Record<string, KnowledgeNode['type']> = {
      'concept': 'block',
      'note': 'block',
      'code': 'block',
      'idea': 'ai-response',
      'tweet': 'block',
      'reference': 'block',
    }
    
    return typeMap[type] || (type as KnowledgeNode['type']) || 'block'
  },
  
  migrateEdge(edge: any): KnowledgeEdge {
    if (edge.metadata && typeof edge.metadata === 'object') {
      return edge as KnowledgeEdge
    }
    
    return {
      id: edge.id || `edge-${Date.now()}-${Math.random()}`,
      source: edge.source,
      target: edge.target,
      type: this.migrateEdgeType(edge.type),
      label: edge.label,
      strength: edge.strength || 0.5,
      createdAt: edge.createdAt || Date.now(),
      metadata: {},
    }
  },
  
  migrateEdgeType(type: string): KnowledgeEdge['type'] {
    const typeMap: Record<string, KnowledgeEdge['type']> = {
      'semantic': 'conversation',
      'temporal': 'conversation',
      'manual': 'conversation',
      'ai-suggested': 'ai-suggested',
      'reference': 'reference',
    }
    
    return typeMap[type] || (type as KnowledgeEdge['type']) || 'conversation'
  },
  
  // ===== 清理 =====
  
  async clearAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.NODES)
    localStorage.removeItem(STORAGE_KEYS.EDGES)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.VERSION)
  },
  
  // ===== 存储统计 =====
  
  getStorageStats(): { nodes: number; edges: number; size: string } {
    const nodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NODES) || '[]')
    const edges = JSON.parse(localStorage.getItem(STORAGE_KEYS.EDGES) || '[]')
    
    // 计算存储大小
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('holograph:')) {
        totalSize += localStorage.getItem(key)?.length || 0
      }
    }
    
    return {
      nodes: nodes.length,
      edges: edges.length,
      size: `${(totalSize / 1024).toFixed(2)} KB`,
    }
  },
}
