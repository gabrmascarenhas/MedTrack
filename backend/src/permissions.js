// O administrador acumula as permissões clínicas, sem alterar o perfil da sessão.
export const hasRole = (user, expected) =>
  Boolean(user && (user.role === expected || user.role === 'admin'));
export const ownsRecord = (user, ownerId) =>
  Boolean(user && (user.role === 'admin' || String(user._id) === String(ownerId)));
