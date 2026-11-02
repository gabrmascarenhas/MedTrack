import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { formatBirthDate, genderLabel } from '../../services/profile';
import ConsultationFlow from '../../components/ConsultationFlow';

export default function PatientHome() {
  const { user } = useAuth();
  const firstName = user.nome.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Aqui você prepara suas consultas e acompanha as orientações depois delas."
        actions={
          <Link to="/paciente/consultas" className="btn btn-primary">
            Ver minhas consultas
          </Link>
        }
      />

      <div className="d-grid gap-5">
        <section className="panel" aria-labelledby="flow-title">
          <h2 id="flow-title" className="panel__title">
            Como cada consulta avança
          </h2>
          <ConsultationFlow />
        </section>

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
