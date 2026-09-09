import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as tablesApi from '../../api/tables';
import * as menuApi from '../../api/menu';
import * as ordersApi from '../../api/orders';
import { useCart } from '../../context/CartContext';
import MenuItemCard from '../../components/cliente/MenuItemCard';
import CategoryTabs from '../../components/cliente/CategoryTabs';
import FloatingCartButton from '../../components/cliente/FloatingCartButton';
import CartModal from '../../components/cliente/CartModal';
import OrderConfirmation from '../../components/cliente/OrderConfirmation';
import RequestBillButton from '../../components/cliente/RequestBillButton';
import EmptyState from '../../components/common/EmptyState';

export default function ClienteMenu() {
  // El segmento de la URL se llama table_id; en la practica es el identificador
  // opaco que codifica el QR de la mesa (ver backend GET /api/tables/resolve/:token).
  const { table_id: tableIdParam } = useParams();
  const { lines, clear } = useCart();

  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('loading'); // loading | browsing | confirmed
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    tablesApi
      .resolveTableByQrToken(tableIdParam)
      .then((resolvedTable) => {
        setTable(resolvedTable);
        return menuApi.getPublicMenu(resolvedTable.restaurant_id);
      })
      .then((data) => {
        setMenu(data);
        const firstTab = data.categories[0]?.id || (data.uncategorized.length > 0 ? 'uncategorized' : null);
        setActiveCategoryId(firstTab);
        setView('browsing');
      })
      .catch(() => setError('No pudimos encontrar esta mesa. Escaneá el QR de nuevo o llamá al mozo.'));
  }, [tableIdParam]);

  const tabs = useMemo(() => {
    if (!menu) return [];
    const categoryTabs = menu.categories.map((c) => ({ id: c.id, name: c.name }));
    if (menu.uncategorized.length > 0) categoryTabs.push({ id: 'uncategorized', name: 'Otros' });
    return categoryTabs;
  }, [menu]);

  const activeItems = useMemo(() => {
    if (!menu) return [];
    if (activeCategoryId === 'uncategorized') return menu.uncategorized;
    return menu.categories.find((c) => c.id === activeCategoryId)?.items || [];
  }, [menu, activeCategoryId]);

  async function handleConfirmOrder() {
    setSubmitting(true);
    try {
      const order = await ordersApi.createOrder({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        items: lines.map((line) => ({ menu_item_id: line.menuItem.id, quantity: line.quantity })),
        notes: orderNotes.trim() || undefined,
      });
      setConfirmedOrder(order);
      clear();
      setOrderNotes('');
      setCartOpen(false);
      setView('confirmed');
      // El backend ya marco la mesa "ocupada" al crear el pedido; reflejamos
      // eso localmente para que aparezca el boton de "pedir la cuenta".
      setTable((prev) => (prev.status === 'libre' ? { ...prev, status: 'ocupada' } : prev));
    } catch (err) {
      alert(err.response?.data?.error || 'No pudimos enviar el pedido. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOrderMore() {
    setConfirmedOrder(null);
    setView('browsing');
  }

  async function handleRequestBill() {
    const updated = await tablesApi.requestBill(table.id);
    setTable((prev) => ({ ...prev, status: updated.status }));
  }

  // ---------- 1. Carga inicial ----------
  if (view === 'loading' && !error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-accent-500" />
        <p className="text-sm font-medium text-gray-400">Cargando el menú...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <EmptyState icon="🔍" title="Mesa no encontrada" description={error} />
      </div>
    );
  }

  // ---------- 4. Confirmacion ----------
  if (view === 'confirmed' && confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onOrderMore={handleOrderMore} />;
  }

  // ---------- 2. Menu principal ----------
  return (
    <div className="min-h-screen bg-white pb-6">
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <header className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">
            C
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-500">{table.name}</p>
            <h1 className="truncate text-lg font-extrabold leading-tight text-gray-900">{menu.restaurant.name}</h1>
          </div>
        </header>

        {/* Fila propia para que "pedir la cuenta" nunca compita por espacio
            con el nombre del restaurante (puede ser largo). Solo tiene
            sentido si ya se pidio algo en la mesa. */}
        {table.status !== 'libre' && (
          <div className="flex justify-end border-t border-gray-100 px-4 py-2">
            <RequestBillButton status={table.status} onRequest={handleRequestBill} />
          </div>
        )}

        {tabs.length > 0 && (
          <CategoryTabs categories={tabs} activeId={activeCategoryId} onChange={setActiveCategoryId} />
        )}
      </div>

      <div className="space-y-3 p-4">
        {activeItems.length === 0 ? (
          <EmptyState icon="🍽️" title="No hay platos en esta categoría" />
        ) : (
          activeItems.map((item) => <MenuItemCard key={item.id} item={item} />)
        )}
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />

      {cartOpen && (
        <CartModal
          notes={orderNotes}
          onNotesChange={setOrderNotes}
          onClose={() => setCartOpen(false)}
          onConfirm={handleConfirmOrder}
          submitting={submitting}
        />
      )}
    </div>
  );
}
