import { useEffect, useState } from 'react';

function computeElapsed(isoDate) {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
}

/** Segundos transcurridos desde `isoDate`, recalculado cada segundo (cronometro en vivo). */
export function useElapsedSeconds(isoDate) {
  const [elapsed, setElapsed] = useState(() => computeElapsed(isoDate));

  useEffect(() => {
    setElapsed(computeElapsed(isoDate));
    const intervalId = setInterval(() => setElapsed(computeElapsed(isoDate)), 1000);
    return () => clearInterval(intervalId);
  }, [isoDate]);

  return elapsed;
}
