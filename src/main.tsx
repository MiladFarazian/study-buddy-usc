
import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'

// Only use StrictMode in development, not in preview
createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);
