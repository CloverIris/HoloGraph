// Knowledge Node Types
export type NodeType = 'concept' | 'code' | 'note' | 'tweet' | 'idea' | 'reference'

export interface KnowledgeNode {
  id: string
  label: string
  content: string
  type: NodeType
  tags: string[]
  createdAt: number
  updatedAt: number
  position: {
    x: number
    y: number
    z?: number
  }
  metadata: Record<string, any>
}

// Knowledge Edge Types
export type EdgeType = 'semantic' | 'temporal' | 'manual' | 'ai-suggested' | 'reference'

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  label?: string
  strength: number
  type: EdgeType
  createdAt: number
}

// Concept Cluster Types
export interface ConceptCluster {
  id: string
  label: string
  nodeIds: string[]
  centroid: {
    x: number
    y: number
  }
  color: string
}

// Graph State Types
export interface GraphState {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  clusters: ConceptCluster[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  viewBox: {
    x: number
    y: number
    zoom: number
  }
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  searchQuery: string
  activeTab: 'all' | 'concepts' | 'code' | 'notes' | 'clusters'
  darkMode: boolean
  showLabels: boolean
  showClusters: boolean
  animationEnabled: boolean
}

// AI Analysis Types
export interface AIAnalysisResult {
  concepts: string[]
  keywords: string[]
  summary: string
  relatedConcepts: string[]
  suggestedConnections: Array<{
    targetId: string
    strength: number
    reason: string
  }>
}

// Search Types
export interface SearchResult {
  node: KnowledgeNode
  relevance: number
  matchedFields: string[]
}

// Path Finding Types
export interface PathResult {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  distance: number
}

// Export/Import Types
export interface ExportData {
  version: string
  exportedAt: string
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  clusters?: ConceptCluster[]
}

// Settings Types
export interface AppSettings {
  ai: {
    enabled: boolean
    provider: 'openai' | 'claude' | 'local'
    apiKey?: string
    model?: string
  }
  display: {
    nodeSize: number
    edgeWidth: number
    labelSize: number
    showAnimation: boolean
    theme: 'dark' | 'light' | 'system'
  }
  behavior: {
    autoSave: boolean
    autoSaveInterval: number
    confirmDelete: boolean
  }
}
