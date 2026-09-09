import { useCallback, useEffect, useMemo, useState } from 'react';
import * as tablesApi from '../api/tables';

/**
 * Carga las mesas del restaurante y expone un mapa id -> mesa, util para
 * mostrar "Mesa 5" en vez del table_id crudo en pedidos/tickets.
 */
export function useTables(restaurantId) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!restaurantId) return;
    setLoading(true);
    return tablesApi
      .listTables(restaurantId)
      .then(setTables)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const tablesById = useMemo(() => {
    const map = new Map();
    tables.forEach((table) => map.set(table.id, table));
    return map;
  }, [tables]);

  return { tables, tablesById, loading, reload };
}
