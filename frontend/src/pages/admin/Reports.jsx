import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as reportsApi from '../../api/reports';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/currency';

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-brand-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand-600">{value}</p>
    </div>
  );
}

export default function AdminReports() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getDailyReport(user.restaurant_id)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [user.restaurant_id]);

  if (loading) return <Loader label="Cargando reporte..." />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-600">Reporte de hoy</h1>
        <span className="text-sm text-brand-400">{report.fecha}</span>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pedidos de hoy" value={report.total_pedidos} />
        <StatCard label="Facturado hoy" value={formatCurrency(report.total_facturado)} />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-400">Platos más vendidos</h2>
      {report.platos_mas_vendidos.length === 0 ? (
        <EmptyState icon="📊" title="Todavía no hay ventas hoy" />
      ) : (
        <div className="card divide-y divide-brand-100">
          {report.platos_mas_vendidos.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold text-brand-600">
                {index + 1}. {item.name}
              </span>
              <span className="text-sm font-bold text-accent-600">{item.cantidad_vendida} vendidos</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
