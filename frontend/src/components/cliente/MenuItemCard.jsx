import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

function ItemImage({ item }) {
  if (!item.image_url) {
    // Placeholder naranja cuando el plato no tiene foto cargada.
    return (
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-accent-500">
        <span className="text-2xl" role="img" aria-label="Sin foto">
          🍽️
        </span>
      </div>
    );
  }

  return (
    <img
      src={item.image_url}
      alt={item.name}
      loading="lazy"
      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

export default function MenuItemCard({ item }) {
  const { addItem, quantityOf } = useCart();
  const quantity = quantityOf(item.id);

  return (
    <div className="relative flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <ItemImage item={item} />

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="font-semibold leading-snug text-gray-900">{item.name}</p>
          {item.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.description}</p>}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
          <button
            onClick={() => addItem(item)}
            aria-label={`Agregar ${item.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-xl font-bold text-white shadow-sm transition-transform active:scale-90"
          >
            +
          </button>
        </div>
      </div>

      {quantity > 0 && (
        <span
          aria-label={`${item.name}: ${quantity} en el carrito`}
          className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white"
        >
          {quantity}
        </span>
      )}
    </div>
  );
}
