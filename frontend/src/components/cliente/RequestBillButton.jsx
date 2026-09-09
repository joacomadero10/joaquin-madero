import { useState } from 'react';

export default function RequestBillButton({ status, onRequest }) {
  const [requesting, setRequesting] = useState(false);

  if (status === 'cuenta_pedida') {
    return <span className="text-xs font-bold text-accent-500">🛎️ Ya avisamos al mozo</span>;
  }

  async function handleClick() {
    setRequesting(true);
    try {
      await onRequest();
    } finally {
      setRequesting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={requesting}
      className="whitespace-nowrap rounded-full border border-accent-500 px-3 py-1.5 text-xs font-bold text-accent-500 disabled:opacity-50"
    >
      {requesting ? 'Avisando...' : '🛎️ Pedir la cuenta'}
    </button>
  );
}
