import { useState, useEffect } from 'react'
import { Sparkles, Network, Search, Zap } from 'lucide-react'
import './WelcomeModal.css'

interface WelcomeModalProps {
  onClose: () => void
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasVisited = localStorage.getItem('holograph_visited')
    if (!hasVisited) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('holograph_visited', 'true')
    setIsVisible(false)
    onClose()
  }

  const steps = [
    {
      icon: <Network size={48} />,
      title: 'Welcome to HoloGraph',
      description: 'HoloGraph is a personal knowledge mapping tool that helps you organize fragmented knowledge into a visual constellation network.',
    },
    {
      icon: <Zap size={48} />,
      title: 'Create Knowledge Nodes',
      description: 'Click the + button or press Ctrl+N to create new knowledge nodes. You can create concepts, notes, code snippets, and more.',
    },
    {
      icon: <Search size={48} />,
      title: 'Discover Connections',
      description: 'Build connections between nodes and discover hidden relationships in your knowledge. Use the search box (Ctrl+K) to find nodes.',
    },
    {
      icon: <Sparkles size={48} />,
      title: 'Start Exploring',
      description: 'Your knowledge universe awaits. Start creating your first node!',
    },
  ]

  if (!isVisible) return null

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <div className="modal-bg-decoration">
          <div className="star-field">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="bg-star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="modal-content">
          <div className="step-icon animate-fadeIn">
            {steps[currentStep].icon}
          </div>
          
          <h2 className="step-title">{steps[currentStep].title}</h2>
          <p className="step-description">{steps[currentStep].description}</p>

          <div className="progress-dots">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <div className="modal-actions">
            {currentStep > 0 && (
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={handleClose}
              >
                Start Exploring
              </button>
            )}
          </div>

          <button className="skip-link" onClick={handleClose}>
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
