import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ministryNames, ministryColors } from '../utils/constants';
import { useToast } from '../contexts/ToastContext';
import { getCurrentCargo, podeEditarManuais } from '../utils/auth';
import { useData } from '../contexts/DataContext';

const ManualPage = () => {
  const { ministry } = useParams<{ ministry: string }>();
  const { showToast } = useToast();
  const { config } = useData();
  const [manual, setManual] = useState({ titulo: `Manual de ${ministryNames[ministry || '']}`, conteudo: '', atualizado: 'Nunca' });
  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState(manual.titulo);
  const [editConteudo, setEditConteudo] = useState(manual.conteudo);

  const cargo = getCurrentCargo();
  const podeEditar = podeEditarManuais(cargo, config.manualMinistro);

  const handleSave = () => {
    setManual({ titulo: editTitulo, conteudo: editConteudo, atualizado: new Date().toISOString().split('T')[0] });
    setEditando(false);
    showToast('Manual salvo com sucesso!', 'success');
  };

  const handleCancel = () => {
    setEditTitulo(manual.titulo);
    setEditConteudo(manual.conteudo);
    setEditando(false);
  };

  const ministryName = ministryNames[ministry || ''] || 'Ministério';
  const ministryColor = ministryColors[ministry || ''] || '#3b82f6';

  return (
    <div className="manual-page">
      <div className="manual-header">
        <div className="manual-header-left">
          <div className="manual-breadcrumb">
            <span>Manuais</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ color: ministryColor }}>{ministryName}</span>
          </div>
          {editando ? (
            <input type="text" className="manual-title-input" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} />
          ) : (
            <h1 className="manual-title">{manual.titulo}</h1>
          )}
          <div className="manual-meta">
            <span className="manual-tag" style={{ color: ministryColor, borderColor: `${ministryColor}40`, background: `${ministryColor}10` }}>
              {ministryName}
            </span>
            <span className="manual-updated">Atualizado em {manual.atualizado}</span>
          </div>
        </div>
        <div className="manual-header-actions">
          {editando ? (
            <>
              <button className="manual-btn manual-btn-secondary" onClick={handleCancel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancelar
              </button>
              <button className="manual-btn manual-btn-primary" onClick={handleSave}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Salvar
              </button>
            </>
          ) : (
            podeEditar && (
              <button className="manual-btn manual-btn-primary" onClick={() => setEditando(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
            )
          )}
        </div>
      </div>

      <div className="manual-body">
        {editando ? (
          <div className="manual-editor">
            <div className="manual-editor-toolbar">
              <button className="toolbar-btn" title="Negrito"><b>B</b></button>
              <button className="toolbar-btn" title="Itálico"><i>I</i></button>
              <button className="toolbar-btn" title="Título">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12h8M4 18V6M12 18V6M17 12h3m0 0v6m0-6l-4-4"/>
                </svg>
              </button>
              <button className="toolbar-btn" title="Lista">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <div className="toolbar-divider" />
              <span className="toolbar-count">{editConteudo.length} caracteres</span>
            </div>
            <textarea className="manual-textarea" value={editConteudo} onChange={e => setEditConteudo(e.target.value)} placeholder="Digite o conteúdo do manual aqui..." spellCheck={false} />
          </div>
        ) : (
          <div className="manual-viewer">
            {manual.conteudo ? (
              <div className="manual-rendered">{manual.conteudo}</div>
            ) : (
              <div className="manual-empty">
                <div className="manual-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <h3>Manual vazio</h3>
                <p>Este manual ainda não possui conteúdo. {podeEditar ? 'Clique em "Editar" para começar a escrever.' : 'Apenas ministros podem editar manuais.'}</p>
                {podeEditar && (
                  <button className="manual-btn manual-btn-primary" onClick={() => setEditando(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Escrever Manual
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualPage;