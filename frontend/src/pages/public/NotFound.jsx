import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Página não encontrada · MedTrack';
  }, []);

  return (
    <section>
      <p className="font-mono text-body-secondary mb-2">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p className="text-body-secondary mb-5">O endereço pode ter mudado ou estar incompleto.</p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar ao início
      </Link>
    </section>
  );
}
