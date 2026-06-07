import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authenticate, logout, getCurrentNick, getCurrentCargo, isConvidado, podeAcessarConfig } from './utils/auth'
import { DataProvider } from './contexts/DataContext'
import Sidebar from './components/Sidebar'
import EscalasPage from './pages/EscalasPage'
import ManualPage from './pages/ManualPage'
import FuncoesPage from './pages/FuncoesPage'
import MembrosPage from './pages/MembrosPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import './styles/globals.css'

// ---------- COMPONENTE DE CARREGAMENTO ----------
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#080c14', flexDirection: 'column', gap: '20px'
    }}>
      <div style={{
        width: '48px', height: '48px', border: '3px solid #1e3a5f',
        borderTopColor: '#3b82f6', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: '#64748b', fontSize: '14px' }}>Autenticando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ---------- TELA DE BLOQUEIO ----------
function BlockedScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#080c14', flexDirection: 'column', gap: '20px', padding: '20px'
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 600 }}>Acesso Negado</h1>
      <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
        Você precisa acessar esta página através do fórum oficial.
      </p>
      <button
        onClick={() => window.location.href = 'URL_DO_FORUM_AQUI'}
        style={{
          padding: '12px 28px', background: '#1e3a5f', color: '#fff',
          border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'inherit', marginTop: '8px'
        }}
      >
        Ir para o Fórum
      </button>
    </div>
  )
}

// ---------- TELA DE ACESSO RESTRITO ----------
function AcessoRestritoPage() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#080c14', flexDirection: 'column', gap: '20px', padding: '20px'
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 600 }}>Acesso Restrito</h1>
      <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
        Apenas Líder e Vice-Líder têm acesso a esta página.
      </p>
      <button
        onClick={() => window.history.back()}
        style={{
          padding: '12px 28px', background: '#1e3a5f', color: '#fff',
          border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'inherit', marginTop: '8px'
        }}
      >
        Voltar
      </button>
    </div>
  )
}

// ---------- ROUTE GUARD ----------
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const cargo = getCurrentCargo()

  if (requireAdmin && !podeAcessarConfig(cargo)) {
    return <AcessoRestritoPage />
  }

  return <>{children}</>
}

// ---------- APP PRINCIPAL ----------
function App() {
  const [authState, setAuthState] = useState<'loading' | 'autenticado' | 'bloqueado'>('loading')
  const [userNick, setUserNick] = useState('')
  const [userCargo, setUserCargo] = useState('')

  useEffect(() => {
    const init = async () => {
      const resultado = await authenticate()

      if (resultado.autenticado) {
        setUserNick(resultado.nick || '')
        setUserCargo(resultado.cargo || '')
        setAuthState('autenticado')
      } else {
        setAuthState('bloqueado')
      }
    }

    init()
  }, [])

  if (authState === 'loading') {
    return <LoadingScreen />
  }

  if (authState === 'bloqueado') {
    return <BlockedScreen />
  }

  const isAdmin = podeAcessarConfig(userCargo)
  const convidado = isConvidado()

  return (
    <DataProvider>
      <Router>
        <div style={{ display: 'flex' }}>
          <Sidebar
            userNick={userNick}
            userCargo={userCargo}
            isAdmin={isAdmin}
            isConvidado={convidado}
            onLogout={logout}
          />
          <main style={{ flex: 1, marginLeft: '260px', padding: '32px 40px', background: '#080c14', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<EscalasPage />} />
              <Route path="/escalas" element={<EscalasPage />} />
              <Route path="/manual/:ministry" element={<ManualPage />} />

              {/* Protegidas: só admin */}
              <Route
                path="/funcoes"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <FuncoesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/membros"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <MembrosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ConfiguracoesPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  )
}

export default App