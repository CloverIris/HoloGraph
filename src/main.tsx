import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

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
