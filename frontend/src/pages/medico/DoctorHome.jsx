import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { formatBirthDate, genderLabel, formatCrm } from '../../services/profile';
import ConsultationFlow from '../../components/ConsultationFlow';

export default function DoctorHome() {
  const { user } = useAuth();
  const firstName = user.nome.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Veja sua agenda e os resumos que os pacientes preparam antes da consulta."
        actions={
          <Link to="/medico/agenda" className="btn btn-primary">
            Abrir agenda
          </Link>
        }
      />

      <div className="d-grid gap-5">
        <section className="panel" aria-labelledby="flow-title">
          <h2 id="flow-title" className="panel__title">
            Status das consultas na agenda
          </h2>
          <ConsultationFlow />
        </section>

        <section className="panel" aria-labelledby="data-title">
          <h2 id="data-title" className="panel__title">
            Dados profissionais
          </h2>
          <dl className="data-sheet">
            <div>
              <dt>Nome</dt>
              <dd>{user.nome}</dd>
            </div>
            <div>
              <dt>Especialidade</dt>
              <dd>{user.especialidade || 'Não informada'}</dd>
            </div>
            <div>
              <dt>CRM</dt>
              <dd className="font-mono">{formatCrm(user)}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Data de nascimento</dt>
              <dd>{formatBirthDate(user.data_nascimento)}</dd>
            </div>
            <div>
              <dt>Gênero</dt>
              <dd>{genderLabel(user)}</dd>
            </div>
          </dl>
          <Link className="btn btn-outline-primary mt-3" to="/medico/cadastro">
            Editar cadastro
          </Link>
        </section>
      </div>
    </>
  );
}
