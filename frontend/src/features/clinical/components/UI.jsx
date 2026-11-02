import React, { useId } from 'react';
import BootstrapModal from 'react-bootstrap/Modal';
import PageHeader from '../../../components/ui/PageHeader';
import { dateBR, schedule, badgeClass } from '../lib/api.js';
export function Head({ eyebrow, title, description, action }) {
  return (
    <div className="clinical-heading">
      <div className="eyebrow">{eyebrow}</div>
      <PageHeader title={title} description={description} actions={action} />
    </div>
  );
}
export function Empty({ title, description }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        ♡
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function Status({ a }) {
  return <span className={'badge ' + badgeClass(a)}>{a.status}</span>;
}
export function Stat({ label, value, note, icon }) {
  return (
    <div className="card stat lift">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-num">{value}</div>
        <div className="stat-note">{note}</div>
      </div>
      <div className="stat-icon" aria-hidden="true">
        {icon}
      </div>
    </div>
  );
}
export function AppointmentRow({ a, role, onView }) {
  return (
    <div className="appointment">
      <div className="datebox">
        <small>
          {a.date
            ? new Date(`${a.date}T12:00:00`)
                .toLocaleDateString('pt-BR', { month: 'short' })
                .replaceAll('.', '')
            : '—'}
        </small>
        <b>{a.date ? a.date.slice(8, 10) : '?'}</b>
      </div>
      <div className="appt-info">
        <strong>{role === 'doctor' ? a.patient : a.doctor}</strong>
        <small>
          {a.reason} · {schedule(a)}
        </small>
      </div>
      <Status a={a} />
      <button className="btn" onClick={() => onView(a)}>
        Ver
      </button>
    </div>
  );
}
export function PrepSummary({ prep, name }) {
  return prep ? (
    <>
      <div className="section-title">
        <div>
          <h2>Resumo de {name}</h2>
          <p>
            Atualizado em: {prep.updatedAt ? new Date(prep.updatedAt).toLocaleString('pt-BR') : '—'}
          </p>
        </div>
        <span className="badge complete">Salvo</span>
      </div>
      <div className="grid two-col">
        <div>
          <div className="eyebrow">Motivo da consulta</div>
          <p className="pre-wrap">{prep.reason}</p>
          <br />
          <div className="eyebrow">Sintomas e contexto</div>
          <p className="pre-wrap">{prep.symptoms}</p>
        </div>
        <div>
          <div className="eyebrow">Dúvidas</div>
          <p className="pre-wrap">{prep.questions || 'Não informado'}</p>
          <br />
          <div className="eyebrow">Medicamentos em uso</div>
          <p className="pre-wrap">{prep.meds || 'Não informado'}</p>
        </div>
      </div>
    </>
  ) : (
    <Empty
      title="Resumo não cadastrado"
      description="Não foi encontrada preparação para esta consulta."
    />
  );
}
export function Field({ label, children, full = false }) {
  const id = useId();
  const control = React.Children.only(children);
  const controlId = control.props.id || id;
  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label htmlFor={controlId}>{label}</label>
      {React.cloneElement(control, { id: controlId })}
    </div>
  );
}
export function Modal({ title, onClose, children, busy = false }) {
  return (
    <BootstrapModal
      show
      size="lg"
      centered
      scrollable
      onHide={busy ? undefined : onClose}
      keyboard={!busy}
      backdrop={busy ? 'static' : true}
      className="recovered-ui clinical-modal"
    >
      <BootstrapModal.Header closeButton={!busy} closeLabel="Fechar">
        <BootstrapModal.Title as="h2">{title}</BootstrapModal.Title>
      </BootstrapModal.Header>
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}
export function Actions({ children }) {
  return (
    <div className="form-actions" style={{ flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}
export function AppointmentTable({ appts, role, onView }) {
  return appts.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{role === 'doctor' ? 'Paciente' : 'Profissional'}</th>
            <th>Motivo</th>
            <th>Data / horário</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {appts.map((a) => (
            <tr key={a.id}>
              <td>{role === 'doctor' ? a.patient : a.doctor}</td>
              <td>{a.reason}</td>
              <td>{schedule(a)}</td>
              <td>
                <Status a={a} />
              </td>
              <td>
                <button className="btn" onClick={() => onView(a)}>
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Nenhuma consulta encontrada"
      description="Os registros cadastrados aparecerão aqui."
    />
  );
}
