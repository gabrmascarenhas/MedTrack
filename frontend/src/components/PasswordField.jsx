import { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  disabled = false,
  errorProps = {},
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Form.Group className="mb-4" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <Form.Control
          type={visible ? 'text' : 'password'}
          required
          maxLength={128}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...errorProps}
        />
        <Button
          type="button"
          variant="outline-secondary"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          <span className="ms-2">{visible ? 'Ocultar' : 'Mostrar'}</span>
        </Button>
      </InputGroup>
    </Form.Group>
  );
}
