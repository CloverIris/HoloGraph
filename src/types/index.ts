// ============================================
// HoloGraph Conversation Graph Types
// 网状对话系统 - 数据模型定义
// ============================================

// ============================================
// 基础节点类型
// ============================================

export type NodeType = 
  | 'block'        // 用户输入块
  | 'ai-response'  // AI回应
  | 'branch'       // 发散分支点
  | 'summary'      // 自动总结
  | 'todo'         // 待办任务
  | 'action'       // 可执行动作
  | 'knowledge'    // 知识晶体（LOD聚合）
  | 'session'      // 对话会话容器
  // 兼容旧类型
  | 'concept' 
  | 'code' 
  | 'note' 
  | 'tweet' 
  | 'idea' 
  | 'reference'

// 节点状态
export type NodeStatus = 
  | 'idle'
  | 'streaming'    // AI正在生成
  | 'thinking'     // AI思考中
  | 'completed'
  | 'failed'
  | 'queued'       // 等待执行
  | 'executing'    // 动作执行中

// AI 提供商
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'local' | 'custom'

// ============================================
// 位置与几何
// ============================================

export interface Position {
  x: number
  y: number
  z?: number
}

export interface ViewBox {
  x: number
  y: number
  zoom: number
}

// ============================================
// 核心节点定义
// ============================================

export interface KnowledgeNode {
  id: string
  label: string
  type: NodeType
  
  // 内容
  content: string
  contentType?: 'text' | 'markdown' | 'code' | 'json'
  
  // 位置
  position: Position
  
  // 时间戳
  createdAt: number
  updatedAt: number
  
  // 标签
  tags: string[]
  
  // 扩展元数据（用于新功能）
  metadata: NodeMetadata
  
  // 样式
  style?: NodeStyle
}

// 节点元数据 - 扩展新功能
export interface NodeMetadata {
  // ===== 对话系统相关 =====
  // 会话ID
  sessionId?: string
  
  // 对话树结构
  parentId?: string
  childrenIds?: string[]
  
  // 节点状态
  status?: NodeStatus
  
  // 时序数据
  timeline?: {
    startTime: number
    endTime?: number
    duration?: number
  }
  
  // ===== AI 相关 =====
  aiConfig?: AIConfig
  
  // AI 生成内容详情
  aiResponse?: {
    provider: AIProvider
    model: string
    tokens?: {
      input: number
      output: number
      total: number
    }
    processingTime?: number
    cost?: number
    finishReason?: string
  }
  
  // ===== LOD 相关 =====
  lod?: LODInfo
  
  // ===== Action 相关 =====
  action?: ActionMetadata
  
  // ===== 分析结果 =====
  analysis?: NodeAnalysis
  
  // ===== 兼容旧数据 =====
  [key: string]: any
}

// AI 配置
export interface AIConfig {
  provider: AIProvider
  model: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  contextWindow?: number
  stream?: boolean
  tools?: string[]
}

// LOD 信息
export interface LODInfo {
  level: 0 | 1 | 2 | 3      // 详细程度级别
  collapsed: boolean        // 是否折叠
  childCount: number        // 子节点数量
  summary?: string          // 聚合摘要
  aggregatedFrom?: string[] // 聚合来源节点IDs
  aggregationType?: 'temporal' | 'topic' | 'session' | 'branch'
}

// Action 元数据
export interface ActionMetadata {
  type: ActionType
  config: ActionConfig
  execution?: ExecutionConfig
  lastExecution?: ExecutionResult
}

// 节点分析结果
export interface NodeAnalysis {
  summary?: string
  keyPoints?: string[]
  topics?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  actionItems?: ActionItem[]
  entities?: Entity[]
}

// 实体提取
export interface Entity {
  name: string
  type: string
  confidence: number
}

// Action Item
export interface ActionItem {
  text: string
  priority: 'high' | 'medium' | 'low'
  assignee?: string
  dueDate?: number
}

// 节点样式
export interface NodeStyle {
  color?: string
  borderColor?: string
  glowColor?: string
  size?: number
  opacity?: number
  shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon'
}

// ============================================
// Action 系统
// ============================================

export type ActionType = 
  | 'code'           // 生成并执行代码
  | 'email'          // 发送邮件
  | 'webhook'        // 调用 webhook
  | 'cli'            // 执行 CLI 命令
  | 'mcp'            // MCP (Model Context Protocol) 调用
  | 'file'           // 文件操作
  | 'notify'         // 系统通知
  | 'workflow'       // 工作流触发

export interface ActionConfig {
  // 代码执行
  code?: {
    language: 'python' | 'javascript' | 'typescript' | 'bash' | 'powershell'
    script: string
    timeout?: number
    sandbox?: 'strict' | 'relaxed' | 'none'
    dependencies?: string[]
  }
  
