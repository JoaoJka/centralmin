import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ministryNames, ministryColors, roleLabels, modLabels, cargosSemMinisterio } from '../utils/constants';
import { Membro } from '../types';

const MembrosPage = () => {
  const { members, setMembers } = useData();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Membro | null>(null);
  const [formData, setFormData] = useState({ nick: '', cargo: 'estagiario' as Membro['cargo'], ministry: 'financas', disponivel: true, modLevel: 0 });

  const handleSave = () => {
    if (!formData.nick) {
      showToast('Digite o nick', 'error');
      return;
    }
    if (!editando && members.find(m => m.nick.toLowerCase() === formData.nick.toLowerCase())) {
      showToast('Nick já existe', 'error');
      return;
    }

    const newMember: Membro = {
      id: editando ? editando.id : Date.now(),
      nick: formData.nick,
      cargo: formData.cargo,
      ministry: cargosSemMinisterio.includes(formData.cargo) ? '' : formData.ministry,
      disponivel: formData.disponivel,
      modLevel: formData.modLevel
    };

    if (editando) {
      setMembers(prev => prev.map(m => m.id === editando.id ? newMember : m));
      showToast('Membro atualizado', 'success');
    } else {
      setMembers(prev => [...prev, newMember]);
      showToast('Membro adicionado', 'success');
    }
    setModalOpen(false);
    setEditando(null);
    resetForm();
  };

  const handleEdit = (member: Membro) => {
    setEditando(member);
    setFormData({
      nick: member.nick,
      cargo: member.cargo,
      ministry: member.ministry || 'financas',
      disponivel: member.disponivel,
      modLevel: member.modLevel
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast('Membro removido', 'info');
    }
  };

  const resetForm = () => {
    setFormData({ nick: '', cargo: 'estagiario', ministry: 'financas', disponivel: true, modLevel: 0 });
  };

  const filteredMembers = members.filter(m => {
    if (search && !m.nick.toLowerCase().includes(search.toLowerCase()) && !m.cargo.includes(search.toLowerCase())) return false;
    if (filter !== 'all' && m.cargo !== filter) return false;
    return true;
  });

  return (
    <div className="membros-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Membros</h2>
          <p>Gerencie a equipe ministerial</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditando(null); setModalOpen(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Membro
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" className="search-input" placeholder="Buscar por nick, cargo ou ministério..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-bar">
          {['all', 'lider', 'vice', 'ministro', 'estagiario'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : roleLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <div className="members-table-header">
          <div></div>
          <div>Nick</div>
          <div>Cargo</div>
          <div>Ministério</div>
          <div>Disponível</div>
          <div style={{ textAlign: 'right' }}>Ações</div>
        </div>
        {filteredMembers.map(m => (
          <div key={m.id} className="members-table-row">
            <div>
              <img src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${m.nick}&direction=4&head_direction=3&action=std&gesture=sml&size=m`} className="member-avatar" alt={m.nick} />
            </div>
            <div>
              <div className="member-name">{m.nick}</div>
              <div className="member-cargo">{!cargosSemMinisterio.includes(m.cargo) && ministryNames[m.ministry]}</div>
            </div>
            <div>
              <span className={`role-badge role-${m.cargo}`}>{roleLabels[m.cargo]}</span>
            </div>
            <div>
              {cargosSemMinisterio.includes(m.cargo)
                ? <span className="member-dash">—</span>
                : <span className="ministry-tag" style={{ background: `${ministryColors[m.ministry]}15`, color: ministryColors[m.ministry], border: `1px solid ${ministryColors[m.ministry]}30` }}>
                    {ministryNames[m.ministry]}
                  </span>
              }
            </div>
            <div>
              {m.disponivel
                ? <span className="status-badge status-concluido">Sim</span>
                : <span className="status-badge status-faltou">Não</span>
              }
            </div>
            <div className="actions">
              <button className="action-btn action-edit" onClick={() => handleEdit(m)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="action-btn action-delete" onClick={() => handleDelete(m.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="table-empty">
            <div className="table-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h4>Nenhum membro encontrado</h4>
            <p>Tente ajustar os filtros ou adicione um novo membro</p>
          </div>
        )}
      </div>

      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={() => setModalOpen(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editando ? 'Editar Membro' : 'Novo Membro'}</h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nick</label>
              <input type="text" className="form-input" value={formData.nick} onChange={e => setFormData({ ...formData, nick: e.target.value })} placeholder="Ex: ???JUKA" />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <select className="form-select" value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value as Membro['cargo'] })}>
                <option value="estagiario">Estagiário</option>
                <option value="ministro">Ministro</option>
                <option value="vice">Vice-Líder</option>
                <option value="lider">Líder</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ministério</label>
              <select className="form-select" value={formData.ministry} onChange={e => setFormData({ ...formData, ministry: e.target.value })} disabled={cargosSemMinisterio.includes(formData.cargo)} style={cargosSemMinisterio.includes(formData.cargo) ? { opacity: 0.5 } : {}}>
                {Object.entries(ministryNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Disponível</label>
              <select className="form-select" value={formData.disponivel ? 'true' : 'false'} onChange={e => setFormData({ ...formData, disponivel: e.target.value === 'true' })}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nível de Moderação</label>
              <select className="form-select" value={formData.modLevel} onChange={e => setFormData({ ...formData, modLevel: parseInt(e.target.value) })}>
                {[0, 1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l} - {modLabels[l]}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            {editando && <button className="btn btn-danger" onClick={() => handleDelete(editando.id)}>Remover Membro</button>}
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembrosPage;