import { CalendarClock, CircleCheck, CircleX, ClipboardCheck } from 'lucide-react';

// Cor + ícone + texto: o status continua legível para quem não distingue cores
const STATUS = {
  agendada: { label: 'Agendada', icon: CalendarClock },
  preparada: { label: 'Preparada', icon: ClipboardCheck },
  realizada: { label: 'Realizada', icon: CircleCheck },
  cancelada: { label: 'Cancelada', icon: CircleX },
};

export default function StatusBadge({ status }) {
  const config = STATUS[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`status-badge status-badge--${status}`}>
      <Icon size={14} aria-hidden="true" />
      {config.label}
    </span>
  );
}
