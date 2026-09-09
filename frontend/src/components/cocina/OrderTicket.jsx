import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/currency';

function timeAgo(isoDate) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (minutes < 1) return 'recién';
  if (minutes === 1) return 'hace 1 min';
  return `hace ${minutes} min`;
}

export default function OrderTicket({ order, tableName, actionLabel, onAction, actionLoading }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-brand-600">{tableName || 'Sin mesa'}</p>
          <p className="text-xs text-brand-400">{timeAgo(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="space-y-1.5 border-t border-dashed border-brand-100 pt-3">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm">
            <span className="font-bold text-brand-600">{item.quantity}×</span>{' '}
            <span className="text-brand-600">{item.name}</span>
            {item.notes && <span className="block pl-5 text-xs italic text-accent-600">“{item.notes}”</span>}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-dashed border-brand-100 pt-3">
        <span className="text-sm font-bold text-brand-600">{formatCurrency(order.total)}</span>
        {actionLabel && (
          <button onClick={onAction} disabled={actionLoading} className="btn-primary py-2 text-xs">
            {actionLoading ? '...' : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
