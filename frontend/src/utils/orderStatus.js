// Config centralizada del ciclo de vida de un pedido: label + color por estado,
// y a que estado pasa cada rol al tocar "siguiente paso". Un solo lugar para
// tocar si el flujo de estados cambia mas adelante.
export const ORDER_STATUSES = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

export const STATUS_META = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  en_preparacion: { label: 'En preparación', color: 'bg-blue-100 text-blue-700' },
  listo: { label: 'Listo', color: 'bg-emerald-100 text-emerald-700' },
  entregado: { label: 'Entregado', color: 'bg-brand-100 text-brand-600' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

// Cocina: pendiente -> en_preparacion -> listo
export function nextKitchenStatus(current) {
  if (current === 'pendiente') return 'en_preparacion';
  if (current === 'en_preparacion') return 'listo';
  return null;
}

// Mozo: listo -> entregado (retira el pedido de la cocina)
export function nextWaiterStatus(current) {
  if (current === 'listo') return 'entregado';
  return null;
}
