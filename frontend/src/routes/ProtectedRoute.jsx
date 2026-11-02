import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import { homeFor } from './paths';

// Proteção apenas de UX: esconde telas que o perfil não deve ver. Quem quiser pode burlar
// isto no navegador; a segurança real (RF12/RNF04) precisa ser aplicada pela API em cada rota.
export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Verificando sua sessão" fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && user.tipo_usuario !== 'admin' && !allowedRoles.includes(user.tipo_usuario)) {
    return <Navigate to={homeFor(user)} replace />;
  }

  return <Outlet />;
}
