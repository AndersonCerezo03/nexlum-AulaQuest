import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import GuideAgent from './GuideAgent.jsx'

const style = document.createElement('style')
style.textContent = `*{margin:0;padding:0;box-sizing:border-box;}body,#root{width:100%;min-height:100vh;}`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <GuideAgent />
    <WhatsAppButton />
  </StrictMode>,
)