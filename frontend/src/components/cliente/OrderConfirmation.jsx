export default function OrderConfirmation({ order, onOrderMore }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <svg viewBox="0 0 52 52" className="check-circle mb-6 h-24 w-24">
        <circle cx="26" cy="26" r="25" fill="none" stroke="#FF6B35" strokeWidth="2.5" />
        <path
          className="check-mark"
          fill="none"
          stroke="#FF6B35"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 27l7 7 15-15"
        />
      </svg>

      <h1 className="mb-2 text-2xl font-extrabold text-gray-900">¡Tu pedido fue enviado a cocina!</h1>
      <p className="mb-1 text-gray-500">Ya lo están preparando.</p>
      <p className="mb-8 text-sm font-semibold text-gray-400">
        Pedido N° <span className="text-accent-500">#{order.id.slice(0, 8).toUpperCase()}</span>
      </p>

      <button
        onClick={onOrderMore}
        className="rounded-full bg-accent-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-accent-500/30 transition-transform active:scale-95"
      >
        Pedir algo más
      </button>
    </div>
  );
}
