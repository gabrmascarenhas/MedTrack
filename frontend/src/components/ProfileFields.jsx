import { Form } from 'react-bootstrap';
import { genderOptions, localToday, brazilStates } from '../services/profile';

export default function ProfileFields({
  value,
  onChange,
  professional = false,
  prefix = 'profile',
  disabled = false,
}) {
  const change = (field, next) =>
    onChange({
      ...value,
      [field]: next,
      ...(field === 'gender' && next !== 'self_described' ? { genderDescription: '' } : {}),
    });
  return (
    <fieldset disabled={disabled}>
      <Form.Group className="mb-4" controlId={`${prefix}-birth-date`}>
        <Form.Label>Data de nascimento (opcional)</Form.Label>
        <Form.Control
          type="date"
          autoComplete="bday"
          max={localToday()}
          value={value.birthDate}
          onChange={(e) => change('birthDate', e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-4" controlId={`${prefix}-gender`}>
        <Form.Label>Gênero (opcional)</Form.Label>
        <Form.Select
          value={value.gender}
          onChange={(e) => change('gender', e.target.value)}
          aria-describedby={`${prefix}-gender-help`}
        >
          <option value="">Selecione, se desejar</option>
          {genderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text id={`${prefix}-gender-help`}>
          Escolha como você se identifica. Mulher e homem incluem pessoas cis e trans.
        </Form.Text>
      </Form.Group>
      {value.gender === 'self_described' && (
        <Form.Group className="mb-4" controlId={`${prefix}-gender-description`}>
          <Form.Label>Como você descreve seu gênero? (opcional)</Form.Label>
          <Form.Control
            maxLength={120}
            value={value.genderDescription}
            onChange={(e) => change('genderDescription', e.target.value)}
          />
        </Form.Group>
      )}
      {professional && (
        <>
          <Form.Group className="mb-4" controlId={`${prefix}-specialty`}>
            <Form.Label>Especialidade (opcional)</Form.Label>
            <Form.Control
              maxLength={120}
              placeholder="Ex.: Clínica médica"
              value={value.specialty}
              onChange={(e) => change('specialty', e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId={`${prefix}-crm`}>
            <Form.Label>Número do CRM</Form.Label>
            <Form.Control
              inputMode="numeric"
              pattern="[0-9]{1,10}"
              maxLength={10}
              required={Boolean(value.crmUf)}
              value={value.crm ?? ''}
              onChange={(e) => change('crm', e.target.value)}
              aria-describedby={`${prefix}-crm-help`}
            />
            <Form.Text id={`${prefix}-crm-help`}>
              Opcional. Se informar, preencha também a UF. Use apenas números.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-4" controlId={`${prefix}-crm-uf`}>
            <Form.Label>UF do CRM</Form.Label>
            <Form.Select
              required={Boolean(value.crm)}
              value={value.crmUf ?? ''}
              onChange={(e) => change('crmUf', e.target.value)}
            >
              <option value="">Selecione a UF</option>
              {brazilStates.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </>
      )}
    </fieldset>
  );
}
