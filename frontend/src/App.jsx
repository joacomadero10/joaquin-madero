import { Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './routes/ProtectedRoute';
import StaffLayout from './components/common/StaffLayout';

import Login from './pages/staff/Login';
import ClienteMenu from './pages/cliente/Menu';
import CocinaDashboard from './pages/cocina/Dashboard';
import MozoTables from './pages/mozo/Tables';
import AdminReports from './pages/admin/Reports';
import MenuAdmin from './pages/admin/MenuAdmin';
import TablesAdmin from './pages/admin/TablesAdmin';

function withStaffLayout(element, roles) {
  return (
    <ProtectedRoute roles={roles}>
      <StaffLayout>{element}</StaffLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Cliente: sin auth, entra escaneando el QR de su mesa */}
      <Route
        path="/mesa/:table_id"
        element={
          <CartProvider>
            <ClienteMenu />
          </CartProvider>
        }
      />

      {/* Staff */}
      <Route path="/cocina" element={withStaffLayout(<CocinaDashboard />, ['cocina'])} />
      <Route path="/mozo" element={withStaffLayout(<MozoTables />, ['mozo'])} />
      <Route path="/admin" element={withStaffLayout(<AdminReports />, ['admin'])} />
      <Route path="/admin/menu" element={withStaffLayout(<MenuAdmin />, ['admin'])} />
      <Route path="/admin/mesas" element={withStaffLayout(<TablesAdmin />, ['admin'])} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
