import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as categoriesApi from '../../api/categories';
import * as menuItemsApi from '../../api/menuItems';
import MenuItemForm from '../../components/admin/MenuItemForm';
import MenuItemRow from '../../components/admin/MenuItemRow';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

export default function MenuAdmin() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  function loadAll() {
    return Promise.all([
      categoriesApi.listCategories(user.restaurant_id),
      menuItemsApi.listMenuItems(user.restaurant_id),
    ]).then(([cats, menuItems]) => {
      setCategories(cats);
      setItems(menuItems);
    });
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await categoriesApi.createCategory(user.restaurant_id, newCategoryName.trim());
    setNewCategoryName('');
    loadAll();
  }

  async function handleDeleteCategory(category) {
    if (!confirm(`¿Eliminar la categoría "${category.name}"? Los platos quedan sin categoría.`)) return;
    await categoriesApi.deleteCategory(category.id);
    loadAll();
  }

  async function handleCreateItem(payload) {
    await menuItemsApi.createMenuItem({ restaurant_id: user.restaurant_id, ...payload });
    setShowForm(false);
    loadAll();
  }

  async function handleUpdateItem(payload) {
    await menuItemsApi.updateMenuItem(editingItem.id, payload);
    setEditingItem(null);
    loadAll();
  }

  async function handleDeleteItem(item) {
    if (!confirm(`¿Eliminar "${item.name}" del menú?`)) return;
    await menuItemsApi.deleteMenuItem(item.id);
    loadAll();
  }

  async function handleToggleAvailable(item) {
    await menuItemsApi.updateMenuItem(item.id, { available: !item.available });
    loadAll();
  }

  if (loading) return <Loader label="Cargando menú..." />;

  const categoryName = (id) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-extrabold text-brand-600">Categorías</h1>
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="badge flex items-center gap-2 bg-brand-100 text-brand-600">
              {category.name}
              <button onClick={() => handleDeleteCategory(category)} className="text-brand-400 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
          {categories.length === 0 && <p className="text-sm text-brand-400">Todavía no creaste categorías.</p>}
        </div>
        <form onSubmit={handleAddCategory} className="flex max-w-sm gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nueva categoría (ej: Postres)"
            className="input"
          />
          <button type="submit" className="btn-outline whitespace-nowrap">
            Agregar
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-brand-600">Platos</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              + Nuevo plato
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <MenuItemForm
              categories={categories}
              submitLabel="Crear plato"
              onSubmit={handleCreateItem}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {editingItem && (
          <div className="mb-4">
            <MenuItemForm
              categories={categories}
              initialValue={editingItem}
              submitLabel="Guardar cambios"
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState icon="🍽️" title="Todavía no hay platos" description="Creá el primero con el botón de arriba." />
        ) : (
          <div className="card divide-y divide-brand-100">
            {items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                categoryName={categoryName(item.category_id)}
                onEdit={setEditingItem}
                onDelete={handleDeleteItem}
                onToggleAvailable={handleToggleAvailable}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
