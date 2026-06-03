export const ministryNames: Record<string, string> = {
  financas: 'Finanças',
  administracao: 'Administração',
  contabilidade: 'Contabilidade',
  documentacao: 'Documentação',
  rh: 'Recursos Humanos',
  seguranca: 'Segurança',
  atualizacao: 'Atualização'
};

export const ministryColors: Record<string, string> = {
  financas: '#60a5fa',
  administracao: '#a78bfa',
  contabilidade: '#34d399',
  documentacao: '#fbbf24',
  rh: '#f472b6',
  seguranca: '#fb923c',
  atualizacao: '#22d3ee'
};

export const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const roleLabels: Record<string, string> = {
  lider: 'Líder',
  vice: 'Vice-Líder',
  ministro: 'Ministro',
  estagiario: 'Estagiário'
};

export const modLabels: Record<number, string> = {
  0: 'Sem poderes',
  1: 'Visualizar',
  2: 'Concluir',
  3: 'Editar manuais',
  4: 'Gerenciar',
  5: 'Admin total'
};

export const cargosSemMinisterio = ['lider', 'vice'];