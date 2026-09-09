import { useElapsedSeconds } from '../../hooks/useElapsedSeconds';
import { formatElapsed } from '../../utils/time';

const ALERT_THRESHOLD_SECONDS = 15 * 60;

export default function LiveTimer({ createdAt }) {
  const elapsed = useElapsedSeconds(createdAt);
  const isLate = elapsed >= ALERT_THRESHOLD_SECONDS;

  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-2xl font-black tabular-nums ${
        isLate ? 'animate-pulse bg-red-600 text-white' : 'bg-black/30 text-white/80'
      }`}
    >
      ⏱ {formatElapsed(elapsed)}
    </span>
  );
}
