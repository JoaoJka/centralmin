// FuncoesPage.tsx - VERSÃO MÍNIMA DE TESTE

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const FuncoesPage = () => {
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await apiService.getFuncoes();
        console.log('Funções carregadas:', data);
        setFuncoes(data || []);
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Funções</h1>
      <p>Total: {funcoes.length}</p>
      {funcoes.map((f: any) => (
        <div key={f.id}>{f.nome}</div>
      ))}
    </div>
  );
};

export default FuncoesPage;