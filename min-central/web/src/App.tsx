// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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

// ---------- TIPOS ----------
interface AuthCheckResult {
  checking?: boolean;
  redirect?: string;
  forbidden?: boolean;
  user?: any;
}

// ---------- LOADING ----------
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

// ---------- ACESSO RESTRITO ----------
function AcessoRestritoPage() {
  const navigate = useNavigate()
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
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 600 }}>Acesso Restrito</h1>
      <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
        Apenas Líder e Vice-Líder têm acesso a esta página.
      </p>
      <button onClick={() => navigate('/escalas')} style={{
        padding: '12px 28px', background: '#1e3a5f', color: '#fff',
        border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer',
        fontSize: '13px', fontFamily: 'inherit', marginTop: '8px'
      }}>
        Voltar para Escalas
      </button>
    </div>
  )
}

// ---------- ROUTE GUARD ----------
function useRequireAuth(): AuthCheckResult {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return { checking: true }
  if (!user) return { redirect: '/?from=' + encodeURIComponent(location.pathname) }
  
  return { user }
}

function useRequireRole(role: 'admin' | 'leader'): AuthCheckResult {
  const auth = useRequireAuth()
  if (auth.checking || auth.redirect) return auth
  
  const { user } = auth
  if (!user) return { redirect: '/' }
  
  const isAdmin = ['lider', 'vice', 'ministro'].includes(user.cargo)
  const isLeader = ['lider', 'vice'].includes(user.cargo)
  
  if (role === 'leader' && !isLeader) return { forbidden: true }
  if (role === 'admin' && !isAdmin) return { forbidden: true }
  
  return { user }
}

// ---------- PÁGINAS COM GUARD ----------
function EscalasRoute() {
  const auth = useRequireAuth()
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  return <EscalasPage />
}

function ManualRoute() {
  const auth = useRequireAuth()
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  return <ManualPage />
}

function FuncoesRoute() {
  const auth = useRequireRole('admin')
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  if (auth.forbidden) return <AcessoRestritoPage />
  return <FuncoesPage />
}

function MembrosRoute() {
  const auth = useRequireRole('admin')
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  if (auth.forbidden) return <AcessoRestritoPage />
  return <MembrosPage />
}

function ConfiguracoesRoute() {
  const auth = useRequireRole('admin')
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  if (auth.forbidden) return <AcessoRestritoPage />
  return <ConfiguracoesPage />
}

function ApprovalsRoute() {
  const auth = useRequireRole('leader')
  if (auth.checking) return <LoadingScreen />
  if (auth.redirect) return <Navigate to={auth.redirect} replace />
  if (auth.forbidden) return <AcessoRestritoPage />
  return <ApprovalsPage />
}

// ---------- LAYOUT COM SIDEBAR ----------
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const isAdmin = user ? ['lider', 'vice', 'ministro'].includes(user.cargo) : false
  const isLeader = user ? ['lider', 'vice'].includes(user.cargo) : false

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        userNick={user?.nick || ''}
        userCargo={user?.cargo || ''}
        isAdmin={isAdmin}
        isLeader={isLeader}
      />
      <main style={{ 
        flex: 1, 
        marginLeft: '260px', 
        padding: '32px 40px', 
        background: '#080c14', 
        minHeight: '100vh' 
      }}>
        {children}
      </main>
    </div>
  )
}

// ---------- APP PRINCIPAL ----------
function AppRoutes() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <LoadingScreen />

  return (
    <DataProvider>
      <ToastProvider>
        <Routes>
          {/* PÚBLICAS - redireciona se já logado */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/escalas" replace /> : <LoginPage />
          } />
          <Route path="/registro" element={
            isAuthenticated ? <Navigate to="/escalas" replace /> : <RegisterPage />
          } />

          {/* PROTEGIDAS - com layout */}
          <Route path="/escalas" element={
            <AppLayout><EscalasRoute /></AppLayout>
          } />
          <Route path="/manual/:ministry" element={
            <AppLayout><ManualRoute /></AppLayout>
          } />
          <Route path="/funcoes" element={
            <AppLayout><FuncoesRoute /></AppLayout>
          } />
          <Route path="/membros" element={
            <AppLayout><MembrosRoute /></AppLayout>
          } />
          <Route path="/configuracoes" element={
            <AppLayout><ConfiguracoesRoute /></AppLayout>
          } />
          <Route path="/aprovacoes" element={
            <AppLayout><ApprovalsRoute /></AppLayout>
          } />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/escalas" : "/"} replace />} />
        </Routes>
      </ToastProvider>
    </DataProvider>
  )
}

// ---------- WRAPPER ----------
function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default AppWrapper