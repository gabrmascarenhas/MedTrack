import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button, Offcanvas } from 'react-bootstrap';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/paths';
import Brand from './Brand';
import { NavLinks, UserBlock } from './AppNav';

export default function AppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const home = homeFor(user);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      {/* Desktop: barra lateral fixa */}
      <aside className="app-sidebar d-none d-lg-flex">
        <Brand to={home} />
        <nav aria-label="Navegação principal">
          <NavLinks />
        </nav>
        <UserBlock />
      </aside>

      {/* Mobile: header compacto + menu em Offcanvas */}
      <header className="app-topbar d-lg-none">
        <Brand to={home} />
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setMenuOpen(true)}
          aria-controls="app-menu"
          aria-expanded={menuOpen}
        >
          <Menu size={18} aria-hidden="true" />
          Menu
        </Button>
      </header>

      <Offcanvas
        id="app-menu"
        show={menuOpen}
        onHide={() => setMenuOpen(false)}
        placement="start"
        aria-labelledby="app-menu-title"
      >
        <Offcanvas.Header closeButton closeLabel="Fechar menu">
          <Offcanvas.Title id="app-menu-title" as="h2" className="h4 mb-0">
            Menu
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <nav aria-label="Navegação principal">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </nav>
          <UserBlock />
        </Offcanvas.Body>
      </Offcanvas>

      <main id="conteudo" tabIndex={-1} className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </>
  );
}
