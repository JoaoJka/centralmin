import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [nick, setNick] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const gerarCodigo = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `[RCC] ${result}`;
  };

  const [codigoGerado] = useState(() => gerarCodigo());

  const handleVerificar = async () => {
    if (!nick) {
      showToast('Digite seu nick do Habbo', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(nick)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) throw new Error('Nick não encontrado no Habbo');
      const data = await res.json();
      if (!data.name) throw new Error('Nick não encontrado no Habbo');
      setStep(2);
      showToast('Nick verificado! Agora configure sua missão.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao verificar nick', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrar = async () => {
    if (!codigo) {
      showToast('Digite o código da missão', 'error');
      return;
    }
    if (!senha || senha.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }
    if (senha !== confirmarSenha) {
      showToast('Senhas não conferem', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick, codigo, senha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.mensagem, 'success');
      setStep(3);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <img
            src="https://www.habbo.com.br/habbo-imaging/badge/b09064s43131s50134s17113s171153f3edc7f555be912c2392e285b05bd34.gif"
            alt="INS"
            width="64"
            height="64"
          />
        </div>
        <h1 className="auth-title">Bem-vindo!</h1>
        <p className="auth-subtitle">Primeiro acesso? Cadastre-se abaixo</p>

        {step === 1 && (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Nick do Habbo</label>
              <input
                type="text"
                className="form-input"
                value={nick}
                onChange={e => setNick(e.target.value)}
                placeholder="Ex: ???JUKA"
              />
              <div className="form-hint">Digite exatamente como aparece no jogo</div>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleVerificar} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Nick'}
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => navigate('/')} style={{ marginTop: 8 }}>
              Já tenho conta
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="auth-form">
            <div className="codigo-box">
              <div className="codigo-label">Seu código de verificação</div>
              <div className="codigo-valor">{codigoGerado}</div>
              <div className="codigo-instrucao">
                1. Abra o Habbo<br/>
                2. Vá em seu perfil<br/>
                3. Altere sua missão para exatamente o código acima<br/>
                4. Aguarde 1-2 minutos e clique em "Já coloquei"
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Código da missão (para confirmação)</label>
              <input
                type="text"
                className="form-input"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Cole aqui o código da missão"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input
                type="password"
                className="form-input"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleCadastrar} disabled={loading}>
              {loading ? 'Cadastrando...' : 'Já coloquei - Cadastrar'}
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => setStep(1)} style={{ marginTop: 8 }}>
              Voltar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="success-box">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>Cadastro enviado!</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              Seu cadastro foi enviado e está aguardando aprovação da liderança.<br/>
              Você receberá acesso assim que for aprovado.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
              Ir para Login
            </button>
          </div>
        )}

        <style>{`
          .codigo-box {
            background: #1e3a5f;
            border: 1px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
          }
          .codigo-label {
            font-size: 12px;
            color: #93c5fd;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .codigo-valor {
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            font-family: monospace;
            background: #0f172a;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            border: 1px dashed #3b82f6;
          }
          .codigo-instrucao {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.8;
            text-align: left;
          }
          .success-box {
            text-align: center;
            padding: 20px 0;
          }
          .success-icon {
            margin-bottom: 16px;
          }
          .form-hint {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .btn-secondary {
            background: #1e293b;
            border: 1px solid #334155;
            color: #94a3b8;
          }
          .btn-secondary:hover {
            background: #334155;
            color: #e2e8f0;
          }
        `}</style>
      </div>
    </div>
  );
};

export default RegisterPage;