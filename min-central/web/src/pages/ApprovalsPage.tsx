import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';

interface Pendente {
  fbKey: string;
  nick: string;
  codigoVerificacao: string;
  criadoEm: number;
}

const ApprovalsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargoSelecionado, setCargoSelecionado] = useState<Record<string, string>>({});

  const cargoNormalizado = user?.cargo?.toLowerCase() || '';
  const podeAprovar = ['lider', 'vice'].includes(cargoNormalizado);

  const carregarPendentes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPendentes();
      setPendentes(data.pendentes || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (podeAprovar) {
      carregarPendentes();
    }
  }, [podeAprovar]);

  const handleAprovar = async (uid: string) => {
    const cargo = cargoSelecionado[uid] || 'estagiario';
    try {
      const data = await apiService.approveCadastro(uid, cargo);
      showToast(data.mensagem, 'success');
      carregarPendentes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejeitar = async (uid: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) return;
    try {
      const data = await apiService.rejectCadastro(uid);
      showToast(data.mensagem || 'Cadastro rejeitado', 'info');
      carregarPendentes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResetSenha = async (nick: string) => {
    const novaSenha = prompt(`Digite a nova senha para ${nick}:`);
    if (!novaSenha || novaSenha.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }
    try {
      const data = await apiService.resetPassword(nick, novaSenha);
      showToast(data.mensagem, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (!podeAprovar) {
    return (
      <div className="page-content">
        <div className="error-state">
          <h3>Acesso negado</h3>
          <p>Apenas Líder e Vice-Líder podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">
          <h2>Aprovações</h2>
          <p>Gerencie cadastros pendentes e senhas</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Carregando...</div>
      ) : pendentes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h4>Nenhum cadastro pendente</h4>
          <p>Todos os cadastros foram processados</p>
        </div>
      ) : (
        <div className="approvals-list">
          {pendentes.map(p => (
            <div key={p.fbKey} className="approval-card">
              <div className="approval-info">
                <img
                  src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${p.nick}&direction=4&head_direction=3&action=std&gesture=sml&size=m`}
                  alt={p.nick}
                  className="approval-avatar"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="approval-details">
                  <div className="approval-nick">{p.nick}</div>
                  <div className="approval-meta">
                    Código: {p.codigoVerificacao}<br/>
                    Enviado: {new Date(p.criadoEm).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <div className="approval-actions">
                <select
                  className="form-select"
                  value={cargoSelecionado[p.fbKey] || 'estagiario'}
                  onChange={e => setCargoSelecionado(prev => ({ ...prev, [p.fbKey]: e.target.value }))}
                >
                  <option value="estagiario">Estagiário</option>
                  <option value="ministro">Ministro</option>
                  <option value="vice">Vice-Líder</option>
                </select>
                <button className="btn btn-success" onClick={() => handleAprovar(p.fbKey)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Aprovar
                </button>
                <button className="btn btn-danger" onClick={() => handleRejeitar(p.fbKey)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Rejeitar
                </button>
                <button className="btn btn-secondary" onClick={() => handleResetSenha(p.nick)} title="Trocar senha">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .approvals-list { display: flex; flex-direction: column; gap: 12px; }
        .approval-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .approval-info { display: flex; align-items: center; gap: 16px; }
        .approval-avatar { width: 48px; height: 48px; border-radius: 8px; }
        .approval-nick { font-size: 16px; font-weight: 600; color: #e2e8f0; }
        .approval-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
        .approval-actions { display: flex; gap: 8px; align-items: center; }
        .approval-actions .form-select { width: 140px; padding: 8px 12px; font-size: 13px; }
        .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }
        .empty-icon svg { width: 48px; height: 48px; margin-bottom: 16px; }
        .error-state { text-align: center; padding: 60px 20px; color: #ef4444; }
      `}</style>
    </div>
  );
};

export default ApprovalsPage;