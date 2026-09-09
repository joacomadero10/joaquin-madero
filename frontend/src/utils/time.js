export function formatClockTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/** Segundos -> "MM:SS", para el cronometro en vivo de cada pedido. */
export function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
