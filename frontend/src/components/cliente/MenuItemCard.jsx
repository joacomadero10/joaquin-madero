import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

export default function MenuItemCard({ item }) {
  const { lines, addItem, setQuantity } = useCart();
  const line = lines.find((l) => l.menuItem.id === item.id);

  return (
    <div className="card flex gap-4 p-4">
      {item.image_url && (
        <img src={item.image_url} alt={item.name} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
      )}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="font-bold text-brand-600">{item.name}</p>
          {item.description && <p className="mt-0.5 text-sm text-brand-400">{item.description}</p>}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-brand-600">{formatCurrency(item.price)}</span>
          {line ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(item.id, line.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold"
              >
                −
              </button>
              <span className="w-4 text-center font-bold text-brand-600">{line.quantity}</span>
              <button
                onClick={() => setQuantity(item.id, line.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white font-bold"
              >
                +
              </button>
            </div>
          ) : (
            <button onClick={() => addItem(item)} className="btn-primary py-2 text-xs">
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
