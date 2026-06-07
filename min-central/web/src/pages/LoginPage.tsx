import { useState, useEffect } from 'react';  // ✅ Adicionado useEffect
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [nick, setNick] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ CORRIGIDO: useEffect importado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/escalas', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nick || !senha) {
      showToast('Preencha nick e senha', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(nick, senha);
      showToast('Login realizado com sucesso!', 'success');
      navigate('/escalas', { replace: true });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img
            src="https://www.habbo.com.br/habbo-imaging/badge/b09064s43131s50134s17113s171153f3edc7f555be912c2392e285b05bd34.gif"
            alt="INS"
            width="64"
            height="64"
          />
        </div>
        <h1 className="auth-title">[INS] Central Ministerial</h1>
        <p className="auth-subtitle">Faça login para acessar o sistema</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Nick do Habbo</label>
            <input
              type="text"
              className="form-input"
              value={nick}
              onChange={e => setNick(e.target.value)}
              placeholder="Ex: ???JUKA"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Primeiro acesso?</p>
          <button className="btn btn-link" onClick={() => navigate('/registro')}>
            Cadastre-se com código da missão
          </button>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080c14;
          padding: 20px;
        }
        .auth-container {
          width: 100%;
          max-width: 400px;
          background: #0f172a;
          border: 1px solid #1e3a5f;
          border-radius: 16px;
          padding: 40px 32px;
          text-align: center;
        }
        .auth-logo {
          margin-bottom: 16px;
        }
        .auth-logo img {
          border-radius: 12px;
        }
        .auth-title {
          font-size: 22px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 4px;
        }
        .auth-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 28px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }
        .btn-block {
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          font-size: 14px;
        }
        .auth-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #1e293b;
        }
        .auth-footer p {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .btn-link {
          background: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-link:hover {
          background: #3b82f6;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;