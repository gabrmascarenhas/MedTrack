// Dados fictícios no formato do MER (USUARIO 1–0..1 PACIENTE | MEDICO).
// `senha` existe só aqui para o mock conferir o login; nunca sai deste arquivo.

export const usuarios = [
  {
    id_usuario: 1,
    nome: 'Ana Ribeiro',
    email: 'paciente@exemplo.com',
    senha: 'demo123',
    tipo_usuario: 'paciente',
  },
  {
    id_usuario: 2,
    nome: 'Helena Duarte',
    email: 'medico@exemplo.com',
    senha: 'demo123',
    tipo_usuario: 'medico',
  },
];

export const pacientes = [{ id_paciente: 1, id_usuario: 1, data_nascimento: '1987-04-12' }];

export const medicos = [
  { id_medico: 1, id_usuario: 2, especialidade: 'Clínica geral', crm: 'CRM-BA 123456' },
];

export const DEMO_CREDENTIALS = {
  paciente: { email: 'paciente@exemplo.com', senha: 'demo123' },
  medico: { email: 'medico@exemplo.com', senha: 'demo123' },
};
