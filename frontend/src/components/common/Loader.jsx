export default function Loader({ label = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-brand-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-accent-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
