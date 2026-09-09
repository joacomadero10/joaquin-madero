import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrderEvents } from '../../hooks/useOrderEvents';
import * as ordersApi from '../../api/orders';
import * as tablesApi from '../../api/tables';
import TableGridCard from '../../components/mozo/TableGridCard';
import TableDetailPanel from '../../components/mozo/TableDetailPanel';
import AddItemModal from '../../components/mozo/AddItemModal';
import Loader from '../../components/common/Loader';

export default function MozoTables() {
  const { user } = useAuth();
  const { tables, reload: reloadTables } = useTables(user.restaurant_id);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [closing, setClosing] = useState(false);

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
    // Un pedido nuevo abre/ocupa la mesa del lado del backend: recargamos las
    // mesas para que la grilla cambie de color sola, sin recargar la pagina.
    onNuevoPedido: (order) => {
      upsertOrder(order);
      reloadTables();
    },
    onPedidoActualizado: upsertOrder,
  });

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;
  const ordersForSelectedTable = orders.filter((o) => o.table_id === selectedTableId);

  function closePanel() {
    setSelectedTableId(null);
    setAddItemOpen(false);
  }

  async function handleConfirmClose() {
    setClosing(true);
    try {
      // Cerrar la cuenta da por entregado todo lo que quedaba activo de esta
      // mesa (evita dejar pedidos "activos" colgados de una mesa ya libre).
      await Promise.all(
        ordersForSelectedTable
          .filter((order) => order.status !== 'entregado')
          .map((order) => ordersApi.updateOrderStatus(order.id, 'entregado'))
      );
      await tablesApi.updateTableStatus(selectedTableId, 'libre');
      await reloadTables();
      closePanel();
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <Loader label="Cargando mesas..." />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-brand-600">Mesas</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {tables.map((table) => {
          const tableOrders = orders.filter((o) => o.table_id === table.id);
          const itemCount = tableOrders.flatMap((o) => o.items).reduce((sum, item) => sum + item.quantity, 0);
          return (
            <TableGridCard
              key={table.id}
              table={table}
              itemCount={itemCount}
              onTap={() => setSelectedTableId(table.id)}
            />
          );
        })}
      </div>

      {selectedTable && (
        <TableDetailPanel
          table={selectedTable}
          orders={ordersForSelectedTable}
          onClose={closePanel}
          onAddItem={() => setAddItemOpen(true)}
          onConfirmClose={handleConfirmClose}
          closing={closing}
        />
      )}

      {addItemOpen && selectedTable && (
        <AddItemModal
          restaurantId={user.restaurant_id}
          tableId={selectedTable.id}
          onClose={() => setAddItemOpen(false)}
          onAdded={() => setAddItemOpen(false)}
        />
      )}
    </div>
  );
}
