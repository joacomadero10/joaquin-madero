import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrderEvents } from '../../hooks/useOrderEvents';
import * as ordersApi from '../../api/orders';
import KitchenColumn from '../../components/cocina/KitchenColumn';
import KitchenOrderCard from '../../components/cocina/KitchenOrderCard';
import { playAlertSound } from '../../utils/alertSound';
import { nextKitchenStatus } from '../../utils/orderStatus';

const COLUMNS = [
  {
    status: 'pendiente',
    title: 'Pendientes',
    bgClass: 'bg-[#3a1414]',
    headerClass: 'bg-[#4d1a1a]',
    actionLabel: 'Empezar a preparar',
  },
  {
    status: 'en_preparacion',
    title: 'En preparación',
    bgClass: 'bg-[#3a2f0c]',
    headerClass: 'bg-[#4d3e0f]',
    actionLabel: 'Marcar listo',
  },
  {
    status: 'listo',
    title: 'Listos',
    bgClass: 'bg-[#123a1e]',
    headerClass: 'bg-[#164d27]',
    actionLabel: null,
  },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <span className="font-mono text-lg font-semibold text-white/40">
      {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function CocinaDashboard() {
  const { user } = useAuth();
  const { tablesById } = useTables(user.restaurant_id);
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  // Evita el sonido de alerta para los pedidos que YA estaban activos al
  // entrar a la pantalla (la carga inicial no es un pedido "nuevo").
  const hasLoadedInitial = useRef(false);

  useEffect(() => {
    ordersApi.getActiveOrders(user.restaurant_id).then((data) => {
      setOrders(data);
      hasLoadedInitial.current = true;
    });
  }, [user.restaurant_id]);

  const upsertOrder = useCallback((order) => {
    setOrders((prev) => {
      const withoutOrder = prev.filter((o) => o.id !== order.id);
      const isActive = order.status !== 'entregado' && order.status !== 'cancelado';
      return isActive ? [...withoutOrder, order] : withoutOrder;
    });
  }, []);

  useOrderEvents(user.restaurant_id, {
    onNuevoPedido: (order) => {
      upsertOrder(order);
      if (hasLoadedInitial.current) playAlertSound();
    },
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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#1A1A1A]">
      {/* Barra superior minima: logo chico + reloj. Nada de menu ni navegacion. */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-sm font-black text-white">
            C
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">Comandy · Cocina</span>
        </div>
        <LiveClock />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-px overflow-hidden">
        {COLUMNS.map((column) => {
          const columnOrders = orders
            .filter((order) => order.status === column.status)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          return (
            <KitchenColumn
              key={column.status}
              title={column.title}
              orders={columnOrders}
              bgClass={column.bgClass}
              headerClass={column.headerClass}
              renderCard={(order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  tableName={tablesById.get(order.table_id)?.name}
                  actionLabel={column.actionLabel}
                  actionLoading={updatingId === order.id}
                  onAction={() => handleAdvance(order)}
                />
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
