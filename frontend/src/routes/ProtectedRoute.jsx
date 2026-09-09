import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege rutas de staff (admin/mozo/cocina). Si no hay sesion, manda a
 * /login. Si hay sesion pero el rol no esta en `roles`, lo manda a SU
 * propia pantalla en vez de dejarlo pasar (ej: un mozo no entra a /admin).
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}

export function homeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'mozo') return '/mozo';
  if (role === 'cocina') return '/cocina';
  return '/login';
}
