import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

export default function CartReview({ onClose, onConfirm, submitting }) {
  const { lines, setQuantity, setNotes, total } = useCart();

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-cream">
      <header className="flex items-center justify-between border-b border-brand-100 bg-white px-4 py-4">
        <h2 className="text-lg font-extrabold text-brand-600">Tu pedido</h2>
        <button onClick={onClose} className="btn-ghost">
          Cerrar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {lines.length === 0 ? (
          <p className="py-16 text-center text-brand-400">Tu pedido está vacío.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.menuItem.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-bold text-brand-600">{line.menuItem.name}</p>
                  <span className="font-bold text-brand-600">
                    {formatCurrency(line.menuItem.price * line.quantity)}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(line.menuItem.id, line.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-600"
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-bold text-brand-600">{line.quantity}</span>
                  <button
                    onClick={() => setQuantity(line.menuItem.id, line.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 font-bold text-white"
                  >
                    +
                  </button>
                </div>
                <input
                  value={line.notes}
                  onChange={(e) => setNotes(line.menuItem.id, e.target.value)}
                  placeholder='Notas (ej: "sin sal")'
                  className="input text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <footer className="border-t border-brand-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-lg font-extrabold text-brand-600">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button onClick={onConfirm} disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Enviando pedido...' : 'Confirmar pedido'}
          </button>
        </footer>
      )}
    </div>
  );
}
