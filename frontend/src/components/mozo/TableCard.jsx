import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/currency';
import { nextWaiterStatus } from '../../utils/orderStatus';

const TABLE_STATUS_META = {
  libre: { label: 'Libre', color: 'bg-emerald-100 text-emerald-700' },
  ocupada: { label: 'Ocupada', color: 'bg-amber-100 text-amber-700' },
  cuenta_pedida: { label: 'Pidió la cuenta', color: 'bg-accent-500/15 text-accent-600' },
};

export default function TableCard({ table, orders, onMarkDelivered, onChangeTableStatus, busy }) {
  const meta = TABLE_STATUS_META[table.status] || TABLE_STATUS_META.libre;
  const tableTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-extrabold text-brand-600">{table.name}</p>
        <span className={`badge ${meta.color}`}>{meta.label}</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-brand-400">Sin pedidos activos.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const next = nextWaiterStatus(order.status);
            return (
              <li key={order.id} className="rounded-xl bg-cream p-3">
                <div className="mb-1 flex items-center justify-between">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-brand-600">{formatCurrency(order.total)}</span>
                </div>
                <p className="text-xs text-brand-400">
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                </p>
                {next && (
                  <button
                    onClick={() => onMarkDelivered(order)}
                    disabled={busy}
                    className="btn-outline mt-2 w-full py-1.5 text-xs"
                  >
                    Marcar entregado
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-dashed border-brand-100 pt-3">
        <span className="text-sm font-semibold text-brand-400">
          {orders.length > 0 ? `Total mesa: ${formatCurrency(tableTotal)}` : ''}
        </span>
        <div className="flex gap-2">
          {table.status === 'ocupada' && (
            <button
              onClick={() => onChangeTableStatus(table, 'cuenta_pedida')}
              disabled={busy}
              className="btn-outline py-1.5 text-xs"
            >
              Pidió la cuenta
            </button>
          )}
          {table.status !== 'libre' && (
            <button
              onClick={() => onChangeTableStatus(table, 'libre')}
              disabled={busy}
              className="btn-primary py-1.5 text-xs"
            >
              Cerrar cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
