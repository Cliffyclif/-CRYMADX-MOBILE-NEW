import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/i18n' // bootstrap i18n before any component renders
import './styles/bold-waves.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
