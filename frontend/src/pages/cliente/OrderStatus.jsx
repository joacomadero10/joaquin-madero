import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useOrderEvents } from '../../hooks/useOrderEvents';
import StatusBadge from '../../components/common/StatusBadge';
import { ORDER_STATUSES, STATUS_META } from '../../utils/orderStatus';
import { formatCurrency } from '../../utils/currency';

const VISIBLE_STEPS = ORDER_STATUSES.filter((s) => s !== 'cancelado');

export default function OrderStatus() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant_id');
  const tableName = searchParams.get('mesa');

  const [order, setOrder] = useState(null);

  useOrderEvents(restaurantId, {
    onPedidoActualizado: (updated) => {
      if (updated.id === orderId) setOrder(updated);
    },
    onNuevoPedido: (created) => {
      if (created.id === orderId) setOrder(created);
    },
  });

  const currentStatus = order?.status || 'pendiente';
  const currentStepIndex = VISIBLE_STEPS.indexOf(currentStatus);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-accent-500">{tableName}</p>
      <h1 className="mb-1 text-xl font-extrabold text-brand-600">Tu pedido está en camino</h1>
      <p className="mb-8 text-sm text-brand-400">Pedido #{orderId.slice(0, 8)}</p>

      <div className="w-full max-w-sm space-y-3">
        {VISIBLE_STEPS.map((status, index) => {
          const done = index <= currentStepIndex;
          return (
            <div
              key={status}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                done ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-400'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span className={`text-sm font-semibold ${done ? 'text-brand-600' : 'text-brand-400'}`}>
                {STATUS_META[status].label}
              </span>
            </div>
          );
        })}
      </div>

      {order && (
        <div className="mt-8 w-full max-w-sm">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-brand-600">Estado actual</span>
              <StatusBadge status={order.status} />
            </div>
            <ul className="mb-2 space-y-1 text-sm text-brand-600">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.name}
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-dashed border-brand-100 pt-2 font-bold text-brand-600">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-brand-400">
        Esta pantalla se actualiza sola. Podés dejarla abierta o cerrarla, tu pedido ya está en cocina.
      </p>
    </div>
  );
}
