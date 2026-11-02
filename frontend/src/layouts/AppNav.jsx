import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { CalendarDays, ClipboardList, House, LogOut } from 'lucide-react';
import { formatCrm } from '../services/profile';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Administração', icon: House, end: true },
    { to: '/paciente', label: 'Área do paciente', icon: House, end: true },
    { to: '/paciente/consultas', label: 'Consultas', icon: ClipboardList },
    { to: '/medico', label: 'Área do médico', icon: House, end: true },
    { to: '/medico/agenda', label: 'Agenda', icon: CalendarDays },
  ],
  paciente: [
    { to: '/paciente', label: 'Início', icon: House, end: true },
    { to: '/paciente/consultas', label: 'Minhas consultas', icon: ClipboardList },
  ],
  medico: [
    { to: '/medico', label: 'Início', icon: House, end: true },
    { to: '/medico/agenda', label: 'Agenda', icon: CalendarDays },
  ],
};

export function NavLinks({ onNavigate }) {
  const { user } = useAuth();
  const items = [
    ...(NAV_BY_ROLE[user?.tipo_usuario] ?? []),
    {
      to: `${{ paciente: '/paciente', medico: '/medico', admin: '/admin' }[user?.tipo_usuario]}/cadastro`,
      label: 'Meu cadastro',
      icon: ClipboardList,
    },
  ];

  return (
    <ul className="app-nav">
      {items.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          {/* NavLink aplica .active e aria-current="page" no link da rota atual */}
          <NavLink to={to} end={end} className="app-nav__link" onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function UserBlock() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="user-block">
      <div>
        <div className="user-block__name">{user.nome}</div>
        <div className="user-block__meta">
          {user.tipo_usuario === 'medico' ? (
            <>
              {user.especialidade || 'Médico'}
              {user.crm && (
                <>
                  {' '}
                  · <span className="font-mono">{formatCrm(user)}</span>
                </>
              )}
            </>
          ) : user.tipo_usuario === 'admin' ? (
            'Administrador'
          ) : (
            'Paciente'
          )}
        </div>
      </div>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={handleLogout}
        className="align-self-start"
      >
        <LogOut size={16} aria-hidden="true" />
        Sair
      </Button>
    </div>
  );
}
