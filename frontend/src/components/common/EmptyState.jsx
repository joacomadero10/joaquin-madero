export default function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-100 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="font-semibold text-brand-600">{title}</p>
      {description && <p className="max-w-sm text-sm text-brand-400">{description}</p>}
    </div>
  );
}
