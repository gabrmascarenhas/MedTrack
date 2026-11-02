import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import ProfileFields from '../../components/ProfileFields';

export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [details, setDetails] = useState({
    birthDate: user.birthDate ?? user.data_nascimento ?? '',
    gender: user.gender ?? '',
    genderDescription: user.genderDescription ?? '',
    specialty: user.specialty ?? user.especialidade ?? '',
    crm: user.crm ?? '',
    crmUf: user.crmUf ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({ name, email, ...details });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Meu cadastro"
        description="Atualize seus dados. Data de nascimento e gênero são opcionais."
      />
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {saved && (
        <Alert variant="success" role="status">
          Cadastro atualizado.
        </Alert>
      )}
      <Form onSubmit={save} className="panel">
        <fieldset disabled={saving}>
          <Form.Group className="mb-4" controlId="profile-name">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="profile-email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              required
              maxLength={254}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
          <ProfileFields
            value={details}
            onChange={setDetails}
            professional={['medico', 'admin'].includes(user.tipo_usuario)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </fieldset>
      </Form>
    </>
  );
}
