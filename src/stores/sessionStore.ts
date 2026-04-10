import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  ConversationSession, 
  SessionConfig, 
  SessionStats,
  KnowledgeNode,
  KnowledgeEdge,
  AIConfig 
} from '@mytypes'

// 默认会话配置
const defaultSessionConfig: SessionConfig = {
  ai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
  },
  autoSave: true,
  autoSummarize: true,
  summarizeThreshold: 10,
  action: {
    autoExtract: true,
    confirmBeforeExecute: true,
  }
}

// 默认统计
const defaultStats: SessionStats = {
  totalNodes: 0,
  totalTokens: 0,
  totalDuration: 0,
  aiCalls: 0,
  userBlocks: 0,
  aiResponses: 0,
  branches: 0,
  actions: 0,
}

// Session State
interface SessionState {
  // 会话列表
  sessions: ConversationSession[]
  activeSessionId: string | null
  
  // 操作方法
  createSession: (title?: string, config?: Partial<SessionConfig>) => ConversationSession
  updateSession: (id: string, updates: Partial<ConversationSession>) => void
  deleteSession: (id: string) => void
  archiveSession: (id: string) => void
  
  // 激活会话
  setActiveSession: (id: string | null) => void
  
  // 节点管理
  addNodeToSession: (sessionId: string, nodeId: string) => void
  removeNodeFromSession: (sessionId: string, nodeId: string) => void
  addEdgeToSession: (sessionId: string, edgeId: string) => void
  removeEdgeFromSession: (sessionId: string, edgeId: string) => void
  
  // 统计更新
  updateStats: (sessionId: string, statsUpdate: Partial<SessionStats>) => void
  
  // 查询
  getSessionById: (id: string) => ConversationSession | undefined
  getActiveSession: () => ConversationSession | undefined
  getRecentSessions: (limit?: number) => ConversationSession[]
  
  // 导出
  exportSession: (id: string) => {
    session: ConversationSession
    nodes: KnowledgeNode[]
    edges: KnowledgeEdge[]
  } | null
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      
      // 创建新会话
      createSession: (title, config) => {
        const now = Date.now()
        const newSession: ConversationSession = {
          id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
          title: title || `新会话 ${new Date().toLocaleString('zh-CN')}`,
          createdAt: now,
          updatedAt: now,
          rootNodeId: '',
          nodeIds: [],
          edgeIds: [],
          config: { ...defaultSessionConfig, ...config },
          stats: { ...defaultStats },
          tags: [],
          topics: [],
        }
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
        }))
        
        return newSession
      },
      
      // 更新会话
      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: Date.now() }
              : s
          ),
        }))
      },
      
      // 删除会话
      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: 
            state.activeSessionId === id 
              ? (state.sessions.find((s) => s.id !== id)?.id || null)
              : state.activeSessionId,
        }))
      },
      
      // 归档会话
      archiveSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, archivedAt: Date.now() } : s
          ),
        }))
      },
      
      // 设置活跃会话
      setActiveSession: (id) => {
        set({ activeSessionId: id })
      },
      
      // 添加节点到会话
      addNodeToSession: (sessionId, nodeId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId && !s.nodeIds.includes(nodeId)
              ? { 
                  ...s, 
                  nodeIds: [...s.nodeIds, nodeId],
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },
      
      // 从会话移除节点
      removeNodeFromSession: (sessionId, nodeId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { 
                  ...s, 
                  nodeIds: s.nodeIds.filter((id) => id !== nodeId),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },
      
      // 添加边到会话
      addEdgeToSession: (sessionId, edgeId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId && !s.edgeIds.includes(edgeId)
              ? { 
                  ...s, 
                  edgeIds: [...s.edgeIds, edgeId],
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },
      
      // 从会话移除边
      removeEdgeFromSession: (sessionId, edgeId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { 
                  ...s, 
                  edgeIds: s.edgeIds.filter((id) => id !== edgeId),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },
      
      // 更新统计
      updateStats: (sessionId, statsUpdate) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { 
                  ...s, 
                  stats: { ...s.stats, ...statsUpdate },
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },
      
      // 获取会话
      getSessionById: (id) => {
        return get().sessions.find((s) => s.id === id)
      },
      
      // 获取活跃会话
      getActiveSession: () => {
        const { activeSessionId, sessions } = get()
        if (!activeSessionId) return undefined
        return sessions.find((s) => s.id === activeSessionId)
      },
      
      // 获取最近会话
      getRecentSessions: (limit = 10) => {
        return get()
          .sessions
          .filter((s) => !s.archivedAt)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit)
      },
      
      // 导出会话（需要配合 graphStore 使用）
      exportSession: (id) => {
        const session = get().sessions.find((s) => s.id === id)
        if (!session) return null
        
        // 这里需要配合 graphStore 获取实际节点和边
        return {
          session,
          nodes: [], // 由调用方填充
          edges: [], // 由调用方填充
        }
      },
    }),
    { name: 'session-store' }
  )
)

// 初始化默认会话
export function initializeDefaultSession(): void {
  const { sessions, createSession } = useSessionStore.getState()
  if (sessions.length === 0) {
    createSession('默认会话', {
      ai: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
      }
    })
  }
}
