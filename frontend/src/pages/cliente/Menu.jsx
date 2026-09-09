import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as tablesApi from '../../api/tables';
import * as menuApi from '../../api/menu';
import * as ordersApi from '../../api/orders';
import { useCart } from '../../context/CartContext';
import MenuItemCard from '../../components/cliente/MenuItemCard';
import CartBar from '../../components/cliente/CartBar';
import CartReview from '../../components/cliente/CartReview';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

export default function ClienteMenu() {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const { lines, clear } = useCart();

  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    tablesApi
      .resolveTableByQrToken(qrToken)
      .then((resolvedTable) => {
        setTable(resolvedTable);
        return menuApi.getPublicMenu(resolvedTable.restaurant_id);
      })
      .then(setMenu)
      .catch(() => setError('No pudimos encontrar esta mesa. Escaneá el QR de nuevo o llamá al mozo.'))
      .finally(() => setLoading(false));
  }, [qrToken]);

  async function handleConfirmOrder() {
    setSubmitting(true);
    try {
      const order = await ordersApi.createOrder({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        items: lines.map((line) => ({
          menu_item_id: line.menuItem.id,
          quantity: line.quantity,
          notes: line.notes || undefined,
        })),
      });
      clear();
      navigate(`/pedido/${order.id}?restaurant_id=${table.restaurant_id}&mesa=${encodeURIComponent(table.name)}`);
    } catch (err) {
      alert(err.response?.data?.error || 'No pudimos enviar el pedido. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader label="Cargando el menú..." />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState icon="🔍" title="Mesa no encontrada" description={error} />
      </div>
    );
  }

  const hasCategories = menu.categories.length > 0;
  const hasUncategorized = menu.uncategorized.length > 0;

  return (
    <div className="pb-28">
      <header className="border-b border-brand-100 bg-white px-4 py-5">
        <p className="text-xs font-bold uppercase tracking-wide text-accent-500">{table.name}</p>
        <h1 className="text-xl font-extrabold text-brand-600">Menú</h1>
      </header>

      <div className="space-y-8 p-4">
        {!hasCategories && !hasUncategorized && (
          <EmptyState icon="🍽️" title="El menú está vacío" description="Todavía no hay platos disponibles." />
        )}

        {menu.categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-400">{category.name}</h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {hasUncategorized && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-400">Otros</h2>
            <div className="space-y-3">
              {menu.uncategorized.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CartBar onOpenCart={() => setCartOpen(true)} />

      {cartOpen && (
        <CartReview
          onClose={() => setCartOpen(false)}
          onConfirm={handleConfirmOrder}
          submitting={submitting}
        />
      )}
    </div>
  );
}