  // 邮件
  email?: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    isHtml?: boolean
    attachments?: string[]
  }
  
  // Webhook
  webhook?: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    timeout?: number
  }
  
  // CLI
  cli?: {
    command: string
    args?: string[]
    cwd?: string
    env?: Record<string, string>
    timeout?: number
  }
  
  // MCP
  mcp?: {
    server: string
    tool: string
    arguments: Record<string, any>
  }
  
  // 文件操作
  file?: {
    operation: 'read' | 'write' | 'delete' | 'copy' | 'move'
    path: string
    content?: string
    encoding?: string
  }
  
  // 通知
  notify?: {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
  }
  
  // 工作流
  workflow?: {
    workflowId: string
    parameters: Record<string, any>
  }
}

export interface ExecutionConfig {
  trigger: 'manual' | 'auto' | 'scheduled'
  schedule?: string        // cron expression
  retryCount: number
  timeout: number
  dependsOn: string[]      // 依赖的其他action节点ID
  condition?: string       // 执行条件表达式
}

export interface ExecutionResult {
  time: number
  status: 'success' | 'failed' | 'cancelled'
  duration?: number
  output?: string
  error?: string
  exitCode?: number
}

// ============================================
// 边定义
// ============================================

export type EdgeType = 
  | 'conversation'   // 对话流
  | 'branch'         // 分支关系
  | 'reference'      // 引用关联
  | 'summary-of'     // 总结聚合
  | 'triggers'       // 触发动作
  | 'depends-on'     // 依赖关系
  | 'ai-suggested'   // AI建议
  // 兼容旧类型
  | 'semantic' 
  | 'temporal' 
  | 'manual'

export interface KnowledgeEdge {
  id: string
  source: string        // 源节点ID
  target: string        // 目标节点ID
  label?: string
  type: EdgeType
  strength: number      // 0-1 连接强度
  
  // 时间戳
  createdAt: number
  
  // 扩展元数据
  metadata?: EdgeMetadata
}

export interface EdgeMetadata {
  // 对话流属性
  flow?: {
    order: number
    isMainThread: boolean
    branchReason?: string
    branchPoint?: string
  }
  
  // AI分析
  aiAnalysis?: {
    relevance: number
    sentiment: 'positive' | 'neutral' | 'negative'
    topicShift?: string
    suggestedBy?: string
  }
  
  // 动画
  animation?: {
    type: 'flow' | 'pulse' | 'none'
    speed?: number
    color?: string
  }
}

// ============================================
// 会话模型
// ============================================

export interface ConversationSession {
  id: string
  title: string
  description?: string
  
  // 时间范围
  createdAt: number
  updatedAt: number
  archivedAt?: number
  
  // 结构
  rootNodeId: string
  nodeIds: string[]
  edgeIds: string[]
  
  // 配置
  config?: SessionConfig
  
  // 统计
  stats: SessionStats
  
  // 标签和分类
  tags: string[]
  topics: string[]
  
  // 导出设置
  export?: ExportSettings
}

export interface SessionConfig {
  ai?: AIConfig
  autoSave: boolean
  autoSummarize: boolean
  summarizeThreshold: number  // 达到多少节点自动总结
  action?: {
    autoExtract: boolean
    confirmBeforeExecute: boolean
  }
}

export interface SessionStats {
  totalNodes: number
  totalTokens: number
  totalDuration: number
  aiCalls: number
  userBlocks: number
  aiResponses: number
  branches: number
  actions: number
}

export interface ExportSettings {
  format: 'markdown' | 'pdf' | 'html' | 'json' | 'obsidian'
  includeMetadata: boolean
  includeStats: boolean
  lastExported?: number
}

// ============================================
// 图谱状态
// ============================================

export interface GraphState {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  sessions: ConversationSession[]
  
  // 选中状态
  selectedNodeId: string | null
  selectedEdgeId: string | null
  selectedSessionId: string | null
  
  // 视图
  viewBox: ViewBox
  lodLevel: 0 | 1 | 2 | 3
  
  // 当前活跃会话
  activeSessionId: string | null
}

// ============================================
// UI 状态
// ============================================

export interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  searchQuery: string
  activeTab: 'all' | 'sessions' | 'actions' | 'knowledge'
  darkMode: boolean
  showLabels: boolean
  showClusters: boolean
  animationEnabled: boolean
  
  // 新增
  viewMode: 'graph' | 'timeline' | 'list'
  sidebarTab: 'files' | 'sessions' | 'actions' | 'settings'
  showLODIndicator: boolean
  streamAnimations: boolean
}

// ============================================
// AI 相关类型
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AIResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  finishReason?: string
  toolCalls?: ToolCall[]
}

export interface StreamCallbacks {
  onStart: () => void
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (error: Error) => void
  onToolCall?: (toolCall: ToolCall) => void
}

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

// ============================================
// LOD 系统
// ============================================

export interface LODConfig {
  levels: {
    0: LODLevel  // 宇宙视图
    1: LODLevel  // 星系视图
    2: LODLevel  // 星团视图
    3: LODLevel  // 单星视图
  }
  thresholds: {
    zoomOut: number
    zoomIn: number
    nodeCount: number
  }
}

