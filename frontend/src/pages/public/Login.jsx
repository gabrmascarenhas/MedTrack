import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demoCredentials, useMockAuth } from '../../services/authService';
import { homeFor } from '../../routes/paths';
import PasswordField from '../../components/PasswordField';
import ProfileFields from '../../components/ProfileFields';
import { emptyProfile } from '../../services/profile';
import LoadingState from '../../components/ui/LoadingState';

export default function Login() {
  const { login, register, isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const creating = location.pathname === '/cadastro';
  const [details, setDetails] = useState({ ...emptyProfile });
  const [name, setName] = useState('');
  const [profile, setProfile] = useState(() =>
    new URLSearchParams(location.search).get('perfil') === 'doctor' ? 'doctor' : 'patient',
  );
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = creating ? 'Criar conta · MedTrack' : 'Entrar · MedTrack';
    setSenha('');
    setConfirmation('');
    setError('');
  }, [creating]);

  useEffect(() => {
    setProfile(
      new URLSearchParams(location.search).get('perfil') === 'doctor' ? 'doctor' : 'patient',
    );
  }, [location.search]);

  if (loading) return <LoadingState label="Verificando sua sessão" />;
  if (isAuthenticated && !submitting) return <Navigate to={homeFor(user)} replace />;

  async function signIn(credentials) {
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = creating
        ? await register(name, credentials.email, credentials.senha, profile, details)
        : await login(credentials.email, credentials.senha);
      const home = homeFor(loggedUser);
      // Volta para a página que pediu login, desde que pertença ao perfil de quem entrou
      const from = location.state?.from;
      navigate(from?.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Não foi possível entrar agora. Tente de novo em instantes.');
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !senha) {
      setError('Informe o e-mail e a senha para entrar.');
      return;
    }
    if (creating && (!name.trim() || senha.length < 8)) {
      setError('Informe seu nome e uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (creating && senha !== confirmation) {
      setError('As senhas não coincidem. Confira a confirmação de senha.');
      return;
    }
    signIn({ email, senha });
  }

  const errorProps = error ? { 'aria-describedby': 'login-error', 'aria-invalid': true } : {};

  return (
    <div className="recovered-ui recovered-login">
      <div className="login-screen">
        <section className="login-story">
          <div className="brand">
            <div className="brand-mark">✚</div>
            <div>
              MedTrack<small>CUIDADO CONTÍNUO</small>
            </div>
          </div>
          <div className="story-copy">
            <span className="story-tag">
              <span className="dot" />
              Saúde conectada, com mais clareza
            </span>
            <h2>
              Uma consulta
              <br />
              melhor começa
              <br />
              <em>antes dela.</em>
            </h2>
            <p>
              Organize suas dúvidas, compartilhe o que importa e acompanhe os próximos passos com
              mais tranquilidade.
            </p>
          </div>
          <div className="story-bottom">
            <span />
            Preparar · Organizar · Comunicar · Acompanhar
          </div>
        </section>
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-card">
            <h1 id="login-title">{creating ? 'Criar conta' : 'Entrar'}</h1>
            <p className="text-body-secondary mb-5">
              {creating
                ? profile === 'doctor'
                  ? 'Crie seu perfil de médico parceiro.'
                  : 'Crie seu perfil e comece sua jornada no MedTrack.'
                : 'Use o e-mail e a senha da sua conta.'}
            </p>

            {error && (
              <Alert variant="danger" role="alert" id="login-error">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {creating && (
                <>
                  <Form.Group className="mb-4" controlId="register-name">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="register-role">
                    <Form.Label>Perfil</Form.Label>
                    <Form.Select
                      value={profile}
                      onChange={(e) => {
                        setProfile(e.target.value);
                        navigate(`/cadastro?perfil=${e.target.value}`, { replace: true });
                      }}
                    >
                      <option value="patient">Paciente</option>
                      <option value="doctor">Médico</option>
                    </Form.Select>
                  </Form.Group>
                  <ProfileFields
                    value={details}
                    onChange={setDetails}
                    professional={profile === 'doctor'}
                    prefix="register"
                    disabled={submitting}
                  />
                </>
              )}
              <Form.Group className="mb-4" controlId="login-email">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  {...errorProps}
                />
              </Form.Group>
              <PasswordField
                key={creating ? 'register-password' : 'login-password'}
                id="login-senha"
                label="Senha"
                autoComplete={creating ? 'new-password' : 'current-password'}
                minLength={creating ? 8 : undefined}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={submitting}
                errorProps={errorProps}
              />
              {creating && (
                <PasswordField
                  id="register-confirmation"
                  label="Confirmar senha"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={submitting}
                  errorProps={errorProps}
                />
              )}
              <Button type="submit" variant="primary" disabled={submitting} className="w-100">
                {submitting && <Spinner size="sm" aria-hidden="true" />}
                {submitting ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}
              </Button>
            </Form>

            {!useMockAuth && (
              <Button
                variant="link"
                disabled={submitting}
                onClick={() => {
                  navigate(creating ? '/login' : '/cadastro');
                  setSenha('');
                  setConfirmation('');
                  setError('');
                }}
              >
                {creating ? 'Já tenho conta' : 'Criar uma conta'}
              </Button>
            )}
            {useMockAuth && (
              <div className="demo-access">
                <h2 className="h4 mb-1">Acesso de demonstração</h2>
                <p className="text-body-secondary small mb-3">
                  Entre com uma conta fictícia para conhecer cada perfil.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="outline-primary"
                    disabled={submitting}
                    onClick={() => signIn(demoCredentials.paciente)}
                  >
                    <UserRound size={18} aria-hidden="true" />
                    Entrar como paciente demo
                  </Button>
                  <Button
                    variant="outline-primary"
                    disabled={submitting}
                    onClick={() => signIn(demoCredentials.medico)}
                  >
                    <Stethoscope size={18} aria-hidden="true" />
                    Entrar como médico demo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>{' '}
      </div>
    </div>
  );
}
