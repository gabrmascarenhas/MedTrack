export default function EmptyState({ icon: Icon, title, text, action, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <section className="empty-state">
      {Icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={24} />
        </span>
      )}
      <div className="empty-state__body">
        <Heading className="empty-state__title">{title}</Heading>
        {text && <p className="empty-state__text">{text}</p>}
        {action && <div className="empty-state__action">{action}</div>}
      </div>
    </section>
  );
}