export interface LODLevel {
  maxNodes: number | 'unlimited'
  aggregation: 'temporal' | 'topic' | 'session' | 'branch' | 'none'
  showLabels: boolean
  showContent: boolean
  nodeSize: number
  detailLevel: 'minimal' | 'compact' | 'normal' | 'full'
}

export interface AggregatedNode extends KnowledgeNode {
  type: 'knowledge'
  metadata: NodeMetadata & {
    lod: LODInfo & {
      aggregatedFrom: string[]
      aggregationType: 'temporal' | 'topic' | 'session' | 'branch'
      summary: {
        keyPoints: string[]
        topics: string[]
        sentiment: 'positive' | 'neutral' | 'negative'
        actionItems: ActionItem[]
      }
    }
  }
}

// ============================================
// 搜索与路径
// ============================================

export interface SearchResult {
  node: KnowledgeNode
  relevance: number
  matchedFields: string[]
  highlightRanges?: Array<{ start: number; end: number }>
}

export interface SearchOptions {
  fields?: ('label' | 'content' | 'tags')[]
  caseSensitive?: boolean
  fuzzy?: boolean
  limit?: number
  sessionId?: string
  type?: NodeType[]
}

export interface PathResult {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  distance: number
  path: string[]  // 节点ID序列
}

// ============================================
// 导出/导入
// ============================================

export interface ExportData {
  version: string
  exportedAt: string
  
  // 数据
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  sessions: ConversationSession[]
  
  // 元数据
  exportSettings: {
    includeMetadata: boolean
    includeStats: boolean
    format: string
  }
  
  // 统计
  stats: {
    totalNodes: number
    totalEdges: number
    totalSessions: number
  }
}

// ============================================
// 设置
// ============================================

export interface AppSettings {
  // AI 设置
  ai: {
    defaultProvider: AIProvider
    defaultModel: string
    apiKeys: Record<AIProvider, string>
    temperature: number
    maxTokens: number
    streamEnabled: boolean
    contextWindow: number
  }
  
  // 显示设置
  display: {
    theme: 'dark' | 'light' | 'system'
    nodeSize: number
    edgeWidth: number
    labelSize: number
    showAnimation: boolean
    showGrid: boolean
    lodAutoSwitch: boolean
  }
  
  // 行为设置
  behavior: {
    autoSave: boolean
    autoSaveInterval: number
    confirmDelete: boolean
    autoSummarize: boolean
    summarizeThreshold: number
    actionConfirm: boolean
    oobeCompleted?: boolean
  }
  
  // 快捷键
  keyboard: {
    newNode: string
    newBlock: string
    search: string
    save: string
    delete: string
    zoomIn: string
    zoomOut: string
    resetView: string
    toggleSidebar: string
    togglePanel: string
  }
}

// ============================================
// 工作流
// ============================================

export interface Workflow {
  id: string
  name: string
  description?: string
  
  // 触发条件
  trigger: {
    type: 'manual' | 'scheduled' | 'event'
    schedule?: string
    event?: string
  }
  
  // 节点序列
  steps: WorkflowStep[]
  
  // 配置
  config: {
    parallel: boolean
    continueOnError: boolean
    timeout: number
  }
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'condition' | 'delay' | 'parallel' | 'loop'
  
  // 执行配置
  config: ActionConfig | ConditionConfig | DelayConfig
  
  // 连接
  next?: string[]           // 下一步（支持分支）
  onError?: string          // 错误处理
  
  // 条件
  condition?: string        // 执行条件
}

export interface ConditionConfig {
  expression: string
  trueBranch: string
  falseBranch: string
}

export interface DelayConfig {
  duration: number
  unit: 'ms' | 's' | 'm' | 'h' | 'd'
}

// ============================================
// 时间轴视图
// ============================================

export interface TimelineViewOptions {
  granularity: 'year' | 'month' | 'day' | 'hour' | 'minute'
  groupBy: 'session' | 'type' | 'topic' | 'none'
  showHeatmap: boolean
  colorBy: 'type' | 'sentiment' | 'session'
}

export interface TimelineEvent {
  id: string
  nodeId: string
  timestamp: number
  type: 'create' | 'update' | 'ai-response' | 'action' | 'branch'
  data: any
}

// ============================================
// 聚类分析
// ============================================

export interface ClusterResult {
  clusters: Array<{
    id: string
    label: string
    nodeIds: string[]
    centroid: Position
    color: string
    topic?: string
    keywords: string[]
  }>
  unclustered: string[]
}

export interface ClusterOptions {
  algorithm: 'kmeans' | 'hierarchical' | 'dbscan' | 'spectral'
  k?: number                    // 聚类数量
  dimensions?: number           // 降维维度
  distanceMetric?: 'euclidean' | 'cosine' | 'manhattan'
}
