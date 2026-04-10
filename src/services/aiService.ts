import type { 
  AIProvider, 
  AIConfig, 
  ChatMessage, 
  AIResponse, 
  StreamCallbacks,
  KnowledgeNode,
  ActionItem,
  AIAnalysisResult 
} from '@mytypes'
import { useGraphStore } from '@stores/graphStore'

// ============================================
// AI Provider 配置
// ============================================

// Provider configuration type
// interface ProviderConfig {
//   apiKey: string
//   baseURL?: string
// }

// ============================================
// AI Service
// ============================================

class AIService {
  private apiKeys: Map<AIProvider, string> = new Map()
  private defaultConfig: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
  }

  // 设置 API Key
  setApiKey(provider: AIProvider, apiKey: string): void {
    this.apiKeys.set(provider, apiKey)
  }

  // 获取 API Key
  getApiKey(provider: AIProvider): string | undefined {
    return this.apiKeys.get(provider)
  }

  // ============================================
  // 核心对话功能
  // ============================================

  /**
   * 流式对话 - 实时获取 AI 响应
   */
  async streamChat(
    messages: ChatMessage[],
    config: Partial<AIConfig> = {},
    callbacks: StreamCallbacks
  ): Promise<void> {
    const mergedConfig = { ...this.defaultConfig, ...config } as AIConfig
    
    try {
      callbacks.onStart()
      
      // Mark messages as used (for TypeScript)
      void messages
      
      // TODO: 实现实际的 AI 流式调用
      // 目前使用模拟数据
      const mockResponse = "This is a mock AI response. In production, this will be replaced with actual API calls to " + mergedConfig.provider + "."
      
      // 模拟流式输出
      const words = mockResponse.split(' ')
      let fullText = ''
      
      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        fullText += word + ' '
        callbacks.onToken(word + ' ')
      }
      
      callbacks.onComplete(fullText.trim())
    } catch (error) {
      console.error('AI stream error:', error)
      callbacks.onError(error as Error)
    }
  }

  /**
   * 非流式对话 - 一次性获取完整响应
   */
  async chat(
    messages: ChatMessage[],
    config: Partial<AIConfig> = {}
  ): Promise<AIResponse> {
    const mergedConfig = { ...this.defaultConfig, ...config } as AIConfig
    
    try {
      // Mark messages as used
      void messages
      
      // TODO: 实现实际的 AI 调用
      return {
        content: "This is a mock response from " + mergedConfig.provider + " using model " + mergedConfig.model,
      }
    } catch (error) {
      console.error('AI chat error:', error)
      throw error
    }
  }

  // ============================================
  // 上下文管理
  // ============================================

  /**
   * 构建对话上下文
   */
  buildContext(
    currentNode: KnowledgeNode,
    maxTokens: number = 4000
  ): ChatMessage[] {
    const messages: ChatMessage[] = []
    const graphStore = useGraphStore.getState()
    
    // 添加系统提示
    const systemPrompt = currentNode.metadata?.aiConfig?.systemPrompt || 
      `You are an AI assistant in HoloGraph, a networked conversation system.
Your responses should be concise yet insightful.
You can help users explore ideas, answer questions, and suggest connections.
When appropriate, suggest action items or next steps.`
    
    messages.push({
      role: 'system',
      content: systemPrompt,
    })

    // 获取对话历史
    const thread = graphStore.getConversationThread(currentNode.id)
    
    // 添加历史消息（智能截断）
    let estimatedTokens = systemPrompt.length / 4 // 粗略估计
    
    for (let i = thread.length - 1; i >= 0; i--) {
      const node = thread[i]
      const content = node.content
      const estimatedContentTokens = content.length / 4
      
      if (estimatedTokens + estimatedContentTokens > maxTokens * 0.8) {
        break
      }
      
      messages.push({
        role: node.type === 'ai-response' ? 'assistant' : 'user',
        content: content,
      })
      
      estimatedTokens += estimatedContentTokens
    }

    // 添加当前节点内容
    if (currentNode.content) {
      messages.push({
        role: 'user',
        content: currentNode.content,
      })
    }

    return messages
  }

  /**
   * 智能截断 - 保留最相关的历史
   */
  smartTruncate(
    nodes: KnowledgeNode[],
    _targetNode: KnowledgeNode,
    maxTokens: number
  ): KnowledgeNode[] {
    // 按时间排序
    const sorted = [...nodes].sort((a, b) => a.createdAt - b.createdAt)
    
    // 始终保留根节点和最近的几条消息
    const result: KnowledgeNode[] = []
    let estimatedTokens = 0
    
    // 添加最近的消息（倒序）
    for (let i = sorted.length - 1; i >= 0; i--) {
      const node = sorted[i]
      const tokens = node.content.length / 4
      
      if (estimatedTokens + tokens > maxTokens * 0.7) {
        break
      }
      
      result.unshift(node)
      estimatedTokens += tokens
    }

    return result
  }

  // ============================================
  // 自动分析功能
  // ============================================

  /**
   * 提取 Action Items
   */
  async extractActionItems(_text: string, _config?: Partial<AIConfig>): Promise<ActionItem[]> {
    // TODO: 实现 action item 提取
    return []
  }

  /**
   * 生成摘要
   */
  async generateSummary(nodes: KnowledgeNode[], _config?: Partial<AIConfig>): Promise<string> {
    const content = nodes.map((n) => `${n.type}: ${n.content}`).join('\n\n')
    
    // TODO: 实现实际的摘要生成
    return `Summary of ${nodes.length} nodes: ${content.slice(0, 100)}...`
  }

  /**
   * 话题分类
   */
  async classifyTopic(_text: string, _config?: Partial<AIConfig>): Promise<string[]> {
    // TODO: 实现话题分类
    return ['general']
  }

  /**
   * 建议连接
   */
  async suggestConnections(
    _node: KnowledgeNode,
    _candidates: KnowledgeNode[],
    _config?: Partial<AIConfig>
  ): Promise<Array<{ nodeId: string; strength: number; reason: string }>> {
    // TODO: 实现连接建议
    return []
  }

  /**
   * 综合分析
   */
  async analyzeContent(content: string, _config?: Partial<AIConfig>): Promise<AIAnalysisResult> {
    // TODO: 实现内容分析
    return {
      concepts: [],
      keywords: content.split(' ').slice(0, 5),
      summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      relatedConcepts: [],
      suggestedConnections: [],
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 检查 Provider 是否已配置
   */
  isProviderConfigured(provider: AIProvider): boolean {
    return this.apiKeys.has(provider)
  }

  /**
   * 获取可用的 Provider 列表
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.apiKeys.keys())
  }

  /**
   * 设置默认配置
   */
  setDefaultConfig(config: Partial<AIConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): AIConfig {
    return { ...this.defaultConfig }
  }
}

// 导出单例
export const aiService = new AIService()

// ============================================
// 流式节点更新器
// ============================================

export class StreamingNodeUpdater {
  private abortController: AbortController | null = null

  /**
   * 开始流式更新节点
   */
  async startStreaming(
    nodeId: string,
    messages: ChatMessage[],
    config: Partial<AIConfig>
  ): Promise<string> {
    const graphStore = useGraphStore.getState()
    
    // 设置流式状态
    graphStore.setStreamingNode(nodeId)
    graphStore.updateNodeStatus(nodeId, 'streaming')
    
    let fullText = ''
    
    return new Promise((resolve, reject) => {
      this.abortController = new AbortController()
      
      aiService.streamChat(
        messages,
        config,
        {
          onStart: () => {
            console.log('Streaming started for node:', nodeId)
          },
          onToken: (token) => {
            fullText += token
            // 更新节点内容（节流处理）
            this.throttledUpdate(nodeId, fullText)
          },
          onComplete: async (text) => {
            // 完成更新
            await graphStore.updateNode(nodeId, {
              label: this.generateLabel(text),
              content: text,
              updatedAt: Date.now(),
            })
            
            graphStore.updateNodeStatus(nodeId, 'completed')
            graphStore.setStreamingNode(null)
            
            // 更新 metadata
            const node = graphStore.getNodeById(nodeId)
            if (node) {
              const startTime = node.metadata?.timeline?.startTime || Date.now()
              graphStore.updateNode(nodeId, {
                metadata: {
                  ...node.metadata,
                  timeline: {
                    startTime,
                    endTime: Date.now(),
                    duration: Date.now() - startTime,
                  }
                }
              })
            }
            
            resolve(text)
          },
          onError: (error) => {
            graphStore.updateNodeStatus(nodeId, 'failed')
            graphStore.setStreamingNode(null)
            reject(error)
          },
        }
      )
      
      // 监听取消信号
      this.abortController.signal.addEventListener('abort', () => {
        graphStore.setStreamingNode(null)
      })
    })
  }

  /**
   * 取消流式生成
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 节流更新
   */
  private updateTimer: ReturnType<typeof setTimeout> | null = null
  private throttledUpdate(nodeId: string, content: string): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    
    this.updateTimer = setTimeout(() => {
      const graphStore = useGraphStore.getState()
      graphStore.updateNodeContent(nodeId, content)
    }, 50) // 50ms 节流
  }

  /**
   * 生成节点标签
   */
  private generateLabel(content: string): string {
    // 提取第一行或前20个字符作为标签
    const firstLine = content.split('\n')[0].trim()
    if (firstLine.length <= 30) return firstLine
    return firstLine.slice(0, 30) + '...'
  }
}

// 导出流式更新器实例
export const streamingUpdater = new StreamingNodeUpdater()
