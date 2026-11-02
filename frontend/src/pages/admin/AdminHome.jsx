import { useEffect, useState } from 'react';
import { Alert, Button, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import { useAuth } from '../../context/AuthContext';

const profiles = { patient: 'Paciente', doctor: 'Médico', admin: 'Administrador' };
export default function AdminHome() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .get('/admin/users')
      .then(({ data }) => {
        if (active) setUsers(data.users);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/users/${editing.id}`, {
        name: editing.name,
        email: editing.email,
      });
      setUsers((rows) => rows.map((row) => (row.id === data.user.id ? data.user : row)));
      setEditing(null);
      setMessage('Dados atualizados.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Administração"
        description="Gerencie os usuários e acesse as áreas de paciente e médico."
      />
      <div className="d-flex flex-wrap gap-3 mb-4">
        <Link className="btn btn-outline-primary" to="/paciente">
          Área do paciente
        </Link>
        <Link className="btn btn-outline-primary" to="/medico">
          Área do médico
        </Link>
      </div>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" role="status">
          {message}
        </Alert>
      )}
      {editing && (
        <Form onSubmit={save} className="panel mb-4">
          <h2 className="h4">Editar usuário</h2>
          <Form.Group controlId="admin-name" className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              required
              maxLength={120}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group controlId="admin-email" className="mb-3">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              required
              maxLength={254}
              value={editing.email}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>{' '}
          <Button variant="outline-secondary" disabled={saving} onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        </Form>
      )}
      {loading ? (
        <LoadingState label="Carregando usuários" />
      ) : (
        <Table responsive striped>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{profiles[user.role]}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={saving || user.id === currentUser.id_usuario}
                    onClick={() => {
                      setEditing({ ...user });
                      setError('');
                      setMessage('');
                    }}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
