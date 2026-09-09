import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // lines: [{ menuItem, quantity, notes }]
  const [lines, setLines] = useState([]);

  const addItem = useCallback((menuItem) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItem.id === menuItem.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { menuItem, quantity: 1, notes: '' }];
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setLines((prev) => prev.filter((line) => line.menuItem.id !== menuItemId));
  }, []);

  const setQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((line) => line.menuItem.id !== menuItemId));
      return;
    }
    setLines((prev) =>
      prev.map((line) => (line.menuItem.id === menuItemId ? { ...line, quantity } : line))
    );
  }, []);

  const setNotes = useCallback((menuItemId, notes) => {
    setLines((prev) => prev.map((line) => (line.menuItem.id === menuItemId ? { ...line, notes } : line)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.menuItem.price) * line.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addItem, removeItem, setQuantity, setNotes, clear, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de un CartProvider');
  return ctx;
}
