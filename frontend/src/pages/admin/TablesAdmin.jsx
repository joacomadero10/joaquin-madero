import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTables } from '../../hooks/useTables';
import * as tablesApi from '../../api/tables';
import Loader from '../../components/common/Loader';

function QrCard({ table }) {
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    tablesApi.getTableQrBlobUrl(table.id).then((url) => {
      objectUrl = url;
      setQrUrl(url);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [table.id]);

  return (
    <div className="card flex flex-col items-center gap-3 p-4">
      <p className="font-bold text-brand-600">{table.name}</p>
      {qrUrl ? (
        <img src={qrUrl} alt={`QR de ${table.name}`} className="h-40 w-40 rounded-xl border border-brand-100" />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-brand-100 text-xs text-brand-400">
          Generando...
        </div>
      )}
      {qrUrl && (
        <a href={qrUrl} download={`qr-${table.name}.png`} className="btn-outline w-full py-2 text-xs">
          Descargar QR
        </a>
      )}
    </div>
  );
}

export default function TablesAdmin() {
  const { user } = useAuth();
  const { tables, loading, reload } = useTables(user.restaurant_id);
  const [newTableName, setNewTableName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreateTable(e) {
    e.preventDefault();
    if (!newTableName.trim()) return;
    setCreating(true);
    try {
      await tablesApi.createTable(user.restaurant_id, newTableName.trim());
      setNewTableName('');
      await reload();
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <Loader label="Cargando mesas..." />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-brand-600">Mesas y códigos QR</h1>

      <form onSubmit={handleCreateTable} className="mb-6 flex max-w-sm gap-2">
        <input
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          placeholder="Nombre de la mesa (ej: Mesa 8)"
          className="input"
        />
        <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
          {creating ? '...' : 'Crear'}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
        {tables.map((table) => (
          <QrCard key={table.id} table={table} />
        ))}
      </div>
    </div>
  );
}
