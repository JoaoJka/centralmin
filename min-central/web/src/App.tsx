import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { ToastProvider } from './contexts/ToastContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EscalasPage from './pages/EscalasPage'
import ManualPage from './pages/ManualPage'
import FuncoesPage from './pages/FuncoesPage'
import MembrosPage from './pages/MembrosPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import ApprovalsPage from './pages/ApprovalsPage'
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
function ProtectedRoute({ children, requireAdmin = false, requireLeader = false }: { children: React.ReactNode, requireAdmin?: boolean, requireLeader?: boolean }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!user) return <Navigate to="/" replace />

  if (requireLeader && !['lider', 'vice'].includes(user.cargo)) {
    return <AcessoRestritoPage />
  }

  if (requireAdmin && !['lider', 'vice', 'ministro'].includes(user.cargo)) {
    return <AcessoRestritoPage />
  }

  return <>{children}</>
}

// ---------- APP PRINCIPAL ----------
function App() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  // Determina permissões com base no user (se existir)
  const isAdmin = user ? ['lider', 'vice', 'ministro'].includes(user.cargo) : false
  const isLeader = user ? ['lider', 'vice'].includes(user.cargo) : false

  return (
    <DataProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* ROTAS PÚBLICAS */}
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/escalas" replace /> : <LoginPage />
            } />
            <Route path="/registro" element={
              isAuthenticated ? <Navigate to="/escalas" replace /> : <RegisterPage />
            } />

            {/* ROTAS PROTEGIDAS COM LAYOUT */}
            <Route path="/*" element={
              <ProtectedRoute>
                <div style={{ display: 'flex' }}>
                  <Sidebar
                    userNick={user?.nick || ''}
                    userCargo={user?.cargo || ''}
                    isAdmin={isAdmin}
                    isLeader={isLeader}
                  />
                  <main style={{ flex: 1, marginLeft: '260px', padding: '32px 40px', background: '#080c14', minHeight: '100vh' }}>
                    <Routes>
                      <Route path="/escalas" element={<EscalasPage />} />
                      <Route path="/manual/:ministry" element={<ManualPage />} />

                      {/* Admin: Funções, Membros, Configurações */}
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

                      {/* Leader: Aprovações */}
                      <Route
                        path="/aprovacoes"
                        element={
                          <ProtectedRoute requireLeader={true}>
                            <ApprovalsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/escalas" replace />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </DataProvider>
  )
}

// ---------- WRAPPER COM PROVIDERS ----------
function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

export default AppWrapper