import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initialLocaleReady } from './lib/i18n' // bootstrap i18n before render
import './styles/fonts.css' // self-hosted fonts — load before bold-waves.css
import './styles/bold-waves.css'
import App from './App.tsx'

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Wait for the saved/detected locale bundle so non-English users don't see a
// flash of English on cold start. Resolves instantly for English (and never
// rejects — loadLocale swallows failures), so first paint isn't held up.
initialLocaleReady.then(render, render)
