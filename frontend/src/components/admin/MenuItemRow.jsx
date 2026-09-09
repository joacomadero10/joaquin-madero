import { formatCurrency } from '../../utils/currency';

export default function MenuItemRow({ item, categoryName, onEdit, onDelete, onToggleAvailable }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-brand-600">{item.name}</p>
        <p className="text-xs text-brand-400">
          {categoryName || 'Sin categoría'} · {formatCurrency(item.price)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleAvailable(item)}
          className={`badge cursor-pointer ${
            item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-400'
          }`}
          title="Click para cambiar disponibilidad"
        >
          {item.available ? 'Disponible' : 'Pausado'}
        </button>
        <button onClick={() => onEdit(item)} className="btn-ghost px-3 py-1.5 text-xs">
          Editar
        </button>
        <button onClick={() => onDelete(item)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
          Eliminar
        </button>
      </div>
    </div>
  );
}
