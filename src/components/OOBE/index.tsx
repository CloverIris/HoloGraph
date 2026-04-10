import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles, MessageSquare, GitBranch, Map, Check } from 'lucide-react'
import { oobeSteps, featureCards } from './steps'
import { useUIStore } from '@stores/uiStore'
import { useGraphStore } from '@stores/graphStore'
import { createDemoGraph, createWelcomeGraph } from './demoData'
import './OOBE.css'

interface OOBEProps {
  isOpen: boolean
  onClose: () => void
}

export function OOBE({ isOpen, onClose }: OOBEProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedDemo, setSelectedDemo] = useState<string>('welcome')
  const { settings, updateSettings } = useUIStore()
  const { setGraph } = useGraphStore()

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setSelectedDemo('welcome')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && !e.shiftKey) {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, selectedDemo])

  const handleNext = useCallback(() => {
    if (currentStep < oobeSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleFinish()
    }
  }, [currentStep, selectedDemo])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleFinish = useCallback(() => {
    if (selectedDemo === 'welcome') {
      setGraph(createWelcomeGraph())
    } else if (selectedDemo === 'conversation') {
      setGraph(createDemoGraph())
    }

    updateSettings({ 
      ...settings,
      behavior: { ...settings.behavior, oobeCompleted: true }
    })

    onClose()
  }, [selectedDemo, setGraph, updateSettings, settings, onClose])

  const handleSkip = useCallback(() => {
    updateSettings({ 
      ...settings,
      behavior: { ...settings.behavior, oobeCompleted: true }
    })
    onClose()
  }, [updateSettings, settings, onClose])

  if (!isOpen) return null

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === oobeSteps.length - 1

  const renderStepContent = () => {
    const step = oobeSteps[currentStep]
    
    switch (step.id) {
      case 'welcome':
        return (
          <div className="oobe-welcome-content oobe-step-content">
            <div className="oobe-logo-wrapper">
              <Sparkles className="oobe-logo-icon" />
            </div>
            <h1 className="oobe-welcome-title">HoloGraph</h1>
            <p className="oobe-welcome-subtitle">全像星图 · 个人知识图谱化工具</p>
            <div className="oobe-feature-grid">
              {featureCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <div key={index} className="oobe-feature-card">
                    <Icon className="oobe-feature-icon" />
                    <h3 className="oobe-feature-title">{card.title}</h3>
                    <p className="oobe-feature-desc">{card.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'demo':
        return (
          <div className="oobe-demo-content oobe-step-content">
            <h2 className="oobe-demo-title">选择一个示例项目开始</h2>
            <p className="oobe-demo-desc">你可以随时在设置中重新打开此引导</p>
            <div className="oobe-demo-grid">
              <div 
                className={`oobe-demo-card ${selectedDemo === 'welcome' ? 'selected' : ''}`}
                onClick={() => setSelectedDemo('welcome')}
              >
                <div className="oobe-demo-card-icon"><Sparkles /></div>
                <h3 className="oobe-demo-card-title">欢迎引导</h3>
                <p className="oobe-demo-card-desc">简洁的欢迎页面和功能介绍，适合首次使用</p>
                {selectedDemo === 'welcome' && <div className="oobe-check-mark"><Check size={14} /></div>}
              </div>

              <div 
                className={`oobe-demo-card ${selectedDemo === 'conversation' ? 'selected' : ''}`}
                onClick={() => setSelectedDemo('conversation')}
              >
                <div className="oobe-demo-card-icon"><MessageSquare /></div>
                <h3 className="oobe-demo-card-title">对话示例</h3>
                <p className="oobe-demo-card-desc">展示对话流程、分支和 AI 响应的完整示例</p>
                {selectedDemo === 'conversation' && <div className="oobe-check-mark"><Check size={14} /></div>}
              </div>

              <div 
                className={`oobe-demo-card ${selectedDemo === 'mindmap' ? 'selected' : ''}`}
                onClick={() => setSelectedDemo('mindmap')}
              >
                <div className="oobe-demo-card-icon"><Map /></div>
                <h3 className="oobe-demo-card-title">思维导图</h3>
                <p className="oobe-demo-card-desc">展示知识图谱化和节点关系的示例</p>
                {selectedDemo === 'mindmap' && <div className="oobe-check-mark"><Check size={14} /></div>}
              </div>

              <div 
                className={`oobe-demo-card ${selectedDemo === 'empty' ? 'selected' : ''}`}
                onClick={() => setSelectedDemo('empty')}
              >
                <div className="oobe-demo-card-icon"><GitBranch /></div>
                <h3 className="oobe-demo-card-title">空白项目</h3>
                <p className="oobe-demo-card-desc">从空白开始，自由创建你的知识图谱</p>
                {selectedDemo === 'empty' && <div className="oobe-check-mark"><Check size={14} /></div>}
              </div>
            </div>
          </div>
        )

      case 'features':
        return (
          <div className="oobe-welcome-content oobe-step-content">
            <h2 className="oobe-demo-title">核心功能</h2>
            <p className="oobe-demo-desc">掌握这些技巧，提升你的知识管理效率</p>
            <div className="oobe-feature-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '600px' }}>
              {[
                { title: '快捷键', desc: 'Ctrl+N 新建节点，Ctrl+F 搜索，Delete 删除选中项' },
                { title: 'AI 集成', desc: '右键点击节点选择"Ask AI"，让 AI 帮你扩展思路' },
                { title: '分支管理', desc: '使用分支节点探索不同的思考路径和可能性' },
                { title: '双击创建', desc: '在画布空白处双击即可快速创建新节点' }
              ].map((item, idx) => (
                <div key={idx} className="oobe-feature-card" style={{ textAlign: 'left' }}>
                  <h3 className="oobe-feature-title">{item.title}</h3>
                  <p className="oobe-feature-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="oobe-settings-content oobe-step-content">
            <h2 className="oobe-settings-title">个性化设置</h2>
            <p className="oobe-settings-desc">这些设置可以在稍后随时修改</p>
            
            <div className="oobe-setting-group">
              <label className="oobe-setting-label">主题模式</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['dark', 'light', 'system'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ 
                      ...settings, 
                      display: { ...settings.display, theme: theme as any }
                    })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: settings.display.theme === theme ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                      background: settings.display.theme === theme ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: settings.display.theme === theme ? 'white' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </div>

            <div className="oobe-setting-group">
              <label className="oobe-setting-label">自动保存</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.behavior.autoSave}
                  onChange={(e) => updateSettings({
                    ...settings,
                    behavior: { ...settings.behavior, autoSave: e.target.checked }
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  启用自动保存（每30秒）
                </span>
              </label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="oobe-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="oobe-container">
        <div className="oobe-header">
          <div className="oobe-progress-bar">
            {oobeSteps.map((_, index) => (
              <div 
                key={index}
                className={`oobe-progress-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="oobe-close-btn" onClick={onClose} title="关闭 (ESC)">
            <X size={18} />
          </button>
        </div>

        <div className="oobe-content">
          {renderStepContent()}
        </div>

        <div className="oobe-footer">
          <button className="oobe-skip-btn" onClick={handleSkip}>
            跳过引导
          </button>
          <div className="oobe-nav-buttons">
            {!isFirstStep && (
              <button className="oobe-back-btn" onClick={handleBack}>
                <ChevronLeft size={18} />
                上一步
              </button>
            )}
            <button className="oobe-next-btn" onClick={isLastStep ? handleFinish : handleNext}>
              {isLastStep ? '开始使用' : '下一步'}
              {!isLastStep && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
