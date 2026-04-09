import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TeresaConnect from './TeresaConnect.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeresaConnect />
  </StrictMode>,
)
