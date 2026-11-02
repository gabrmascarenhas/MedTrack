import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand__mark" aria-hidden="true">
        <ClipboardList size={18} />
      </span>
      MedTrack
    </Link>
  );
}
