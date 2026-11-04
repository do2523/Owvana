import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/figtree'
import './index.css'
import App from './App.tsx'
import './theme.css'

// the edge bending only works in chrome and edge
if ('chrome' in window) document.documentElement.classList.add('liquid')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
