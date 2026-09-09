export default function KitchenColumn({ title, orders, bgClass, headerClass, renderCard }) {
  return (
    <div className={`flex h-full min-w-0 flex-col overflow-hidden ${bgClass}`}>
      <div className={`flex items-center justify-between px-6 py-4 ${headerClass}`}>
        <h2 className="text-2xl font-black uppercase tracking-wide text-white">{title}</h2>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/30 text-lg font-bold text-white">
          {orders.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <p className="pt-10 text-center text-lg font-medium text-white/30">Sin pedidos</p>
        ) : (
          orders.map(renderCard)
        )}
      </div>
    </div>
  );
}
