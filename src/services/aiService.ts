import { 
  streamText, 
  generateText, 
  createOpenAI, 
  createAnthropic,
  type CoreMessage,
  type StreamTextResult 
} from 'ai'
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
import { useUIStore } from '@stores/uiStore'

// ============================================
// AI Provider 配置
// ============================================

interface ProviderConfig {
  apiKey: string
  baseURL?: string
  models: string[]
}

// ============================================
// AI Service
// ============================================

class AIService {
  private providers: Map<AIProvider, any> = new Map()
  private defaultConfig: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
  }

  // 初始化 Provider
  initializeProvider(provider: AIProvider, config: ProviderConfig): void {
    switch (provider) {
      case 'openai':
        this.providers.set(provider, createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        }))
        break
      case 'anthropic':
        this.providers.set(provider, createAnthropic({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        }))
        break
      case 'gemini':
        // TODO: 添加 Gemini 支持
        console.warn('Gemini provider not yet implemented')
        break
      case 'local':
        // TODO: 添加本地模型支持
        console.warn('Local provider not yet implemented')
        break
    }
  }

  // 获取 Provider
  private getProvider(config: AIConfig): any {
    const provider = this.providers.get(config.provider)
    if (!provider) {
      throw new Error(`Provider ${config.provider} not initialized`)
    }
    return provider
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
      
      const provider = this.getProvider(mergedConfig)
      
      // 转换消息格式
      const coreMessages: CoreMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name }),
      }))

      // 创建流
      const result = await streamText({
        model: provider(mergedConfig.model),
        messages: coreMessages,
        temperature: mergedConfig.temperature,
        maxTokens: mergedConfig.maxTokens,
        ...(mergedConfig.systemPrompt && { system: mergedConfig.systemPrompt }),
      })

      // 处理流
      let fullText = ''
      for await (const chunk of result.textStream) {
        fullText += chunk
        callbacks.onToken(chunk)
      }

      // 获取使用统计
      const usage = await result.usage
      
      callbacks.onComplete(fullText)
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
      const provider = this.getProvider(mergedConfig)
      
      const coreMessages: CoreMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const result = await generateText({
        model: provider(mergedConfig.model),
        messages: coreMessages,
        temperature: mergedConfig.temperature,
        maxTokens: mergedConfig.maxTokens,
        ...(mergedConfig.systemPrompt && { system: mergedConfig.systemPrompt }),
      })

      return {
        content: result.text,
        usage: result.usage ? {
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        } : undefined,
        finishReason: result.finishReason,
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
    targetNode: KnowledgeNode,
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
  async extractActionItems(text: string, config?: Partial<AIConfig>): Promise<ActionItem[]> {
    const prompt = `Extract action items from the following text. 
Return a JSON array with objects containing: text (string), priority ("high" | "medium" | "low").

Text: ${text}

Response format: [{"text": "...", "priority": "high"}]`

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.2 }
      )
      
      const items = JSON.parse(response.content)
      return items.map((item: any) => ({
        text: item.text,
        priority: item.priority || 'medium',
      }))
    } catch (error) {
      console.error('Failed to extract action items:', error)
      return []
    }
  }

  /**
   * 生成摘要
   */
  async generateSummary(nodes: KnowledgeNode[], config?: Partial<AIConfig>): Promise<string> {
    const content = nodes.map((n) => `${n.type}: ${n.content}`).join('\n\n')
    
    const prompt = `Summarize the following conversation into 2-3 key points.
Be concise and capture the main insights.

Conversation:
${content}`

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.5, maxTokens: 500 }
      )
      
      return response.content.trim()
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return ''
    }
  }

  /**
   * 话题分类
   */
  async classifyTopic(text: string, config?: Partial<AIConfig>): Promise<string[]> {
    const prompt = `Classify the following text into 1-3 topic categories.
Return only the category names as a JSON array.

Text: ${text}`

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.3, maxTokens: 100 }
      )
      
      return JSON.parse(response.content)
    } catch (error) {
      console.error('Failed to classify topic:', error)
      return []
    }
  }

  /**
   * 建议连接
   */
  async suggestConnections(
    node: KnowledgeNode,
    candidates: KnowledgeNode[],
    config?: Partial<AIConfig>
  ): Promise<Array<{ nodeId: string; strength: number; reason: string }>> {
    const candidatesText = candidates
      .map((c) => `- ${c.label}: ${c.content.slice(0, 100)}`)
      .join('\n')
    
    const prompt = `Given the following node and candidate nodes, suggest which candidates are most relevant to connect to.
Return a JSON array with objects containing: nodeId (string), strength (0-1 number), reason (string).

Target Node: ${node.label}
Content: ${node.content.slice(0, 200)}

Candidates:
${candidatesText}

Response format: [{"nodeId": "...", "strength": 0.8, "reason": "..."}]`

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.3 }
      )
      
      return JSON.parse(response.content)
    } catch (error) {
      console.error('Failed to suggest connections:', error)
      return []
    }
  }

  /**
   * 综合分析
   */
  async analyzeContent(content: string, config?: Partial<AIConfig>): Promise<AIAnalysisResult> {
    const prompt = `Analyze the following content and provide:
1. Key concepts (max 5)
2. Keywords (max 5)
3. Brief summary (max 100 words)

Content: ${content}

Response format: {
  "concepts": ["..."],
  "keywords": ["..."],
  "summary": "...",
  "relatedConcepts": [],
  "suggestedConnections": []
}`

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        { ...config, temperature: 0.5 }
      )
      
      const result = JSON.parse(response.content)
      return {
        concepts: result.concepts || [],
        keywords: result.keywords || [],
        summary: result.summary || '',
        relatedConcepts: result.relatedConcepts || [],
        suggestedConnections: result.suggestedConnections || [],
      }
    } catch (error) {
      console.error('Failed to analyze content:', error)
      return {
        concepts: [],
        keywords: [],
        summary: '',
        relatedConcepts: [],
        suggestedConnections: [],
      }
    }
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 检查 Provider 是否已配置
   */
  isProviderConfigured(provider: AIProvider): boolean {
    return this.providers.has(provider)
  }

  /**
   * 获取可用的 Provider 列表
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
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
              graphStore.updateNode(nodeId, {
                metadata: {
                  ...node.metadata,
                  timeline: {
                    ...node.metadata?.timeline,
                    endTime: Date.now(),
                    duration: Date.now() - (node.metadata?.timeline?.startTime || Date.now()),
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
        // TODO: 实现流式取消
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
