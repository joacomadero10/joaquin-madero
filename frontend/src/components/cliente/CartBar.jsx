import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

export default function CartBar({ onOpenCart }) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white p-4 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.2)]">
      <button
        onClick={onOpenCart}
        className="btn-primary mx-auto flex w-full max-w-md items-center justify-between px-5"
      >
        <span>
          Ver pedido · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <span>{formatCurrency(total)}</span>
      </button>
    </div>
  );
}
