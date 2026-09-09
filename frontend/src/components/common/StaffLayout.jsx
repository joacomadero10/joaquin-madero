import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Reportes' },
    { to: '/admin/menu', label: 'Menú' },
    { to: '/admin/mesas', label: 'Mesas y QR' },
  ],
  mozo: [{ to: '/mozo', label: 'Mesas' }],
  // "cocina" no usa este layout: su pantalla (/cocina) es pantalla completa,
  // sin nav (ver App.jsx). Se deja afuera para no sugerir un menu que no existe.
};

export default function StaffLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[user.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 border-b border-brand-100 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <span className="text-lg font-extrabold text-brand-600">
              COMANDY<span className="text-accent-500">.</span>
            </span>
            <nav className="hidden gap-6 text-sm font-semibold text-brand-400 sm:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) => (isActive ? 'text-brand-600' : 'hover:text-brand-600')}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-brand-600">{user.name}</p>
              <p className="text-xs capitalize text-brand-400">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-brand-100 px-4 py-2 text-sm font-semibold text-brand-400 sm:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => (isActive ? 'text-brand-600' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
