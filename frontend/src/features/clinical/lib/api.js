import http from '../../../services/api';

// Mantém a assinatura dos componentes recuperados usando o cliente autenticado atual.
export async function api(path, method = 'GET', payload) {
  const { data } = await http.request({
    url: path.replace(/^\/api(?=\/|$)/, ''),
    method,
    data: payload,
  });
  return data;
}
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const dateBR = (value) =>
  value
    ? new Date(`${value}T12:00:00`)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        .replaceAll('.', '')
    : '—';
export const whenBR = (value) => (value ? new Date(value).toLocaleString('pt-BR') : '—');
export const schedule = (item) =>
  item.date && item.time ? `${dateBR(item.date)} · ${item.time}` : 'Aguardando definição do médico';
export const isPending = (item) => ['Solicitada', 'Remarcação solicitada'].includes(item.status);
export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
export const badgeClass = (item) =>
  item.status === 'Aceito'
    ? 'complete'
    : isPending(item)
      ? 'pending'
      : item.status === 'Cancelada'
        ? 'cancelled'
        : 'finished';
