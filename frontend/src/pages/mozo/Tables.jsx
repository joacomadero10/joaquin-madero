import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrderEvents } from '../../hooks/useOrderEvents';
import * as ordersApi from '../../api/orders';
import * as tablesApi from '../../api/tables';
import TableCard from '../../components/mozo/TableCard';
import Loader from '../../components/common/Loader';

export default function MozoTables() {
  const { user } = useAuth();
  const { tables, reload: reloadTables } = useTables(user.restaurant_id);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    ordersApi
      .getActiveOrders(user.restaurant_id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user.restaurant_id]);

  const upsertOrder = useCallback((order) => {
    setOrders((prev) => {
      const withoutOrder = prev.filter((o) => o.id !== order.id);
      const isActive = order.status !== 'entregado' && order.status !== 'cancelado';
      return isActive ? [...withoutOrder, order] : withoutOrder;
    });
  }, []);

  useOrderEvents(user.restaurant_id, {
    // Un pedido nuevo pone la mesa en "ocupada" del lado del backend; recargamos
    // las mesas para que el mozo vea ese cambio de estado sin recargar la pagina.
    onNuevoPedido: (order) => {
      upsertOrder(order);
      reloadTables();
    },
    onPedidoActualizado: upsertOrder,
  });

  async function handleMarkDelivered(order) {
    setBusyId(order.id);
    try {
      const updated = await ordersApi.updateOrderStatus(order.id, 'entregado');
      upsertOrder(updated);
    } finally {
      setBusyId(null);
    }
  }

  async function handleChangeTableStatus(table, estado) {
    setBusyId(table.id);
    try {
      await tablesApi.updateTableStatus(table.id, estado);
      await reloadTables();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loader label="Cargando mesas..." />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-brand-600">Mesas</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            orders={orders.filter((order) => order.table_id === table.id)}
            onMarkDelivered={handleMarkDelivered}
            onChangeTableStatus={handleChangeTableStatus}
            busy={busyId === table.id}
          />
        ))}
      </div>
    </div>
  );
}
