import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { KnowledgeNode, KnowledgeEdge, ConceptCluster, PathResult } from '@mytypes'
import { dbService } from '@services/db'
import { graphAlgorithms } from '@services/graph'

// Sample data - nodes positioned within visible range (0-1000, 0-700)
const sampleNodes: KnowledgeNode[] = [
  {
    id: '1',
    label: 'HoloGraph',
    content: 'A personal knowledge mapping tool that visualizes your thoughts as a constellation network.',
    type: 'concept',
    tags: ['knowledge', 'graph', 'visualization'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    position: { x: 500, y: 350 }, // Center of viewBox
    metadata: {},
  },
  {
    id: '2',
    label: 'Knowledge Node',
    content: 'The basic unit of information in HoloGraph.',
    type: 'concept',
    tags: ['core', 'data'],
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    position: { x: 650, y: 250 },
    metadata: {},
  },
  {
    id: '3',
    label: 'Connection',
    content: 'Links between nodes that represent relationships.',
    type: 'concept',
    tags: ['core', 'relationship'],
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
    position: { x: 700, y: 450 },
    metadata: {},
  },
  {
    id: '4',
    label: 'Getting Started',
    content: 'Click the + button to create your first node.',
    type: 'note',
    tags: ['tutorial', 'help'],
    createdAt: Date.now() - 30000,
    updatedAt: Date.now() - 30000,
    position: { x: 300, y: 450 },
    metadata: {},
  },
  {
    id: '5',
    label: 'Star Map',
    content: 'Visualize your knowledge as a constellation.',
    type: 'idea',
    tags: ['visualization', 'feature'],
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    position: { x: 350, y: 250 },
    metadata: {},
  },
]

const sampleEdges: KnowledgeEdge[] = [
  {
    id: 'e1',
    source: '1',
    target: '2',
    label: 'contains',
    strength: 0.8,
    type: 'semantic',
    createdAt: Date.now(),
  },
  {
    id: 'e2',
    source: '1',
    target: '3',
    label: 'has',
    strength: 0.7,
    type: 'semantic',
    createdAt: Date.now() - 5000,
  },
  {
    id: 'e3',
    source: '2',
    target: '3',
    label: 'forms',
    strength: 0.6,
    type: 'semantic',
    createdAt: Date.now() - 10000,
  },
  {
    id: 'e4',
    source: '1',
    target: '4',
    label: 'guides',
    strength: 0.5,
    type: 'reference',
    createdAt: Date.now() - 15000,
  },
  {
    id: 'e5',
    source: '1',
    target: '5',
    label: 'inspires',
    strength: 0.9,
    type: 'semantic',
    createdAt: Date.now() - 20000,
  },
]

interface GraphState {
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
  loadNodes: () => Promise<void>
  loadEdges: () => Promise<void>
  addNode: (node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KnowledgeNode>
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => Promise<void>
  deleteNode: (id: string) => Promise<void>
  addEdge: (edge: Omit<KnowledgeEdge, 'id' | 'createdAt'>) => Promise<KnowledgeEdge>
  updateEdge: (id: string, updates: Partial<KnowledgeEdge>) => Promise<void>
  deleteEdge: (id: string) => Promise<void>
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  setViewBox: (viewBox: Partial<GraphState['viewBox']>) => void
  resetView: () => void
  findPath: (fromId: string, toId: string) => PathResult | null
  getNodeNeighbors: (nodeId: string) => { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }
}

export const useGraphStore = create<GraphState>()(
  devtools(
    (set, get) => ({
      nodes: sampleNodes,
      edges: sampleEdges,
      clusters: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      // FIXED: Start at 0,0 with zoom 1 for fixed viewBox
      viewBox: {
        x: 0,
        y: 0,
        zoom: 1,
      },

      loadNodes: async () => {
        try {
          const nodes = await dbService.getAllNodes()
          if (nodes.length > 0) {
            set({ nodes })
          }
        } catch (error) {
          console.error('Failed to load nodes:', error)
        }
      },

      loadEdges: async () => {
        try {
          const edges = await dbService.getAllEdges()
          if (edges.length > 0) {
            set({ edges })
          }
        } catch (error) {
          console.error('Failed to load edges:', error)
        }
      },

      addNode: async (nodeData) => {
        const newNode = await dbService.createNode(nodeData)
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }))
        return newNode
      },

      updateNode: async (id, updates) => {
        await dbService.updateNode(id, updates)
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        }))
      },

      deleteNode: async (id) => {
        await dbService.deleteNode(id)
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }))
      },

      addEdge: async (edgeData) => {
        const newEdge = await dbService.createEdge(edgeData)
        set((state) => ({
          edges: [...state.edges, newEdge],
        }))
        return newEdge
      },

      updateEdge: async (id, updates) => {
        await dbService.updateEdge(id, updates)
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      deleteEdge: async (id) => {
        await dbService.deleteEdge(id)
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }))
      },

      selectNode: (id) => {
        set({ selectedNodeId: id, selectedEdgeId: null })
      },

      selectEdge: (id) => {
        set({ selectedEdgeId: id, selectedNodeId: null })
      },

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

      findPath: (fromId, toId) => {
        const { nodes, edges } = get()
        return graphAlgorithms.findShortestPath(nodes, edges, fromId, toId)
      },

      getNodeNeighbors: (nodeId) => {
        const { nodes, edges } = get()
        return graphAlgorithms.getNeighbors(nodes, edges, nodeId)
      },
    }),
    { name: 'graph-store' }
  )
)
