import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { useEscalas } from '../hooks/useEscalas';
import { formatDateBR, formatDateFull } from '../utils/dateUtils';
import { ministryNames, ministryColors, dayNames } from '../utils/constants';
import { Escala } from '../types';

const EscalasPage = () => {
  const { escalas, config, setEscalas } = useData();
  const { showToast } = useToast();
  const { escalaWeekOffset, escalaTab, setEscalaTab, changeWeek, goToToday, getWeekDates, loading } = useEscalas();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [actionType, setActionType] = useState<'concluir' | 'justificar'>('concluir');
  const [comprovacao, setComprovacao] = useState('');
  const [justificativa, setJustificativa] = useState('');

  const { sunday } = getWeekDates(escalaWeekOffset);

  const openModal = (escala: Escala, type: 'concluir' | 'justificar') => {
    setSelectedEscala(escala);
    setActionType(type);
    setComprovacao(escala.comprovacao || '');
    setJustificativa(escala.justificativa || '');
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedEscala) return;
    
    if (actionType === 'concluir') {
      if (!comprovacao && !config.conclusaoSemComp) {
        showToast('Insira a comprovação', 'error');
        return;
      }
      selectedEscala.status = 'concluido';
      selectedEscala.comprovacao = comprovacao;
      showToast('Função concluída com sucesso', 'success');
    } else {
      if (!justificativa) {
        showToast('Insira o motivo da justificativa', 'error');
        return;
      }
      selectedEscala.status = 'justificado';
      selectedEscala.justificativa = justificativa;
      showToast('Justificativa registrada', 'info');
    }
    
    setEscalas(prev => prev.map(e => e.id === selectedEscala.id ? selectedEscala : e));
    setModalOpen(false);
    setSelectedEscala(null);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'justificado': return 'Justificado';
      case 'faltou': return 'Faltou';
      default: return 'Pendente';
    }
  };

  return (
    <div className="escalas-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Escalas</h2>
          <p>Visualize as escalas do mês</p>
        </div>
      </div>

      <div className="week-nav-bar">
        <div className="week-nav-info">
          <div className="week-nav-label">Semana {escalaWeekOffset + 1}</div>
          <div className="week-nav-range">
            {formatDateFull(getWeekDates(escalaWeekOffset).sunday)} — {formatDateFull(getWeekDates(escalaWeekOffset).saturday)}
          </div>
        </div>
        <div className="week-nav-actions">
          <button className="week-nav-btn" onClick={() => changeWeek(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="week-nav-btn week-nav-btn-today" onClick={goToToday}>Hoje</button>
          <button className="week-nav-btn" onClick={() => changeWeek(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="tabs">
        {['todas', 'financas', 'administracao', 'contabilidade', 'documentacao', 'rh', 'seguranca', 'atualizacao'].map(tab => (
          <button key={tab} className={`tab ${escalaTab === tab ? 'active' : ''}`} onClick={() => setEscalaTab(tab)}>
            {tab === 'todas' ? 'Todas' : ministryNames[tab]}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="escala-table-header">
          <div></div>
          <div>Data</div>
          <div>Função / Responsável</div>
          <div>Ministério</div>
          <div>Situação</div>
          <div style={{ textAlign: 'right' }}>Ações</div>
        </div>
        <div className="escala-table-body">
          {loading ? (
            <div className="loading-state">Carregando escalas...</div>
          ) : (
            [...Array(7)].map((_, i) => {
              const date = new Date(sunday);
              date.setDate(sunday.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const dayEscalas = escalas.filter(e => e.data === dateStr && (escalaTab === 'todas' || e.ministry === escalaTab));
              
              if (dayEscalas.length === 0) return null;
              
              return dayEscalas.map(e => (
                <div key={e.id} className={`escala-table-row ${isToday ? 'today' : ''}`}>
                  <div>
                    <img 
                      src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${e.responsavel}&direction=4&head_direction=3&action=std&gesture=sml&size=m`} 
                      className="escala-avatar" 
                      alt={e.responsavel}
                      onError={(img) => { (img.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div className="day-name">{dayNames[i]}{isToday && <span className="day-today">Hoje</span>}</div>
                    <div className="day-date">{formatDateBR(date)}</div>
                  </div>
                  <div>
                    <div className="escala-funcao">{e.funcaoNome}</div>
                    <div className="escala-responsavel">
                      {e.responsavel}
                      <span className="escala-nivel" style={{ 
                        background: e.nivel === 'ministro' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)', 
                        color: e.nivel === 'ministro' ? '#60a5fa' : '#94a3b8' 
                      }}>
                        {e.nivel === 'ministro' ? 'Ministro' : 'Estagiário'}
                      </span>
                    </div>
                    {e.status === 'concluido' && e.comprovacao && (
                      <div className="escala-comprovacao">
                        <a href={e.comprovacao} target="_blank" rel="noopener noreferrer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          Ver comprovação
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="ministry-tag" style={{ 
                      background: `${ministryColors[e.ministry]}15`, 
                      color: ministryColors[e.ministry], 
                      border: `1px solid ${ministryColors[e.ministry]}30` 
                    }}>
                      {ministryNames[e.ministry]}
                    </span>
                  </div>
                  <div>
                    <span className={`status-badge status-${e.status}`}>{getStatusDisplay(e.status)}</span>
                  </div>
                  <div className="actions">
                    {e.status === 'pendente' && (
                      <>
                        <button className="action-btn action-success" onClick={() => openModal(e, 'concluir')} title="Concluir">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button className="action-btn action-info" onClick={() => openModal(e, 'justificar')} title="Justificar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ));
            })
          )}
        </div>
      </div>

      {/* Modal de Ação */}
      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={() => setModalOpen(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{actionType === 'concluir' ? 'Concluir Função' : 'Justificar Falta'}</h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Data</label>
              <input type="text" className="form-input" value={selectedEscala?.data || ''} readOnly style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Função</label>
              <input type="text" className="form-input" value={selectedEscala?.funcaoNome || ''} readOnly style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <input type="text" className="form-input" value={selectedEscala?.responsavel || ''} readOnly style={{ opacity: 0.6 }} />
            </div>
            {actionType === 'concluir' ? (
              <div className="form-group">
                <label className="form-label">Comprovação (link ou descrição)</label>
                <textarea 
                  className="form-textarea" 
                  value={comprovacao} 
                  onChange={e => setComprovacao(e.target.value)} 
                  placeholder="Cole o link da comprovação ou descreva o que foi feito..."
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Motivo da justificativa</label>
                <textarea 
                  className="form-textarea" 
                  value={justificativa} 
                  onChange={e => setJustificativa(e.target.value)} 
                  placeholder="Descreva o motivo da não entrega..."
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-success" onClick={confirmAction}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalasPage;