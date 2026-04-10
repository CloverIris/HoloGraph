import { useState } from 'react'
import { useUIStore } from '@stores/uiStore'
import { aiService } from '@services/aiService'
import type { AIProvider } from '@mytypes'
import { Key, Save, TestTube, AlertCircle, Check } from 'lucide-react'
import './AISettings.css'

export function AISettings() {
  const { settings, updateAISettings } = useUIStore()
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  
  const [formData, setFormData] = useState({
    provider: settings.ai.defaultProvider,
    model: settings.ai.defaultModel,
    apiKey: settings.ai.apiKeys[settings.ai.defaultProvider] || '',
    temperature: settings.ai.temperature,
    maxTokens: settings.ai.maxTokens,
    streamEnabled: settings.ai.streamEnabled,
  })

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
    { id: 'local', name: 'Local Model', models: ['llama2', 'mistral', 'codellama'] },
  ]

  const handleSave = () => {
    // 设置 AI API Key
    if (formData.apiKey) {
      aiService.setApiKey(formData.provider as any, formData.apiKey)
    }
    
    // 更新设置
    updateAISettings({
      defaultProvider: formData.provider as any,
      defaultModel: formData.model,
      apiKeys: {
        ...settings.ai.apiKeys,
        [formData.provider]: formData.apiKey,
      },
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      streamEnabled: formData.streamEnabled,
    })
    
    // 设置默认配置
    aiService.setDefaultConfig({
      provider: formData.provider as any,
      model: formData.model,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      stream: formData.streamEnabled,
    })
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMessage('')
    
    try {
      // 临时设置 API key
      aiService.setApiKey(formData.provider as any, formData.apiKey)
      
      const response = await aiService.chat(
        [{ role: 'user', content: 'Say "HoloGraph AI test successful" in 5 words or less.' }],
        {
          provider: formData.provider as any,
          model: formData.model,
          temperature: 0.5,
          maxTokens: 50,
        }
      )
      
      if (response.content) {
        setTestStatus('success')
        setTestMessage(response.content)
      } else {
        setTestStatus('error')
        setTestMessage('No response from AI')
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const currentProvider = providers.find((p) => p.id === formData.provider)

  return (
    <div className="ai-settings">
      <h3>AI 设置</h3>
      
      <div className="settings-section">
        <label>AI Provider</label>
        <select
          value={formData.provider}
          onChange={(e) => {
            const provider = e.target.value as AIProvider
            setFormData({
              ...formData,
              provider,
              model: providers.find((p) => p.id === provider)?.models[0] || '',
              apiKey: settings.ai.apiKeys[provider] || '',
            })
          }}
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <label>Model</label>
        <select
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
        >
          {currentProvider?.models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <label>
          <Key size={14} />
          API Key
        </label>
        <input
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder={`Enter your ${currentProvider?.name} API key`}
        />
        <span className="hint">
          Your API key is stored locally and never sent to our servers.
        </span>
      </div>

      <div className="settings-row">
        <div className="settings-section">
          <label>Temperature</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) =>
              setFormData({ ...formData, temperature: parseFloat(e.target.value) })
            }
          />
          <span className="value">{formData.temperature}</span>
        </div>

        <div className="settings-section">
          <label>Max Tokens</label>
          <input
            type="number"
            min="100"
            max="8000"
            step="100"
            value={formData.maxTokens}
            onChange={(e) =>
              setFormData({ ...formData, maxTokens: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="settings-section checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.streamEnabled}
            onChange={(e) =>
              setFormData({ ...formData, streamEnabled: e.target.checked })
            }
          />
          Enable streaming responses
        </label>
      </div>

      {testStatus !== 'idle' && (
        <div className={`test-result ${testStatus}`}>
          {testStatus === 'testing' && <span>Testing...</span>}
          {testStatus === 'success' && (
            <>
              <Check size={16} />
              <span>{testMessage}</span>
            </>
          )}
          {testStatus === 'error' && (
            <>
              <AlertCircle size={16} />
              <span>{testMessage}</span>
            </>
          )}
        </div>
      )}

      <div className="settings-actions">
        <button className="btn-test" onClick={handleTest} disabled={testStatus === 'testing'}>
          <TestTube size={16} />
          Test Connection
        </button>
        <button className="btn-save" onClick={handleSave}>
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
