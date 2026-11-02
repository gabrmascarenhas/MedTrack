import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { useClinical } from './ClinicalContext';
import { Modal, Status, PrepSummary, Empty, Actions, Field } from './components/UI';
import { RequestForm, EditPrepForm, ScheduleForm, RescheduleForm } from './components/Forms';
import { dateBR, whenBR, schedule, isPending } from './lib/api';

function AdminRequest({ data, busy, onSave, onCancel }) {
  const [patientId, setPatientId] = useState('');
  return (
    <>
      <Field label="Paciente da solicitação">
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} disabled={busy}>
          <option value="">Minha própria conta</option>
          {data.patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <RequestForm
        doctors={data.doctors}
        busy={busy}
        onCancel={onCancel}
        onSave={(payload) => onSave({ ...payload, ...(patientId ? { patientId } : {}) })}
      />
    </>
  );
}
export default function ClinicalModal() {
  const { pathname } = useLocation();
  const { data, modal, setModal, error, busy, mutate, view } = useClinical();
  if (!modal || !data) return null;
  const a = modal.appt,
    doctor = pathname.startsWith('/medico'),
    admin = data.user.role === 'admin';
  const close = () => {
    if (!busy) setModal(null);
  };
  const shell = (title, body) => (
    <Modal title={title} onClose={close} busy={busy}>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {body}
    </Modal>
  );
  if (modal.kind === 'request') {
    const props = {
      doctors: data.doctors,
      busy,
      onCancel: close,
      onSave: (payload) => mutate('/api/appointments', 'POST', payload, true),
    };
    return shell(
      'Solicitar consulta',
      admin ? <AdminRequest data={data} {...props} /> : <RequestForm {...props} />,
    );
  }
  if (modal.kind === 'editPrep')
    return shell(
      'Editar preparação pré-consulta',
      <EditPrepForm
        key={a.id}
        appt={a}
        busy={busy}
        onCancel={() => view(a)}
        onSave={(payload) => mutate(`/api/appointments/${a.id}/preparation`, 'PUT', payload, true)}
      />,
    );
  if (modal.kind === 'schedule')
    return shell(
      a.status === 'Remarcação solicitada' ? 'Remarcar consulta' : 'Aceitar solicitação',
      <ScheduleForm
        key={a.id}
        appt={a}
        busy={busy}
        onCancel={() => view(a)}
        onSave={(payload) => mutate(`/api/appointments/${a.id}`, 'PATCH', payload, true)}
      />,
    );
  if (modal.kind === 'reschedule')
    return shell(
      'Solicitar remarcação',
      <RescheduleForm
        key={a.id}
        appt={a}
        busy={busy}
        onCancel={() => view(a)}
        onSave={(payload) => mutate(`/api/appointments/${a.id}`, 'PATCH', payload, true)}
      />,
    );
  if (modal.kind === 'patientSummary') {
    const { summary } = modal;
    return shell(
      `Resumos de ${summary.patient.name}`,
      <>
        {summary.appointments.length ? (
          summary.appointments.map((item) => (
            <section className="clinical-summary" key={item.id}>
              <p>
                <strong>{schedule(item)}</strong> · <Status a={item} />
              </p>
              <PrepSummary prep={item.prep} name={summary.patient.name} />
            </section>
          ))
        ) : (
          <Empty title="Nenhuma consulta" description="Ainda não há consultas vinculadas." />
        )}
        <h3>Acompanhamentos ({summary.follow.length})</h3>
        {summary.follow.map((item) => (
          <div className="list-row" key={item.id}>
            <div>
              <strong className="pre-wrap">{item.text}</strong>
              <small>{whenBR(item.createdAt)}</small>
            </div>
          </div>
        ))}
      </>,
    );
  }
  if (modal.kind !== 'appointment') return null;
  return shell(
    'Detalhes da consulta',
    <>
      {[
        ['Paciente', a.patient],
        ['Profissional', a.doctor],
        ['Data e horário', schedule(a)],
        ['Motivo', a.reason],
        ['Status', a.status],
      ].map(([label, value]) => (
        <div className="list-row" key={label}>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
      {a.status === 'Remarcação solicitada' && (
        <div className="notice">
          <strong>Pedido de remarcação</strong>
          <p>
            Dia sugerido: {a.requestedDate ? dateBR(a.requestedDate) : 'Não informado'} · Hora:{' '}
            {a.requestedTime || 'Não informado'}
          </p>
          <p className="pre-wrap">{a.rescheduleNote}</p>
        </div>
      )}
      <div className="clinical-summary">
        <PrepSummary prep={a.prep} name={a.patient} />
      </div>
      <Actions>
        <button className="btn" disabled={busy} onClick={close}>
          Fechar
        </button>
        {(doctor || admin) && isPending(a) && (
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => setModal({ kind: 'schedule', appt: a })}
          >
            {a.status === 'Remarcação solicitada'
              ? 'Definir novo horário'
              : 'Aceitar e definir horário'}
          </button>
        )}
        {(doctor || admin) && a.status === 'Aceito' && (
          <button
            className="btn primary"
            disabled={busy}
            onClick={() =>
              mutate(`/api/appointments/${a.id}`, 'PATCH', { status: 'Concluída' }, true)
            }
          >
            Concluir consulta
          </button>
        )}
        {(!doctor || admin) && a.status === 'Aceito' && (
          <button
            className="btn soft"
            disabled={busy}
            onClick={() => setModal({ kind: 'reschedule', appt: a })}
          >
            Solicitar outro dia/horário
          </button>
        )}
        {(!doctor || admin) && a.prep && !['Concluída', 'Cancelada'].includes(a.status) && (
          <button
            className="btn"
            disabled={busy}
            onClick={() => setModal({ kind: 'editPrep', appt: a })}
          >
            Editar preparação
          </button>
        )}
        {!['Concluída', 'Cancelada'].includes(a.status) && (
          <button
            className="btn"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Cancelar esta consulta?'))
                mutate(`/api/appointments/${a.id}`, 'PATCH', { status: 'Cancelada' }, true);
            }}
          >
            Cancelar consulta
          </button>
        )}
        {['Solicitada', 'Remarcação solicitada', 'Cancelada'].includes(a.status) && (
          <button
            className="btn clinical-danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Excluir definitivamente esta consulta?'))
                mutate(`/api/appointments/${a.id}`, 'DELETE', undefined, true);
            }}
          >
            Excluir
          </button>
        )}
      </Actions>
    </>,
  );
}
