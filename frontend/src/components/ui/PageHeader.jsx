import { useEffect } from 'react';

export default function PageHeader({ title, description, actions }) {
  // O título da aba acompanha a página: numa SPA é assim que leitores de tela percebem a troca
  useEffect(() => {
    document.title = `${title} · MedTrack`;
  }, [title]);

  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
