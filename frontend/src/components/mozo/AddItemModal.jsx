import { useEffect, useMemo, useState } from 'react';
import * as menuApi from '../../api/menu';
import * as ordersApi from '../../api/orders';
import { formatCurrency } from '../../utils/currency';
import Loader from '../common/Loader';

export default function AddItemModal({ restaurantId, tableId, onClose, onAdded }) {
  const [menu, setMenu] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [quantities, setQuantities] = useState({}); // menu_item_id -> qty
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    menuApi.getPublicMenu(restaurantId).then((data) => {
      setMenu(data);
      setActiveCategoryId(data.categories[0]?.id || (data.uncategorized.length > 0 ? 'uncategorized' : null));
    });
  }, [restaurantId]);

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

  function setQty(itemId, qty) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, qty) }));
  }

  const selectedItems = Object.entries(quantities).filter(([, qty]) => qty > 0);
  const total = selectedItems.reduce((sum, [itemId, qty]) => {
    const item = [...(menu?.categories.flatMap((c) => c.items) || []), ...(menu?.uncategorized || [])].find(
      (i) => i.id === itemId
    );
    return sum + (item ? Number(item.price) * qty : 0);
  }, 0);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await ordersApi.createOrder({
        restaurant_id: restaurantId,
        table_id: tableId,
        items: selectedItems.map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
      });
      onAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo agregar el pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white"
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="text-lg font-bold text-brand-600">Agregar ítem</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-brand-300">
            ×
          </button>
        </div>

        {!menu ? (
          <Loader label="Cargando el menú..." />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto border-b border-brand-100 px-4 py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryId(tab.id)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                    tab.id === activeCategoryId ? 'bg-accent-500 text-white' : 'bg-brand-100 text-brand-600'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {activeItems.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-600">{item.name}</p>
                      <p className="text-sm text-brand-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={qty === 0}
                        aria-label={`Quitar ${item.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-600 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-bold text-brand-600">{qty}</span>
                      <button
                        onClick={() => setQty(item.id, qty + 1)}
                        aria-label={`Agregar ${item.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 font-bold text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-brand-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between font-bold text-brand-600">
                <span>Total a agregar</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={selectedItems.length === 0 || submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Agregando...' : 'Agregar a la mesa'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
