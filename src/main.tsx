import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Note: StrictMode disabled due to WebGL context issues with rapid mount/unmount cycles
// See: src/debug/ for debugging tools if needed
createRoot(document.getElementById('root')!).render(<App />)
