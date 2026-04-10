import type { ReactNode } from 'react'
import { Sparkles, MessageSquare, GitBranch, Brain, Settings, Rocket } from 'lucide-react'

export interface OOBEStep {
  id: string
  title: string
  description: string
  icon: typeof Sparkles
  content?: ReactNode
}

export const oobeSteps: OOBEStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 HoloGraph',
    description: '你的个人知识图谱化工具',
    icon: Sparkles
  },
  {
    id: 'demo',
    title: '探索示例项目',
    description: '了解 HoloGraph 的核心功能',
    icon: Rocket
  },
  {
    id: 'features',
    title: '核心功能',
    description: '对话、分支、AI 集成',
    icon: Brain
  },
  {
    id: 'settings',
    title: '个性化设置',
    description: '配置你的工作环境',
    icon: Settings
  }
]

export const featureCards = [
  {
    icon: MessageSquare,
    title: '对话式知识管理',
    description: '以对话的形式记录和整理知识，每个节点都是思维的一部分'
  },
  {
    icon: GitBranch,
    title: '可视化分支',
    description: '轻松创建和管理知识分支，探索不同的思考路径'
  },
  {
    icon: Brain,
    title: 'AI 辅助',
    description: '集成 OpenAI 和 Anthropic，让 AI 帮助你扩展思维'
  }
]
