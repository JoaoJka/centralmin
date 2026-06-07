import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ministryNames } from '../utils/constants';

interface SidebarProps {
  userNick: string;
  userCargo: string;
  isAdmin: boolean;
  isConvidado: boolean;
  onLogout: () => void;
}

const Sidebar = ({ userNick, userCargo, isAdmin, isConvidado, onLogout }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({
    escalas: true,
    manuais: false,
    administracao: false
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const toggleMenu = (menu: 'escalas' | 'manuais' | 'administracao') => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const manuaisList = [
    { key: 'financas', name: 'Finanças' },
    { key: 'administracao', name: 'Administração' },
    { key: 'contabilidade', name: 'Contabilidade' },
    { key: 'documentacao', name: 'Documentação' },
    { key: 'rh', name: 'RH' },
    { key: 'seguranca', name: 'Segurança' },
    { key: 'atualizacao', name: 'Atualização' }
  ];

  const menuIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const fileIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

  const settingsIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );

  const logoutIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const chevronDown = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const chevronRight = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  const cargoDisplay = userCargo ? userCargo.charAt(0).toUpperCase() + userCargo.slice(1) : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Instrutores</h1>
        <p className="sidebar-subtitle">Central Ministerial</p>
      </div>

      {/* PERFIL DO USUÁRIO */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <img
          src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${encodeURIComponent(userNick || 'Habbo')}&direction=4&head_direction=3&action=std&gesture=sml&size=s`}
          alt={userNick}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: '2px solid rgba(59,130,246,0.3)',
            background: '#0f172a'
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {userNick || 'Usuário'}
          </div>
          <div style={{
            color: isAdmin ? '#60a5fa' : isConvidado ? '#94a3b8' : '#64748b',
            fontSize: '11px',
            textTransform: 'capitalize'
          }}>
            {cargoDisplay || 'Convidado'}
            {isAdmin && ' (Admin)'}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sair"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ width: '16px', height: '16px', display: 'flex' }}>{logoutIcon}</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* ESCALAS */}
        <div className={`nav-group ${openMenus.escalas ? 'open' : ''}`}>
          <button className="nav-group-header" onClick={() => toggleMenu('escalas')}>
            <div className="nav-group-left">
              <span className="nav-group-icon">{menuIcon}</span>
              <span className="nav-group-title">Escalas</span>
            </div>
            <span className="nav-group-chevron">{openMenus.escalas ? chevronDown : chevronRight}</span>
          </button>
          <div className="nav-group-items">
            <button
              className={`nav-link ${isActive('/escalas') || isActive('/') ? 'active' : ''}`}
              onClick={() => navigate('/escalas')}
            >
              <span className="nav-link-dot" />
              <span className="nav-link-text">Escalas</span>
            </button>
          </div>
        </div>

        {/* MANUAIS */}
        <div className={`nav-group ${openMenus.manuais ? 'open' : ''}`}>
          <button className="nav-group-header" onClick={() => toggleMenu('manuais')}>
            <div className="nav-group-left">
              <span className="nav-group-icon">{fileIcon}</span>
              <span className="nav-group-title">Manuais</span>
            </div>
            <span className="nav-group-chevron">{openMenus.manuais ? chevronDown : chevronRight}</span>
          </button>
          <div className="nav-group-items">
            {manuaisList.map(({ key, name }) => (
              <button
                key={key}
                className={`nav-link ${isActive(`/manual/${key}`) ? 'active' : ''}`}
                onClick={() => navigate(`/manual/${key}`)}
              >
                <span className="nav-link-dot" />
                <span className="nav-link-text">{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ADMINISTRAÇÃO — SÓ MOSTRA SE FOR ADMIN */}
        {isAdmin && (
          <div className={`nav-group ${openMenus.administracao ? 'open' : ''}`}>
            <button className="nav-group-header" onClick={() => toggleMenu('administracao')}>
              <div className="nav-group-left">
                <span className="nav-group-icon">{settingsIcon}</span>
                <span className="nav-group-title">Administração</span>
              </div>
              <span className="nav-group-chevron">{openMenus.administracao ? chevronDown : chevronRight}</span>
            </button>
            <div className="nav-group-items">
              <button
                className={`nav-link ${isActive('/funcoes') ? 'active' : ''}`}
                onClick={() => navigate('/funcoes')}
              >
                <span className="nav-link-dot" />
                <span className="nav-link-text">Funções</span>
              </button>
              <button
                className={`nav-link ${isActive('/membros') ? 'active' : ''}`}
                onClick={() => navigate('/membros')}
              >
                <span className="nav-link-dot" />
                <span className="nav-link-text">Membros</span>
              </button>
              <button
                className={`nav-link ${isActive('/configuracoes') ? 'active' : ''}`}
                onClick={() => navigate('/configuracoes')}
              >
                <span className="nav-link-dot" />
                <span className="nav-link-text">Configurações</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="dev-avatars">
          <div className="dev-avatar">
            <img
              src="https://www.habbo.com.br/habbo-imaging/avatarimage?user=???JUKA&direction=4&head_direction=3&action=std&gesture=sml&size=l"
              alt="???JUKA"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="dev-avatar">
            <img
              src="https://www.habbo.com.br/habbo-imaging/avatarimage?user=Crebes&direction=4&head_direction=3&action=std&gesture=sml&size=l"
              alt="Crebes"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
        <span className="dev-label">Desenvolvido por</span>
        <span className="dev-names">???JUKA & Crebes</span>
      </div>
    </aside>
  );
};

export default Sidebar;