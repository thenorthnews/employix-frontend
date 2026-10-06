import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Seamlessly forward from localtest.me (Surepass WAF bypass) back to localhost keeping auth session & parameters
if (typeof window !== 'undefined' && window.location.hostname === 'localtest.me') {
  window.location.replace(window.location.href.replace('://localtest.me', '://localhost'));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
