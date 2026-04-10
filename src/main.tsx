import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initializeDefaultSession } from '@stores/sessionStore'
import { aiService } from '@services/aiService'
import { useUIStore } from '@stores/uiStore'

// Debug info
console.log('main.tsx loaded')
console.log('Root element:', document.getElementById('root'))

// Error handler
window.onerror = (msg, url, line, col, error) => {
  console.error('Window error:', msg, url, line, col, error)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
})

// Initialize app
function initializeApp() {
  // 初始化默认会话
  initializeDefaultSession()
  console.log('Default session initialized')
  
  // 初始化 AI 配置
  const state = useUIStore.getState()
  const settings = state?.settings
  
  if (!settings?.ai) {
    console.log('AI settings not available')
    return
  }
  
  const apiKey = settings.ai.apiKeys?.[settings.ai.defaultProvider]
  
  if (apiKey) {
    aiService.setApiKey(settings.ai.defaultProvider, apiKey)
    aiService.setDefaultConfig({
      provider: settings.ai.defaultProvider,
      model: settings.ai.defaultModel,
      temperature: settings.ai.temperature,
      maxTokens: settings.ai.maxTokens,
      stream: settings.ai.streamEnabled,
    })
    console.log('AI provider configured:', settings.ai.defaultProvider)
  } else {
    console.log('No API key configured for AI provider')
  }
}

// Run initialization
initializeApp()

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('React app mounted')
}
