import { useState } from 'react';
import { formatCurrency } from '../../utils/currency';
import { formatClockTime } from '../../utils/time';
import { ITEM_STATUS_ICON } from '../../utils/orderStatus';

export default function TableDetailPanel({
  table,
  orders,
  onClose,
  onAddItem,
  onRequestBill,
  requestingBill,
  onConfirmClose,
  closing,
}) {
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Aplanamos los items de todos los pedidos activos de la mesa en una sola
  // lista; cada item hereda el icono de estado del pedido al que pertenece
  // (el estado se maneja a nivel pedido, no item por item).
  const flatItems = orders.flatMap((order) =>
    order.items.map((item) => ({ ...item, orderStatus: order.status }))
  );
  const subtotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-brand-100 px-5 py-4">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-600">{table.name}</h2>
            <p className="text-sm text-brand-400">
              {table.opened_at ? `Abierta a las ${formatClockTime(table.opened_at)}` : 'Mesa recién abierta'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-brand-300">
            ×
          </button>
        </header>

        {!confirmingClose && table.status === 'cuenta_pedida' && (
          <div className="flex items-center gap-2 bg-accent-500/10 px-5 py-2.5 text-sm font-semibold text-accent-600">
            🛎️ El cliente pidió la cuenta
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {confirmingClose ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-lg font-semibold text-brand-600">¿Cerrar la cuenta de {table.name}?</p>
              <p className="text-4xl font-extrabold text-brand-600">{formatCurrency(subtotal)}</p>
              <p className="text-sm text-brand-400">La mesa va a quedar libre para un nuevo cliente.</p>
              <div className="mt-4 flex w-full gap-3">
                <button onClick={() => setConfirmingClose(false)} className="btn-outline flex-1">
                  Cancelar
                </button>
                <button
                  onClick={() => onConfirmClose().finally(() => setConfirmingClose(false))}
                  disabled={closing}
                  className="btn-primary flex-1"
                >
                  {closing ? 'Cerrando...' : 'Confirmar cierre'}
                </button>
              </div>
            </div>
          ) : flatItems.length === 0 ? (
            <p className="py-10 text-center text-brand-400">Todavía no hay platos pedidos.</p>
          ) : (
            <ul className="space-y-3">
              {flatItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-cream p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-600">
                      <span className="font-black">{item.quantity}×</span> {item.name}
                    </p>
                    {item.notes && <p className="text-xs italic text-accent-600">“{item.notes}”</p>}
                  </div>
                  <span className="flex-shrink-0 text-2xl" title={item.orderStatus}>
                    {ITEM_STATUS_ICON[item.orderStatus] || '⏳'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!confirmingClose && (
          <footer className="space-y-3 border-t border-brand-100 px-5 py-4">
            <div className="flex items-center justify-between text-lg font-extrabold text-brand-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <button onClick={onAddItem} className="btn-outline w-full">
              + Agregar ítem
            </button>
            {table.status !== 'cuenta_pedida' && (
              <button onClick={onRequestBill} disabled={requestingBill} className="btn-outline w-full">
                {requestingBill ? 'Marcando...' : '🛎️ Marcar cuenta pedida'}
              </button>
            )}
            <button onClick={() => setConfirmingClose(true)} className="btn-primary w-full">
              Cerrar cuenta
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
