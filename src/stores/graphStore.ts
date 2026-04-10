import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  KnowledgeNode, 
  KnowledgeEdge, 
  NodeType, 
  EdgeType,
  NodeStatus,
  NodeMetadata,
  Position,
  PathResult,
  AIConfig,
  LODInfo,
} from '@mytypes'
import { storageService } from '@services/storage'
import { graphAlgorithms } from '@services/graph'
import { useSessionStore } from './sessionStore'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// 默认数据
// ============================================

const defaultNodeMetadata: NodeMetadata = {
  status: 'idle',
  childrenIds: [],
  lod: {
    level: 3,
    collapsed: false,
    childCount: 0,
  }
}

// ============================================
// Graph State 接口
// ============================================

interface GraphState {
  // 核心数据
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  
  // 选中状态
  selectedNodeId: string | null
  selectedEdgeId: string | null
  
  // 视图状态
  viewBox: {
    x: number
    y: number
    zoom: number
  }
  lodLevel: 0 | 1 | 2 | 3
  
  // 流式状态
  streamingNodeId: string | null
  
  // ===== 节点操作 =====
  
  // 加载数据
  loadNodes: () => Promise<void>
  loadEdges: () => Promise<void>
  
  // 创建节点（支持对话系统）
  createNode: (data: {
    label: string
    content: string
    type: NodeType
    position: Position
    parentId?: string
    sessionId?: string
    aiConfig?: AIConfig
    metadata?: Partial<NodeMetadata>
    tags?: string[]
  }) => Promise<KnowledgeNode>
  
  // 创建 AI 响应节点
  createAIResponseNode: (data: {
    parentId: string
    sessionId: string
    aiConfig?: AIConfig
    position?: Position
  }) => Promise<KnowledgeNode>
  
  // 创建分支节点
  createBranchNode: (data: {
    parentId: string
    sessionId: string
    branchReason?: string
    position?: Position
  }) => Promise<KnowledgeNode>
  
  // 更新节点
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => Promise<void>
  updateNodeContent: (id: string, content: string) => Promise<void>
  updateNodeStatus: (id: string, status: NodeStatus) => void
  updateNodePosition: (id: string, position: Position) => void
  updateNodeLOD: (id: string, lod: Partial<LODInfo>) => void
  
  // 删除节点
  deleteNode: (id: string) => Promise<void>
  
  // 节点关系
  addChildNode: (parentId: string, childId: string) => void
  removeChildNode: (parentId: string, childId: string) => void
  
  // ===== 边操作 =====
  
  // 创建边
  createEdge: (data: {
    source: string
    target: string
    type: EdgeType
    label?: string
    strength?: number
    metadata?: {
      flow?: {
        order: number
        isMainThread: boolean
        branchReason?: string
      }
    }
  }) => Promise<KnowledgeEdge>
  
  // 创建对话边
  createConversationEdge: (data: {
    source: string
    target: string
    order: number
    isMainThread?: boolean
    branchReason?: string
  }) => Promise<KnowledgeEdge>
  
  updateEdge: (id: string, updates: Partial<KnowledgeEdge>) => Promise<void>
  deleteEdge: (id: string) => Promise<void>
  
  // ===== 选择操作 =====
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  
  // ===== 视图操作 =====
  setViewBox: (viewBox: Partial<GraphState['viewBox']>) => void
  resetView: () => void
  setLODLevel: (level: 0 | 1 | 2 | 3) => void
  
  // ===== 查询操作 =====
  getNodeById: (id: string) => KnowledgeNode | undefined
  getEdgeById: (id: string) => KnowledgeEdge | undefined
  getNodeChildren: (nodeId: string) => KnowledgeNode[]
  getNodeParent: (nodeId: string) => KnowledgeNode | undefined
  getNodeSiblings: (nodeId: string) => KnowledgeNode[]
  getConversationThread: (nodeId: string) => KnowledgeNode[]
  getNodeNeighbors: (nodeId: string) => { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }
  findPath: (fromId: string, toId: string) => PathResult | null
  
