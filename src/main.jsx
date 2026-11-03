import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppProvider } from './store.jsx'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(
  <HashRouter><AppProvider><App /></AppProvider></HashRouter>
)
