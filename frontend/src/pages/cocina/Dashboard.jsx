import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrderEvents } from '../../hooks/useOrderEvents';
import * as ordersApi from '../../api/orders';
import OrderTicket from '../../components/cocina/OrderTicket';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { nextKitchenStatus } from '../../utils/orderStatus';

const COLUMNS = [
  { status: 'pendiente', title: 'Nuevos' },
  { status: 'en_preparacion', title: 'En preparación' },
  { status: 'listo', title: 'Listos (esperando al mozo)' },
];

export default function CocinaDashboard() {
  const { user } = useAuth();
  const { tablesById } = useTables(user.restaurant_id);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    ordersApi
      .getActiveOrders(user.restaurant_id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user.restaurant_id]);

  const upsertOrder = useCallback((order) => {
    setOrders((prev) => {
      const withoutOrder = prev.filter((o) => o.id !== order.id);
      // "activo" = lo que tambien devuelve GET /api/orders/:restaurant_id.
      const isActive = order.status !== 'entregado' && order.status !== 'cancelado';
      return isActive ? [...withoutOrder, order] : withoutOrder;
    });
  }, []);

  useOrderEvents(user.restaurant_id, {
    onNuevoPedido: upsertOrder,
    onPedidoActualizado: upsertOrder,
  });

  async function handleAdvance(order) {
    const next = nextKitchenStatus(order.status);
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const updated = await ordersApi.updateOrderStatus(order.id, next);
      upsertOrder(updated);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <Loader label="Cargando pedidos..." />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-brand-600">Cocina</h1>

      {orders.length === 0 ? (
        <EmptyState icon="🧑‍🍳" title="No hay pedidos activos" description="Los pedidos nuevos van a aparecer aquí en tiempo real." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnOrders = orders
              .filter((order) => order.status === column.status)
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            return (
              <div key={column.status}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-400">
                  {column.title} <span className="text-brand-300">({columnOrders.length})</span>
                </h2>
                <div className="space-y-3">
                  {columnOrders.map((order) => (
                    <OrderTicket
                      key={order.id}
                      order={order}
                      tableName={tablesById.get(order.table_id)?.name}
                      actionLabel={column.status === 'pendiente' ? 'Empezar' : column.status === 'en_preparacion' ? 'Marcar listo' : null}
                      actionLoading={updatingId === order.id}
                      onAction={() => handleAdvance(order)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
