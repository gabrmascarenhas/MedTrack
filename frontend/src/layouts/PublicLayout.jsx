import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/paths';
import Brand from './Brand';

export default function PublicLayout() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === '/';
  useEffect(() => {
    setMenuOpen(false);
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      target?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  function closeMenu() {
    setMenuOpen(false);
  }
  return (
    <div className={`public-shell${isHome ? ' public-shell--home' : ''}`}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="public-shell__header public-header">
        <div className="public-header__inner">
          <Brand />
          <button
            type="button"
            className="public-header__toggle"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="public-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav
            id="public-navigation"
            className={`public-header__nav${menuOpen ? ' is-open' : ''}`}
            aria-label="Navegação principal"
          >
            <Link to="/#como-funciona" onClick={closeMenu}>
              Como funciona
            </Link>
            <Link to="/#para-voce" onClick={closeMenu}>
              Para você
            </Link>
            <Link to="/#duvidas" onClick={closeMenu}>
              Dúvidas
            </Link>
            <span className="public-header__divider" aria-hidden="true" />
            {user ? (
              <Link to={homeFor(user)} className="btn btn-primary" onClick={closeMenu}>
                Minha área <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="public-header__login" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/cadastro" className="btn btn-primary" onClick={closeMenu}>
                  Criar conta <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="public-shell__main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="home-container">
          <div>
            <Brand />
            <p>
              Informação que aproxima.
              <br />
              Cuidado que continua.
            </p>
          </div>
          <div>
            <Link to="/">Início</Link>
            <Link to="/login">Login</Link>
            <Link to="/cadastro?perfil=doctor">Médicos parceiros</Link>
          </div>
          <p>
            MedTrack · Projeto acadêmico.
            <br />
            Não substitui a avaliação de um profissional de saúde.
          </p>
        </div>
      </footer>
    </div>
  );
}
