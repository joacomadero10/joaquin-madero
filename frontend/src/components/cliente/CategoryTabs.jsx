export default function CategoryTabs({ categories, activeId, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-3">
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive ? 'bg-accent-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
