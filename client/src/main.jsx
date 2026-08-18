import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './components/admin/AdminApp.jsx'

const root = createRoot(document.getElementById('root'));

// ponytail: hash-based admin routing, no new dependency.
// URL /#/admin → admin desktop; everything else → employee mobile.
// ceiling: hash-only; upgrade to React Router if real paths needed.
const isAdmin = window.location.hash.startsWith('#/admin');

root.render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
)
