import type { KnowledgeNode, KnowledgeEdge } from '@mytypes'

interface GraphData {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  metadata?: { name: string; version: number }
}

export function createWelcomeGraph(): GraphData {
  const timestamp = Date.now()
  
  const nodes: KnowledgeNode[] = [
    {
      id: 'welcome-1',
      label: '欢迎使用 HoloGraph',
      type: 'session',
      content: '👋 欢迎来到 HoloGraph！这是一个个人知识图谱化工具，帮助你以对话的形式管理和扩展知识。\n\n双击空白处创建新节点，开始你的知识之旅！',
      position: { x: 0, y: 0 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['welcome', 'intro'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'welcome-2',
      label: '快速开始',
      type: 'block',
      content: '🚀 快速入门指南：\n\n• 双击空白处创建节点\n• 右键点击节点查看菜单\n• 拖拽移动节点\n• 滚轮缩放画布\n• 按 Delete 删除选中节点',
      position: { x: 400, y: -100 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['tutorial'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'welcome-3',
      label: 'AI 集成',
      type: 'block',
      content: '🤖 AI 功能：\n\n右键点击任意节点，选择 "Ask AI" 让 AI 帮你：\n• 扩展思路\n• 总结内容\n• 生成分支\n• 回答问题\n\n在设置中配置你的 API 密钥。',
      position: { x: 400, y: 150 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['ai', 'feature'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'welcome-4',
      label: '下一步',
      type: 'todo',
      content: '☑️ 试试这些：\n\n• 创建一个新节点\n• 尝试 AI 功能\n• 探索分支功能\n• 自定义你的设置',
      position: { x: 800, y: 50 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['todo', 'getting-started'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    }
  ]

  const edges: KnowledgeEdge[] = [
    { 
      id: 'e1', 
      source: 'welcome-1', 
      target: 'welcome-2', 
      type: 'conversation',
      label: '了解',
      strength: 1,
      createdAt: timestamp,
      metadata: {}
    },
    { 
      id: 'e2', 
      source: 'welcome-1', 
      target: 'welcome-3', 
      type: 'conversation',
      label: '功能',
      strength: 1,
      createdAt: timestamp,
      metadata: {}
    },
    { 
      id: 'e3', 
      source: 'welcome-1', 
      target: 'welcome-4', 
      type: 'conversation',
      label: '开始',
      strength: 1,
      createdAt: timestamp,
      metadata: {}
    }
  ]

  return { nodes, edges, metadata: { name: '欢迎使用', version: 1 } }
}

export function createDemoGraph(): GraphData {
  const timestamp = Date.now()
  
  const nodes: KnowledgeNode[] = [
    {
      id: 'demo-1',
      label: '项目头脑风暴',
      type: 'session',
      content: '💡 新项目构思会议记录\n\n时间：2024年\n主题：开发一个知识管理工具\n\n核心需求：\n- 可视化知识图谱\n- 对话式交互\n- AI 辅助',
      position: { x: 0, y: 0 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['project', 'brainstorm'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'demo-2',
      label: '用户反馈',
      type: 'block',
      content: '📊 收集到的用户反馈：\n\n1. "想要一个更直观的笔记工具"\n2. "希望能看到知识之间的关联"\n3. "AI 辅助整理思路会很有帮助"\n4. "不喜欢线性的笔记方式"\n\n→ 印证了项目的方向',
      position: { x: 450, y: -150 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['research', 'feedback'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'demo-3',
      label: '技术选型',
      type: 'branch',
      content: '🔧 技术方案讨论：\n\n前端框架选择：\nA. React + TypeScript ✓\nB. Vue.js\nC. Svelte\n\n选择 React 的原因：\n- 生态系统成熟\n- 类型安全\n- 团队协作友好',
      position: { x: 450, y: 120 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['tech', 'decision'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'demo-4',
      label: 'AI 建议',
      type: 'ai-response',
      content: '🤖 AI 助手分析：\n\n基于用户反馈，建议关注以下功能优先级：\n\n1. 画布交互体验（最重要）\n2. 节点关联可视化\n3. AI 集成能力\n4. 导入/导出功能\n\n建议采用渐进式开发策略。',
      position: { x: 450, y: 400 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['ai', 'suggestion'],
      metadata: {
        status: 'completed',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    },
    {
      id: 'demo-5',
      label: '行动计划',
      type: 'action',
      content: '⚡ 待办事项：\n\n☑ 完成原型设计\n☑ 搭建基础架构\n☐ 实现核心画布功能\n☐ 添加 AI 集成\n☐ 用户测试\n\n截止日期：月底',
      position: { x: 850, y: 50 },
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ['action', 'todo'],
      metadata: {
        status: 'idle',
        childrenIds: [],
        lod: { level: 3, collapsed: false, childCount: 0 }
      }
    }
  ]

  const edges: KnowledgeEdge[] = [
    { id: 'e1', source: 'demo-1', target: 'demo-2', type: 'conversation', label: '收集', strength: 1, createdAt: timestamp, metadata: {} },
    { id: 'e2', source: 'demo-1', target: 'demo-3', type: 'conversation', label: '讨论', strength: 1, createdAt: timestamp, metadata: {} },
    { id: 'e3', source: 'demo-1', target: 'demo-4', type: 'conversation', label: '咨询', strength: 1, createdAt: timestamp, metadata: {} },
    { id: 'e4', source: 'demo-2', target: 'demo-5', type: 'conversation', label: '推动', strength: 1, createdAt: timestamp, metadata: {} },
    { id: 'e5', source: 'demo-3', target: 'demo-5', type: 'conversation', label: '确定', strength: 1, createdAt: timestamp, metadata: {} },
    { id: 'e6', source: 'demo-4', target: 'demo-5', type: 'conversation', label: '建议', strength: 1, createdAt: timestamp, metadata: {} }
  ]

  return { nodes, edges, metadata: { name: '示例：项目规划', version: 1 } }
}
