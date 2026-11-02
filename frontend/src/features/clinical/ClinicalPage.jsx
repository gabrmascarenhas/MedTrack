import { Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMockAuth } from '../../services/authService';
import { useClinical } from './ClinicalContext';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import { Appointments, Preparation, Summaries, Followup, Patients, Notes } from './pages/Pages';

export default function ClinicalPage({ page = 'dashboard', perspective = 'patient' }) {
  const { user } = useAuth();
  const {
    data,
    loading,
    error,
    notice,
    busy,
    setModal,
    refresh,
    mutate,
    view,
    patientSummary,
    setError,
  } = useClinical();
  const navigate = useNavigate();
  const paths =
    perspective === 'patient'
      ? {
          dashboard: '/paciente',
          appointments: '/paciente/consultas',
          preparation: '/paciente/preparacao',
          summary: '/paciente/resumos',
          followup: '/paciente/acompanhamento',
        }
      : {
          dashboard: '/medico',
          appointments: '/medico/agenda',
          patients: '/medico/pacientes',
          notes: '/medico/orientacoes',
        };
  if (useMockAuth)
    return (
      <Alert variant="info">
        Os fluxos de consultas utilizam a API real. Desative o modo de demonstração para acessar os
        registros.
      </Alert>
    );
  if (loading)
    return (
      <div className="clinical-loading" role="status">
        <Spinner size="sm" /> Carregando suas informações…
      </div>
    );
  if (!data)
    return (
      <Alert variant="danger" role="alert">
        {error || 'Não foi possível carregar os dados.'}{' '}
        <Button size="sm" onClick={() => refresh().catch((err) => setError(err.message))}>
          Tentar novamente
        </Button>
      </Alert>
    );
  // A perspectiva só escolhe a tela; o perfil e a autorização reais continuam no servidor.
  const display = {
    ...data,
    user: { ...data.user, role: perspective, name: user.nome },
    isAdmin: data.user.role === 'admin',
  };
  const openRequest = () => {
    if (busy) return;
    setError('');
    setModal({ kind: 'request' });
  };
  const props = { data: display, openRequest, view, mutate, busy };
  return (
    <div className="clinical">
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {notice && (
        <Alert variant="success" role="status">
          {notice}
        </Alert>
      )}
      {data.user.role === 'admin' && (
        <Alert variant="info">
          Visão administrativa: os registros exibidos incluem todos os usuários.
        </Alert>
      )}
      <div className="clinical-sync">
        <span>Atualização automática a cada 30 segundos</span>
        <button
          className="btn"
          disabled={busy}
          onClick={() => refresh().catch((err) => setError(err.message))}
        >
          Atualizar
        </button>
      </div>
      {page === 'dashboard' && (
        <Dashboard {...props} go={(key) => navigate(paths[key] || paths.dashboard)} />
      )}
      {page === 'appointments' &&
        (perspective === 'doctor' ? <Calendar {...props} /> : <Appointments {...props} />)}
      {page === 'preparation' && (
        <Preparation
          {...props}
          edit={(appt) => {
            setError('');
            setModal({ kind: 'editPrep', appt });
          }}
        />
      )}
      {page === 'summary' && <Summaries {...props} />}
      {page === 'followup' && <Followup {...props} />}
      {page === 'patients' && <Patients {...props} summary={patientSummary} />}
      {page === 'notes' && <Notes {...props} />}
    </div>
  );
}
