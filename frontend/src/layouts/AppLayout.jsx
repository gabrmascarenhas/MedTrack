import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Offcanvas } from 'react-bootstrap';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/paths';
import { ClinicalProvider } from '../features/clinical/ClinicalContext';
import { initials } from '../features/clinical/lib/api';
import Brand from './Brand';
import { NavLinks, UserBlock } from './AppNav';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const doctor = pathname.startsWith('/medico');
  const label = pathname.startsWith('/admin')
    ? 'Administração'
    : doctor
      ? 'Área do profissional'
      : 'Área do paciente';
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  async function leave() {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
      navigate('/login');
    }
  }
  return (
    <ClinicalProvider>
      <div className="recovered-ui">
        <div className={`app-shell ${doctor ? 'doctor-theme' : 'patient-theme'}`}>
          <a href="#conteudo" className="skip-link">
            Pular para o conteúdo
          </a>
          <aside className="sidebar d-none d-lg-flex">
            <Brand to={homeFor(user)} />
            <div className="clinical-brand-caption">CUIDADO CONTÍNUO</div>
            <nav aria-label="Navegação principal">
              <div className="nav-caption">Menu principal</div>
              <NavLinks />
            </nav>
            <UserBlock />
            <div className="sidebar-foot">
              Organizar. Comunicar.
              <br />
              Acompanhar melhor.
            </div>
          </aside>
          <main id="conteudo" tabIndex={-1} className="main">
            <header className="topbar">
              <div className="top-left">
                <Button
                  variant="outline-secondary"
                  className="mobile-menu d-lg-none"
                  onClick={() => setMenuOpen(true)}
                  aria-controls="app-menu"
                  aria-expanded={menuOpen}
                >
                  <Menu size={18} />
                  <span className="visually-hidden">Abrir menu</span>
                </Button>
                <span className="breadcrumb">{label}</span>
              </div>
              <div className="top-right">
                <span className="top-date">Seu espaço de cuidado</span>
                <span className="avatar" aria-hidden="true">
                  {initials(user.nome)}
                </span>
                <button type="button" className="btn" disabled={leaving} onClick={leave}>
                  Sair ↗
                </button>
              </div>
            </header>
            <div className="content">
              <Outlet />
            </div>
          </main>
          <Offcanvas
            className={`recovered-ui clinical-drawer ${doctor ? 'doctor-theme' : 'patient-theme'}`}
            id="app-menu"
            show={menuOpen}
            onHide={() => setMenuOpen(false)}
            placement="start"
            aria-labelledby="app-menu-title"
          >
            <Offcanvas.Header closeButton closeLabel="Fechar menu">
              <Offcanvas.Title id="app-menu-title">MedTrack</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <nav aria-label="Navegação principal">
                <NavLinks onNavigate={() => setMenuOpen(false)} />
              </nav>
              <UserBlock />
            </Offcanvas.Body>
          </Offcanvas>
        </div>
      </div>
    </ClinicalProvider>
  );
}
