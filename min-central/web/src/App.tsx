import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import EscalasPage from './pages/EscalasPage'
import ManualPage from './pages/ManualPage'
import FuncoesPage from './pages/FuncoesPage'
import MembrosPage from './pages/MembrosPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '260px', padding: '32px 40px', background: '#080c14', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<EscalasPage />} />
            <Route path="/escalas" element={<EscalasPage />} />
            <Route path="/manual/:ministry" element={<ManualPage />} />
            <Route path="/funcoes" element={<FuncoesPage />} />
            <Route path="/membros" element={<MembrosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App