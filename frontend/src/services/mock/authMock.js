import { usuarios, pacientes, medicos } from './db';

const SESSION_KEY = 'medtrack.mockSession';

const delay = () => new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 300));

// Junta USUARIO com a tabela do perfil e remove a senha: é o formato que a API deve devolver.
function toPublicUser(usuario) {
  const { senha: _senha, ...base } = usuario;
  const profileTable = base.tipo_usuario === 'medico' ? medicos : pacientes;
  const { id_usuario: _id, ...profile } =
    profileTable.find((row) => row.id_usuario === base.id_usuario) ?? {};
  let changes = {};
  try {
    changes = JSON.parse(localStorage.getItem(`medtrack.mockProfile.${base.id_usuario}`)) || {};
  } catch {}
  return { ...base, ...profile, ...changes };
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export async function login(email, senha) {
  await delay();
  const usuario = usuarios.find(
    (u) => toPublicUser(u).email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha,
  );
  if (!usuario) {
    throw { message: 'E-mail ou senha incorretos. Confira os dados e tente de novo.' };
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id_usuario: usuario.id_usuario }));
  return toPublicUser(usuario);
}

export async function logout() {
  await delay();
  localStorage.removeItem(SESSION_KEY);
}

export async function getCurrentUser() {
  await delay();
  const session = readSession();
  const usuario = session && usuarios.find((u) => u.id_usuario === session.id_usuario);
  return usuario ? toPublicUser(usuario) : null;
}

// No mock não há 401; mantém a mesma interface do adaptador da API.
export function onUnauthorized() {}

export async function updateProfile(data) {
  const user = await getCurrentUser();
  if (!user) throw { message: 'Entre novamente para editar o cadastro.', status: 401 };
  const email = data.email.trim().toLowerCase();
  if (
    usuarios.some(
      (item) => item.id_usuario !== user.id_usuario && toPublicUser(item).email === email,
    )
  ) {
    throw { message: 'E-mail já cadastrado.', status: 409 };
  }
  const changes = {
    nome: data.name.trim(),
    email,
    birthDate: data.birthDate || null,
    data_nascimento: data.birthDate || null,
    gender: data.gender || null,
    genderDescription: data.gender === 'self_described' ? data.genderDescription.trim() : '',
    specialty: user.tipo_usuario === 'medico' ? data.specialty.trim() : '',
    especialidade: user.tipo_usuario === 'medico' ? data.specialty.trim() : '',
    crm: user.tipo_usuario === 'medico' ? (data.crm || '').trim() : '',
    crmUf: user.tipo_usuario === 'medico' ? (data.crmUf || '').trim().toUpperCase() : '',
  };
  localStorage.setItem(`medtrack.mockProfile.${user.id_usuario}`, JSON.stringify(changes));
  return { ...user, ...changes };
}
