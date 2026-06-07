import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { getCurrentCargo, podeAcessarConfig } from '../utils/auth';

const ConfiguracoesPage = () => {
  const cargo = getCurrentCargo();
  if (!podeAcessarConfig(cargo)) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '16px'
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
        <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 600 }}>Acesso Restrito</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Apenas Líder e Vice-Líder podem acessar configurações.</p>
      </div>
    );
  }

  const { config, setConfig } = useData();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await apiService.updateConfig(config);
      setConfig(updated);
      showToast('Configurações salvas', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleConfig = (key: keyof typeof config, value: boolean | number | number[]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="config-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Configurações</h2>
          <p>Personalize a Central Ministerial</p>
        </div>
      </div>

      <div className="config-grid">
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4>Escalas</h4>
          </div>
          <div className="config-row">
            <div>
              <div className="config-row-label">Permitir conclusão sem comprovação</div>
              <div className="config-row-desc">Membros podem marcar função como concluída sem link de comprovação</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.conclusaoSemComp} onChange={e => toggleConfig('conclusaoSemComp', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="config-row">
            <div>
              <div className="config-row-label">Notificar faltas automaticamente</div>
              <div className="config-row-desc">Enviar alerta quando um membro faltar a escala</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.notificarFaltas} onChange={e => toggleConfig('notificarFaltas', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h4>Mês e Semanas</h4>
          </div>
          <div className="config-row">
            <div>
              <div className="config-row-label">Mês de referência</div>
              <div className="config-row-desc">Define o mês atual para geração das escalas</div>
            </div>
            <select className="form-select" value={config.mesReferencia} onChange={e => toggleConfig('mesReferencia', parseInt(e.target.value))}>
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="config-row">
            <div>
              <div className="config-row-label">Ano</div>
              <div className="config-row-desc">Ano de referência para as escalas</div>
            </div>
            <input type="number" className="form-input" style={{ width: 100 }} value={config.anoReferencia} onChange={e => toggleConfig('anoReferencia', parseInt(e.target.value))} min={2024} max={2030} />
          </div>
          <div className="config-row config-row-vertical">
            <div>
              <div className="config-row-label">Semanas ativas</div>
              <div className="config-row-desc">Selecione quais semanas do mês serão exibidas nas escalas</div>
            </div>
            <div className="weeks-toggle-grid">
              {[1, 2, 3, 4, 5].map(w => (
                <label key={w} className="week-toggle">
                  <input type="checkbox" checked={config.semanasAtivas.includes(w)} onChange={e => {
                    const novas = e.target.checked ? [...config.semanasAtivas, w] : config.semanasAtivas.filter(s => s !== w);
                    toggleConfig('semanasAtivas', novas);
                  }} />
                  <span>Semana {w}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="config-card">
          <div className="config-card-header">
            <div className="config-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h4>Permissões de Manuais</h4>
          </div>
          <div className="config-row">
            <div>
              <div className="config-row-label">Permitir edição por ministros</div>
              <div className="config-row-desc">Ministros e acima podem editar manuais. Estagiários podem apenas visualizar</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.manualMinistro} onChange={e => toggleConfig('manualMinistro', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="config-save-bar">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;