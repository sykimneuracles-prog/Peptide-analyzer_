import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PeptideAnalyzer from './PeptideAnalyzer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PeptideAnalyzer />
  </StrictMode>
)
