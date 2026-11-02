export default function LoadingState({ label = 'Carregando', lines = 3, fullPage = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`loading-state${fullPage ? ' loading-state--page' : ''}`}
    >
      <span className="visually-hidden">{label}…</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton" aria-hidden="true" />
      ))}
    </div>
  );
}
