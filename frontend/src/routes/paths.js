export const ROLE_HOME = {
  admin: '/admin',
  paciente: '/paciente',
  medico: '/medico',
};

export const homeFor = (user) => ROLE_HOME[user?.tipo_usuario] ?? '/login';
