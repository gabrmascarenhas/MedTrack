import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatBirthDate, genderLabel } from '../../services/profile';
import ClinicalPage from '../../features/clinical/ClinicalPage';

export default function PatientHome() {
  const { user } = useAuth();

  return (
    <>
      <ClinicalPage perspective="patient" />
      <div className="d-grid gap-5 mt-5">
        <section className="panel" aria-labelledby="data-title">
          <h2 id="data-title" className="panel__title">
            Seus dados
          </h2>
          <dl className="data-sheet">
            <div>
              <dt>Nome</dt>
              <dd>{user.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Data de nascimento</dt>
              <dd className="font-mono">{formatBirthDate(user.data_nascimento)}</dd>
            </div>
            <div>
              <dt>Gênero</dt>
              <dd>{genderLabel(user)}</dd>
            </div>
          </dl>
          <Link className="btn btn-outline-primary mt-3" to="/paciente/cadastro">
            Editar cadastro
          </Link>
        </section>
      </div>
    </>
  );
}
