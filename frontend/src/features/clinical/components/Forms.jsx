import React, { useState } from 'react';
import { Field, Actions } from './UI.jsx';
import { today, schedule, dateBR } from '../lib/api.js';
const blank = { reason: '', symptoms: '', questions: '', meds: '' };
export function PrepFields({ value, onChange }) {
  return (
    <div className="form-grid">
      <Field label="Motivo da consulta *" full>
        <textarea
          value={value.reason}
          onChange={(e) => onChange({ ...value, reason: e.target.value })}
          maxLength={500}
          required
          placeholder="Por que você está solicitando atendimento?"
        />
      </Field>
      <Field label="Sintomas ou contexto *" full>
        <textarea
          value={value.symptoms}
          onChange={(e) => onChange({ ...value, symptoms: e.target.value })}
          maxLength={4000}
          required
          placeholder="Desde quando? O que mudou?"
        />
      </Field>
      <Field label="Dúvidas para o profissional" full>
        <textarea
          value={value.questions}
          onChange={(e) => onChange({ ...value, questions: e.target.value })}
          maxLength={4000}
          placeholder="Quais questões gostaria de esclarecer?"
        />
      </Field>
      <Field label="Medicamentos em uso" full>
        <textarea
          value={value.meds}
          onChange={(e) => onChange({ ...value, meds: e.target.value })}
          maxLength={4000}
          placeholder="Informe apenas se desejar"
        />
      </Field>
    </div>
  );
}
export function RequestForm({ doctors, onSave, onCancel, busy }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [prep, setPrep] = useState(blank);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ doctorId, preparation: prep });
      }}
    >
      <div className="notice">
        A preparação será enviada ao médico junto com o pedido. A data e o horário serão definidos
        por ele.
      </div>
      {!doctors.length && (
        <p className="notice" role="status">
          Ainda não há médicos disponíveis para receber solicitações. Contas administrativas não
          aparecem como profissionais.
        </p>
      )}
      <Field label="Profissional *">
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">Escolha um médico cadastrado</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <PrepFields value={prep} onChange={setPrep} />
      <Actions>
        <button disabled={busy} className="btn" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button disabled={busy || !doctors.length} className="btn primary" type="submit">
          Enviar solicitação e preparação →
        </button>
      </Actions>
    </form>
  );
}
export function EditPrepForm({ appt, onSave, onCancel, busy }) {
  const [prep, setPrep] = useState(appt.prep || blank);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(prep);
      }}
    >
      <PrepFields value={prep} onChange={setPrep} />
      <Actions>
        <button disabled={busy} type="button" className="btn" onClick={onCancel}>
          Voltar
        </button>
        <button className="btn primary" disabled={busy}>
          Salvar alterações
        </button>
      </Actions>
    </form>
  );
}
export function ScheduleForm({ appt, onSave, onCancel, busy }) {
  const [date, setDate] = useState(appt.requestedDate || appt.date || '');
  const [time, setTime] = useState(appt.requestedTime || appt.time || '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ status: 'Aceito', date, time });
      }}
    >
      <p>
        Paciente: <strong>{appt.patient}</strong>
      </p>
      <p className="stat-note">
        Escolha um dia e horário disponível; a consulta passará para o status Aceito.
      </p>
      {appt.status === 'Remarcação solicitada' && (
        <div className="notice">
          <strong>Preferência do paciente:</strong>{' '}
          {appt.requestedDate ? dateBR(appt.requestedDate) : 'Qualquer dia'} ·{' '}
          {appt.requestedTime || 'Qualquer horário'}
          <p className="pre-wrap">{appt.rescheduleNote}</p>
        </div>
      )}
      <div className="form-grid">
        <Field label="Data *">
          <input
            type="date"
            min={today()}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Horário *">
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Actions>
        <button disabled={busy} type="button" className="btn" onClick={onCancel}>
          Voltar
        </button>
        <button className="btn primary" disabled={busy || !date || !time}>
          Aceitar consulta →
        </button>
      </Actions>
    </form>
  );
}
export function RescheduleForm({ appt, onSave, onCancel, busy }) {
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          status: 'Remarcação solicitada',
          requestedDate: requestedDate || null,
          requestedTime: requestedTime || null,
          rescheduleNote,
        });
      }}
    >
      <p>
        Consulta atual: <b>{schedule(appt)}</b>
      </p>
      <p className="stat-note">
        Informe outro dia, horário ou uma observação. O médico escolherá uma nova disponibilidade.
      </p>
      <div className="form-grid">
        <Field label="Outro dia desejado">
          <input
            type="date"
            min={today()}
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
          />
        </Field>
        <Field label="Outro horário desejado">
          <input
            type="time"
            value={requestedTime}
            onChange={(e) => setRequestedTime(e.target.value)}
          />
        </Field>
        <Field label="Observação" full>
          <textarea
            maxLength={1000}
            value={rescheduleNote}
            onChange={(e) => setRescheduleNote(e.target.value)}
            placeholder="Ex.: posso apenas depois das 14h"
          />
        </Field>
      </div>
      <Actions>
        <button disabled={busy} type="button" className="btn" onClick={onCancel}>
          Voltar
        </button>
        <button
          disabled={busy || (!requestedDate && !requestedTime && !rescheduleNote.trim())}
          className="btn primary"
        >
          Pedir remarcação
        </button>
      </Actions>
    </form>
  );
}
