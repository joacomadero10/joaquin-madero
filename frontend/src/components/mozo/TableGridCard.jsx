export default function TableGridCard({ table, itemCount, onTap }) {
  const isFree = table.status === 'libre';
  const isBillRequested = table.status === 'cuenta_pedida';

  return (
    <button
      onClick={onTap}
      disabled={isFree}
      className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center shadow-sm transition-transform active:scale-95 ${
        isFree ? 'bg-gray-200 text-gray-500' : 'bg-accent-500 text-white'
      } ${isBillRequested ? 'table-alert-blink' : ''}`}
    >
      <span className="text-3xl font-black leading-none">{table.name}</span>
      {!isFree && (
        <span className="text-sm font-semibold opacity-90">
          {itemCount} {itemCount === 1 ? 'plato' : 'platos'}
        </span>
      )}
      {isBillRequested && (
        <span className="absolute -top-2 -right-2 rounded-full bg-brand-600 px-2 py-1 text-xs font-bold text-white shadow">
          Pidió la cuenta
        </span>
      )}
    </button>
  );
}
