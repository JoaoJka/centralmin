import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { ministryNames, ministryColors, dayNamesShort } from '../utils/constants';
import { getWeeksOfMonth, formatDateFull } from '../utils/dateUtils';
import { Funcao } from '../types';

const FuncoesPage = () => {
  const { funcoes, setFuncoes, config } = useData();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Funcao | null>(null);
  const [formData, setFormData] = useState({ nome: '', ministry: 'financas', nivel: 'ministro', tipo: 'semanal' as 'semanal' | 'mensal' });
  const [selectedWeeks, setSelectedWeeks] = useState<{ semana: number; dias: number[] }[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const weeksOfMonth = useMemo(() => 
    getWeeksOfMonth(config.mesReferencia, config.anoReferencia),
    [config.mesReferencia, config.anoReferencia]
  );

  const daysInMonth = useMemo(() => {
    const count = new Date(config.anoReferencia, config.mesReferencia + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [config.mesReferencia, config.anoReferencia]);

  const selectedWeeksMap = useMemo(() => {
    const map = new Map<number, { semana: number; dias: number[] }>();
    selectedWeeks.forEach(w => map.set(w.semana, w));
    return map;
  }, [selectedWeeks]);

  const filteredFuncoes = useMemo(() => {
    if (!funcoes) return [];
    const searchLower = search.toLowerCase();
    return funcoes.filter(f => {
      if (search && !f.nome.toLowerCase().includes(searchLower) && !f.ministry.includes(searchLower)) return false;
      if (filter !== 'all' && f.ministry !== filter) return false;
      return true;
    });
  }, [funcoes, search, filter]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const carregarFuncoes = async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        setPageLoading(true);
        const data = await apiService.getFuncoes();
        setFuncoes(data || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showToast(err.message, 'error');
        }
      } finally {
        setPageLoading(false);
      }
    };
    carregarFuncoes();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [setFuncoes, showToast]);

  const handleSave = useCallback(async () => {
    if (!formData.nome) {
      showToast('Digite o nome da função', 'error');
      return;
    }

    const newFuncao: Funcao = {
      id: editando ? editando.id : Date.now(),
      nome: formData.nome,
      ministry: formData.ministry,
      nivel: formData.nivel as 'ministro' | 'estagiario',
      tipo: formData.tipo
    };

    if (formData.tipo === 'semanal') {
      const validWeeks = selectedWeeks.filter(w => w.dias.length > 0);
      if (validWeeks.length === 0) {
        showToast('Selecione pelo menos uma semana e um dia', 'error');
        return;
      }
      newFuncao.semanas = validWeeks;
    } else {
      if (selectedDays.length === 0) {
        showToast('Selecione pelo menos um dia do mês', 'error');
        return;
      }
      newFuncao.diasMes = [...selectedDays].sort((a, b) => a - b);
    }

    try {
      setLoading(true);
      if (editando) {
        await apiService.updateFuncao(editando.id, newFuncao);
        showToast('Função atualizada', 'success');
      } else {
        await apiService.createFuncao(newFuncao);
        showToast('Função criada', 'success');
      }
      const data = await apiService.getFuncoes();
      setFuncoes(data || []);
      setModalOpen(false);
      setEditando(null);
      resetForm();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, editando, selectedWeeks, selectedDays, setFuncoes, showToast]);

  const handleEdit = useCallback((funcao: Funcao) => {
    setEditando(funcao);
    setFormData({
      nome: funcao.nome,
      ministry: funcao.ministry,
      nivel: funcao.nivel,
      tipo: funcao.tipo
    });
    if (funcao.tipo === 'semanal' && funcao.semanas) {
      setSelectedWeeks(funcao.semanas);
      setSelectedDays([]);
    } else if (funcao.tipo === 'mensal' && funcao.diasMes) {
      setSelectedDays(funcao.diasMes);
      setSelectedWeeks([]);
    }
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta função?')) return;
    try {
      setLoading(true);
      await apiService.deleteFuncao(id);
      showToast('Função excluída', 'info');
      const data = await apiService.getFuncoes();
      setFuncoes(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [setFuncoes, showToast]);

  const resetForm = useCallback(() => {
    setFormData({ nome: '', ministry: 'financas', nivel: 'ministro', tipo: 'semanal' });
    setSelectedWeeks([]);
    setSelectedDays([]);
  }, []);

  const toggleWeek = useCallback((semanaIdx: number) => {
    setSelectedWeeks(prev => {
      const exists = prev.find(w => w.semana === semanaIdx);
      if (exists) {
        return prev.filter(w => w.semana !== semanaIdx);
      }
      return [...prev, { semana: semanaIdx, dias: [] }];
    });
  }, []);

  const toggleDayInWeek = useCallback((semanaIdx: number, dia: number) => {
    setSelectedWeeks(prev => prev.map(w => {
      if (w.semana !== semanaIdx) return w;
      const dias = w.dias.includes(dia) ? w.dias.filter(d => d !== dia) : [...w.dias, dia];
      return { ...w, dias };
    }));
  }, []);

  const toggleDayInMonth = useCallback((dia: number) => {
    setSelectedDays(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  }, []);

  if (pageLoading) {
    return <div className="loading-state">Carregando funções...</div>;
  }

  return (
    <div className="funcoes-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Funções</h2>
          <p>Gerencie todas as funções e seus agendamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditando(null); setModalOpen(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Função
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" className="search-input" placeholder="Buscar por nome ou ministério..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-bar">
          {['all', 'financas', 'administracao', 'contabilidade', 'documentacao', 'rh', 'seguranca', 'atualizacao'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todas' : ministryNames[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="funcoes-grid">
        {filteredFuncoes.map(f => (
          <div key={f.id} className="funcao-card">
            <div className="funcao-card-header">
              <div className="funcao-card-title">{f.nome}</div>
              <span className="funcao-card-ministry" style={{ background: `${ministryColors[f.ministry]}15`, color: ministryColors[f.ministry], border: `1px solid ${ministryColors[f.ministry]}30` }}>
                {ministryNames[f.ministry]}
              </span>
            </div>
            <div className="funcao-card-details">
              <div className="funcao-card-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                {f.nivel === 'ministro' ? 'Ministro' : 'Estagiário'}
              </div>
              <div className="funcao-card-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {f.tipo === 'semanal' ? 'Semanal' : 'Mensal'}
              </div>
            </div>
            <div className="funcao-card-schedule">
              {f.tipo === 'semanal' && f.semanas
                ? f.semanas.map(s => `Semana ${s.semana + 1}: ${s.dias.map(d => dayNamesShort[d]).join(', ')}`).join('; ')
                : f.tipo === 'mensal' && f.diasMes
                  ? `Todo dia ${f.diasMes.join(', ')} do mês`
                  : ''
              }
            </div>
            <div className="funcao-card-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(f)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(f.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Excluir
              </button>
            </div>
          </div>
        ))}
        {filteredFuncoes.length === 0 && (
          <div className="funcoes-empty">
            <div className="funcoes-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h4>Nenhuma função encontrada</h4>
            <p>Crie uma nova função para começar</p>
          </div>
        )}
      </div>

      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={() => setModalOpen(false)}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editando ? 'Editar Função' : 'Nova Função'}</h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome da Função</label>
              <input type="text" className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Limpeza do Templo..." />
            </div>
            <div className="form-group">
              <label className="form-label">Ministério</label>
              <select className="form-select" value={formData.ministry} onChange={e => setFormData({ ...formData, ministry: e.target.value })}>
                {Object.entries(ministryNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <div className="funcao-type-selector">
                <button type="button" className={`funcao-type-btn ${formData.nivel === 'ministro' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, nivel: 'ministro' })}>Ministro</button>
                <button type="button" className={`funcao-type-btn ${formData.nivel === 'estagiario' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, nivel: 'estagiario' })}>Estagiário</button>
              </div>
              <div className="form-hint">A função será atribuída automaticamente a um membro disponível deste nível no ministério</div>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Recorrência</label>
              <div className="funcao-type-selector">
                <button type="button" className={`funcao-type-btn ${formData.tipo === 'semanal' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, tipo: 'semanal' })}>Dia(s) da Semana</button>
                <button type="button" className={`funcao-type-btn ${formData.tipo === 'mensal' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, tipo: 'mensal' })}>Dia(s) do Mês</button>
              </div>
            </div>
            {formData.tipo === 'semanal' ? (
              <div className="form-group">
                <label className="form-label">Selecione as Semanas e Dias</label>
                <div className="weeks-selector-container">
                  {weeksOfMonth.map((week, idx) => {
                    const weekData = selectedWeeksMap.get(idx);
                    return (
                      <div key={idx} className={`week-option ${weekData ? 'selected' : ''}`} onClick={() => toggleWeek(idx)}>
                        <div className="week-option-checkbox">
                          {weekData && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="week-option-info">
                          <div className="week-option-label">Semana {week.weekNumber}</div>
                          <div className="week-option-dates">{formatDateFull(week.sunday)} — {formatDateFull(week.saturday)}</div>
                          <div className="week-option-days">
                            {[...Array(7)].map((_, d) => (
                              <div key={d} className={`week-day-chip ${weekData?.dias.includes(d) ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDayInWeek(idx, d); }}>
                                {dayNamesShort[d]} {new Date(week.sunday).getDate() + d}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Selecione os Dias do Mês</label>
                <div className="monthly-days-grid">
                  {daysInMonth.map(d => (
                    <button key={d} type="button" className={`monthly-day-chip ${selectedDays.includes(d) ? 'selected' : ''}`} onClick={() => toggleDayInMonth(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{editando ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuncoesPage;