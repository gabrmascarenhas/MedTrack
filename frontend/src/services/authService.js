// Ponto único de autenticação para telas e contextos. Escolhe a implementação (mock ou API)
// uma vez, e as duas têm a mesma interface: trocar o mock pela API não muda nenhuma tela.
import api, { setUnauthorizedHandler } from './api';
import * as authMock from './mock/authMock';
import { DEMO_CREDENTIALS } from './mock/db';

// Adapta o contrato da API ao formato usado pelas telas existentes.
const toScreenUser = (user) =>
  user
    ? {
        ...user,
        id_usuario: user.id,
        nome: user.name,
        data_nascimento: user.birthDate,
        especialidade: user.specialty,
        tipo_usuario: { doctor: 'medico', patient: 'paciente', admin: 'admin' }[user.role],
      }
    : null;

const authApi = {
  async login(email, senha) {
    const { data } = await api.post('/auth/login', { email, password: senha });
    return toScreenUser(data.user);
  },
  async register(name, email, password, role, details = {}) {
    const { data } = await api.post('/auth/register', { name, email, password, role, ...details });
    return toScreenUser(data.user);
  },
  async updateProfile(profile) {
    const { data } = await api.patch('/profile', profile);
    return toScreenUser(data.user);
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async getCurrentUser() {
    try {
      const { data } = await api.get('/auth/me');
      return toScreenUser(data.user);
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  },
  onUnauthorized: setUnauthorizedHandler,
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const impl = useMock ? authMock : authApi;

export const login = (email, senha) => impl.login(email, senha);
export const logout = () => impl.logout();
export const getCurrentUser = () => impl.getCurrentUser();
export const onUnauthorized = (handler) => impl.onUnauthorized(handler);

// TEMPORÁRIO – substituído no Prompt 02. Atalhos de login demo; com a API real,
// só funcionam se o back-end tiver esses usuários de seed.
export const demoCredentials = DEMO_CREDENTIALS;

export const useMockAuth = useMock;
export const register = (name, email, password, role, details) =>
  authApi.register(name, email, password, role, details);
export const updateProfile = (profile) => impl.updateProfile(profile);
