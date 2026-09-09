import { STATUS_META } from '../../utils/orderStatus';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'bg-brand-100 text-brand-600' };
  return <span className={`badge ${meta.color}`}>{meta.label}</span>;
}
