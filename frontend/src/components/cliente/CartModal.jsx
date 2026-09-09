import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

export default function CartModal({ notes, onNotesChange, onClose, onConfirm, submitting }) {
  const { lines, setQuantity, total } = useCart();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Tu pedido</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-gray-400">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="py-10 text-center text-gray-400">Todavía no agregaste nada.</p>
          ) : (
            <div className="space-y-4">
              {lines.map((line) => (
                <div key={line.menuItem.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{line.menuItem.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(line.menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(line.menuItem.id, line.quantity - 1)}
                      aria-label={`Restar ${line.menuItem.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-bold text-gray-900">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.menuItem.id, line.quantity + 1)}
                      aria-label={`Sumar ${line.menuItem.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Notas para tu pedido (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder='Ej: "sin picante", "traer todo junto"...'
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="w-full rounded-full bg-accent-500 py-3.5 font-bold text-white shadow-lg shadow-accent-500/30 transition-transform active:scale-95 disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Confirmar pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
