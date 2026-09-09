import { useState } from 'react';

const EMPTY = { name: '', description: '', price: '', category_id: '', image_url: '' };

export default function MenuItemForm({ categories, initialValue, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValue }));
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        price: Number(values.price),
        category_id: values.category_id || undefined,
        image_url: values.image_url || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Nombre del plato"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          className="input"
        />
        <input
          required
          type="number"
          min="0"
          step="1"
          placeholder="Precio"
          value={values.price}
          onChange={(e) => update('price', e.target.value)}
          className="input"
        />
      </div>

      <textarea
        placeholder="Descripción (opcional)"
        value={values.description}
        onChange={(e) => update('description', e.target.value)}
        className="input"
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={values.category_id} onChange={(e) => update('category_id', e.target.value)} className="input">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="URL de imagen (opcional)"
          value={values.image_url}
          onChange={(e) => update('image_url', e.target.value)}
          className="input"
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
