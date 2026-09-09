import { useCart } from '../../context/CartContext';

export default function FloatingCartButton({ onClick }) {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      aria-label="Ver carrito"
      className="fixed bottom-5 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-accent-500 text-2xl text-white shadow-lg shadow-accent-500/40 transition-transform active:scale-90"
    >
      🛒
      <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-brand-600 px-1 text-xs font-bold text-white">
        {itemCount}
      </span>
    </button>
  );
}
