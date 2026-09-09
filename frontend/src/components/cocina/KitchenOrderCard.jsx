import LiveTimer from './LiveTimer';
import { formatClockTime } from '../../utils/time';

export default function KitchenOrderCard({ order, tableName, actionLabel, onAction, actionLoading }) {
  return (
    <div className="kitchen-card-enter rounded-2xl border border-white/10 bg-black/30 p-5 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-4xl font-black leading-none text-white">{tableName || 'Sin mesa'}</span>
        <LiveTimer createdAt={order.created_at} />
      </div>

      <ul className="mb-4 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="text-xl font-semibold leading-snug text-white/90">
            <span className="font-black text-white">{item.quantity}×</span> {item.name}
            {item.notes && <span className="mt-0.5 block text-sm font-medium italic text-amber-300">“{item.notes}”</span>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium italic text-amber-300">
          Nota: {order.notes}
        </p>
      )}

      <div className="mb-1 text-sm font-medium text-white/50">Llegó a las {formatClockTime(order.created_at)}</div>

      {actionLabel ? (
        <button
          onClick={onAction}
          disabled={actionLoading}
          className="mt-3 w-full rounded-xl bg-white/15 py-4 text-xl font-black uppercase tracking-wide text-white transition-colors hover:bg-white/25 disabled:opacity-50"
        >
          {actionLoading ? '...' : actionLabel}
        </button>
      ) : (
        <div className="mt-3 w-full rounded-xl border border-white/10 py-3 text-center text-sm font-bold uppercase tracking-wide text-white/40">
          Esperando al mozo
        </div>
      )}
    </div>
  );
}