  // ===== 批量操作 =====
  getNodesBySession: (sessionId: string) => KnowledgeNode[]
  getNodesByType: (type: NodeType) => KnowledgeNode[]
  deleteNodesBySession: (sessionId: string) => Promise<void>
  
  // ===== 流式状态 =====
  setStreamingNode: (nodeId: string | null) => void
  
  // ===== 导入/导出 =====
  exportData: () => { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }
  importData: (data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }) => Promise<void>
  clearGraph: () => Promise<void>
  
  // ===== 设置整个图 =====
  setGraph: (data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }) => void
}

// ============================================
// Store 实现
// ============================================

export const useGraphStore = create<GraphState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      viewBox: {
        x: 0,
        y: 0,
        zoom: 1,
      },
      lodLevel: 3,
      streamingNodeId: null,
      
      // ===== 数据加载 =====
      
      loadNodes: async () => {
        try {
          const nodes = await storageService.loadNodes()
          if (nodes.length > 0) {
            set({ nodes })
          }
        } catch (error) {
          console.error('Failed to load nodes:', error)
        }
      },
      
      loadEdges: async () => {
        try {
          const edges = await storageService.loadEdges()
          if (edges.length > 0) {
            set({ edges })
          }
        } catch (error) {
          console.error('Failed to load edges:', error)
        }
      },
      
      // ===== 节点创建 =====
      
      createNode: async (data) => {
        const now = Date.now()
        const sessionStore = useSessionStore.getState()
        const activeSession = sessionStore.getActiveSession()
        
        const newNode: KnowledgeNode = {
          id: uuidv4(),
          label: data.label,
          content: data.content,
          type: data.type,
          position: data.position,
          createdAt: now,
          updatedAt: now,
          tags: data.tags || [],
          metadata: {
            ...defaultNodeMetadata,
            sessionId: data.sessionId || activeSession?.id,
            parentId: data.parentId,
            childrenIds: [],
            aiConfig: data.aiConfig,
            ...data.metadata,
          },
        }
        
        // 保存到存储
        await storageService.saveNode(newNode)
        
        // 更新状态
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }))
        
        // 如果有父节点，建立父子关系
        if (data.parentId) {
          get().addChildNode(data.parentId, newNode.id)
        }
        
        // 添加到会话
        const sessionId = data.sessionId || activeSession?.id
        if (sessionId) {
          sessionStore.addNodeToSession(sessionId, newNode.id)
        }
        
        return newNode
      },
      
      createAIResponseNode: async (data) => {
        const parent = get().getNodeById(data.parentId)
        if (!parent) throw new Error('Parent node not found')
        
        // 计算位置（在父节点右下方）
        const position = data.position || {
          x: parent.position.x + 200,
          y: parent.position.y + 100,
        }
        
        const node = await get().createNode({
          label: 'AI 思考中...',
          content: '',
          type: 'ai-response',
          position,
          parentId: data.parentId,
          sessionId: data.sessionId,
          aiConfig: data.aiConfig,
          metadata: {
            status: 'streaming',
            timeline: {
              startTime: Date.now(),
            }
          }
        })
        
        // 创建对话边
        const siblings = get().getNodeChildren(data.parentId)
        await get().createConversationEdge({
          source: data.parentId,
          target: node.id,
          order: siblings.length,
          isMainThread: true,
        })
        
        return node
      },
      
      createBranchNode: async (data) => {
        const parent = get().getNodeById(data.parentId)
        if (!parent) throw new Error('Parent node not found')
        
        // 计算位置（在父节点右侧，偏移一定角度）
        const angle = Math.random() * Math.PI / 3 - Math.PI / 6 // -30 到 30 度
        const distance = 250
        const position = data.position || {
          x: parent.position.x + Math.cos(angle) * distance,
          y: parent.position.y + Math.sin(angle) * distance,
        }
        
        const node = await get().createNode({
          label: '分支讨论',
          content: '',
          type: 'branch',
          position,
          parentId: data.parentId,
          sessionId: data.sessionId,
          metadata: {
            status: 'idle',
          },
          tags: ['branch']
        })
        
        // 创建分支边
        await get().createEdge({
          source: data.parentId,
          target: node.id,
          type: 'branch',
          label: data.branchReason || '分支',
          metadata: {
            flow: {
              order: 0,
              isMainThread: false,
              branchReason: data.branchReason,
            }
          }
        })
        
        return node
      },
      
      // ===== 节点更新 =====
      
      updateNode: async (id, updates) => {
        const node = get().getNodeById(id)
        if (!node) return
        
        const updatedNode = {
          ...node,
          ...updates,
          updatedAt: Date.now(),
        }
        
        await storageService.saveNode(updatedNode)
        
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? updatedNode : n
          ),
        }))
      },
      
      updateNodeContent: async (id, content) => {
        await get().updateNode(id, { content })
      },
      
      updateNodeStatus: (id, status) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  metadata: { ...n.metadata, status },
                  updatedAt: Date.now(),
                }
              : n
          ),
        }))
      },
      
      updateNodePosition: (id, position) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, position } : n
          ),
        }))
      },
      
      updateNodeLOD: (id, lod) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== id) return n
            const currentLOD = n.metadata?.lod || { level: 3, collapsed: false, childCount: 0 }
            return {
              ...n,
              metadata: {
                ...n.metadata,
                lod: { ...currentLOD, ...lod },
              },
            }
          }) as KnowledgeNode[],
        }))
      },
      
      // ===== 节点删除 =====
      
      deleteNode: async (id) => {
        const node = get().getNodeById(id)
        if (!node) return
        
        // 删除子节点（递归）
        const children = get().getNodeChildren(id)
        for (const child of children) {
          await get().deleteNode(child.id)
        }
        
        // 删除关联的边
        const relatedEdges = get().edges.filter(
          (e) => e.source === id || e.target === id
        )
        for (const edge of relatedEdges) {
          await get().deleteEdge(edge.id)
        }
        
        // 从父节点的 children 中移除
        if (node.metadata?.parentId) {
          get().removeChildNode(node.metadata.parentId, id)
        }
        
        // 从存储删除
        await storageService.deleteNode(id)
        
        // 更新状态
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }))
      },
      
      // ===== 节点关系 =====
      
      addChildNode: (parentId, childId) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === parentId
              ? {
                  ...n,
                  metadata: {
                    ...n.metadata,
                    childrenIds: [...(n.metadata?.childrenIds || []), childId],
                  },
                }
              : n
          ),
        }))
      },
      
      removeChildNode: (parentId, childId) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === parentId
              ? {
                  ...n,
                  metadata: {
                    ...n.metadata,
                    childrenIds: (n.metadata?.childrenIds || []).filter(
                      (id) => id !== childId
                    ),
                  },
                }
              : n
          ),
        }))
      },
      
      // ===== 边操作 =====
      
      createEdge: async (data) => {
        const newEdge: KnowledgeEdge = {
          id: uuidv4(),
          source: data.source,
          target: data.target,
          type: data.type,
          label: data.label,
          strength: data.strength ?? 0.5,
          createdAt: Date.now(),
          metadata: data.metadata,
        }
        
        await storageService.saveEdge(newEdge)
        
        set((state) => ({
          edges: [...state.edges, newEdge],
        }))
        
        // 添加到会话
        const sourceNode = get().getNodeById(data.source)
        if (sourceNode?.metadata?.sessionId) {
          useSessionStore.getState().addEdgeToSession(
            sourceNode.metadata.sessionId,
            newEdge.id
          )
        }
        
        return newEdge
      },
      
      createConversationEdge: async (data) => {
        return get().createEdge({
          source: data.source,
          target: data.target,
          type: 'conversation',
          metadata: {
            flow: {
              order: data.order,
              isMainThread: data.isMainThread ?? true,
              branchReason: data.branchReason,
            }
          }
        })
      },
      
      updateEdge: async (id, updates) => {
        const edge = get().getEdgeById(id)
        if (!edge) return
        
        const updatedEdge = { ...edge, ...updates }
        await storageService.saveEdge(updatedEdge)
        
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === id ? updatedEdge : e
          ),
        }))
      },
      
      deleteEdge: async (id) => {
        await storageService.deleteEdge(id)
        
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }))
      },
      
      // ===== 选择操作 =====
      
      selectNode: (id) => {
        set({ selectedNodeId: id, selectedEdgeId: null })
      },
      
      selectEdge: (id) => {
        set({ selectedEdgeId: id, selectedNodeId: null })
      },
      
      // ===== 视图操作 =====
      
      setViewBox: (viewBox) => {
        set((state) => ({
          viewBox: { ...state.viewBox, ...viewBox },
        }))
      },
      
      resetView: () => {
        set({
          viewBox: { x: 0, y: 0, zoom: 1 },
        })
      },
      
      setLODLevel: (level) => {
        set({ lodLevel: level })
      },
      
      // ===== 查询操作 =====
      
      getNodeById: (id) => {
        return get().nodes.find((n) => n.id === id)
      },
      
      getEdgeById: (id) => {
        return get().edges.find((e) => e.id === id)
      },
      
      getNodeChildren: (nodeId) => {
        const node = get().getNodeById(nodeId)
        if (!node?.metadata?.childrenIds) return []
        return node.metadata.childrenIds
          .map((id) => get().getNodeById(id))
          .filter(Boolean) as KnowledgeNode[]
      },
      
      getNodeParent: (nodeId) => {
        const node = get().getNodeById(nodeId)
        if (!node?.metadata?.parentId) return undefined
        return get().getNodeById(node.metadata.parentId)
      },
      
      getNodeSiblings: (nodeId) => {
        const parent = get().getNodeParent(nodeId)
        if (!parent) return []
        return (parent.metadata?.childrenIds || [])
          .filter((id) => id !== nodeId)
          .map((id) => get().getNodeById(id))
          .filter(Boolean) as KnowledgeNode[]
      },
      
      getConversationThread: (nodeId) => {
        const result: KnowledgeNode[] = []
        let current = get().getNodeById(nodeId)
        
        // 向上追溯
        while (current) {
          result.unshift(current)
          current = get().getNodeParent(current.id)
        }
        
        return result
      },
      
      getNodeNeighbors: (nodeId) => {
        const { nodes, edges } = get()
        return graphAlgorithms.getNeighbors(nodes, edges, nodeId)
      },
      
      findPath: (fromId, toId) => {
        const { nodes, edges } = get()
        return graphAlgorithms.findShortestPath(nodes, edges, fromId, toId)
      },
      
      // ===== 批量操作 =====
      
      getNodesBySession: (sessionId) => {
        return get().nodes.filter(
          (n) => n.metadata?.sessionId === sessionId
        )
      },
      
      getNodesByType: (type) => {
        return get().nodes.filter((n) => n.type === type)
      },
      
      deleteNodesBySession: async (sessionId) => {
        const nodesToDelete = get().getNodesBySession(sessionId)
        for (const node of nodesToDelete) {
          await get().deleteNode(node.id)
        }
      },
      
      // ===== 流式状态 =====
      
      setStreamingNode: (nodeId) => {
        set({ streamingNodeId: nodeId })
      },
      
      // ===== 导入/导出 =====
      
      exportData: () => {
        return {
          nodes: get().nodes,
          edges: get().edges,
        }
      },
      
      importData: async (data) => {
        for (const node of data.nodes) {
          await storageService.saveNode(node)
        }
        for (const edge of data.edges) {
          await storageService.saveEdge(edge)
        }
        
        set({
          nodes: data.nodes,
          edges: data.edges,
        })
      },
      
      clearGraph: async () => {
        await storageService.clearAll()
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        })
      },
      
      setGraph: (data) => {
        set({
          nodes: data.nodes,
          edges: data.edges,
          selectedNodeId: null,
          selectedEdgeId: null,
        })
        // 保存到存储
        storageService.saveNodes(data.nodes)
        storageService.saveEdges(data.edges)
      },
    }),
    { name: 'graph-store' }
  )
)
