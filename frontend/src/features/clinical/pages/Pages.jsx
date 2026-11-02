import React, { useState } from 'react';
import {
  Head,
  Empty,
  Status,
  PrepSummary,
  AppointmentTable,
  Field,
  Actions,
} from '../components/UI.jsx';
import { dateBR, whenBR, schedule, isPending } from '../lib/api.js';
export function Appointments({ data, openRequest, view }) {
  const [search, setSearch] = useState('');
  const appts = data.appts.filter((a) =>
    [a.patient, a.doctor, a.reason, a.status]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Head
        eyebrow="CONSULTAS"
        title={data.user.role === 'patient' ? 'Minhas consultas' : 'Solicitações e agenda'}
        description={
          data.user.role === 'patient'
            ? 'Envie o resumo junto com o pedido. O médico definirá a data e a hora.'
            : 'Leia as preparações e aceite consultas escolhendo horários disponíveis.'
        }
        action={
          data.user.role === 'patient' ? (
            <button className="btn primary" onClick={openRequest}>
              ＋ Solicitar consulta
            </button>
          ) : null
        }
      />
      <section className="card">
        <div className="section-title">
          <div>
            <h2>Registros ({data.appts.length})</h2>
            <p>Consulte os pedidos e os horários definidos.</p>
          </div>
          <input
            className="search"
            aria-label="Buscar consultas"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar consulta..."
          />
        </div>
        <AppointmentTable appts={appts} role={data.user.role} onView={view} />
      </section>
    </>
  );
}
export function Preparation({ data, openRequest, view, edit }) {
  const rows = data.appts.filter((a) => a.prep);
  return (
    <>
      <Head
        eyebrow="ANTES DA CONSULTA"
        title="Preparação pré-consulta"
        description="As preparações ficam vinculadas às respectivas consultas."
        action={
          <button className="btn primary" onClick={openRequest}>
            ＋ Nova solicitação
          </button>
        }
      />
      <section className="card">
        <div className="section-title">
          <div>
            <h2>Preparações enviadas ({rows.length})</h2>
            <p>Consulte e atualize os resumos de consultas em andamento.</p>
          </div>
        </div>
        {rows.length ? (
          rows.map((a) => (
            <div className="list-row" key={a.id}>
              <div>
                <strong>
                  {a.doctor} · {a.reason}
                </strong>
                <small>
                  {a.status} · {schedule(a)}
                </small>
              </div>
              <div className="action-row">
                <button className="btn" onClick={() => view(a)}>
                  Ver
                </button>
                {!['Concluída', 'Cancelada'].includes(a.status) && (
                  <button className="btn soft" onClick={() => edit(a)}>
                    Editar resumo
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <Empty
            title="Nenhuma preparação cadastrada"
            description="Preencha a preparação ao solicitar sua primeira consulta."
          />
        )}
      </section>
    </>
  );
}
export function Summaries({ data, view }) {
  const rows = data.appts.filter((a) => a.prep);
  return (
    <>
      <Head
        eyebrow="SEUS REGISTROS"
        title="Resumo pré-consulta"
        description="Visualize as informações enviadas aos profissionais para cada consulta."
      />
      <div className="grid">
        {rows.length ? (
          rows.map((a) => (
            <section className="card" key={a.id}>
              <div className="section-title">
                <div>
                  <h2>
                    {a.doctor} · {schedule(a)}
                  </h2>
                  <p>
                    <Status a={a} />
                  </p>
                </div>
                <button className="btn" onClick={() => view(a)}>
                  Ver consulta
                </button>
              </div>
              <PrepSummary prep={a.prep} name={a.patient || data.user.name} />
            </section>
          ))
        ) : (
          <section className="card">
            <Empty
              title="Nenhum resumo salvo"
              description="Solicite uma consulta e preencha a preparação para criar seu primeiro resumo."
            />
          </section>
        )}
      </div>
    </>
  );
}
export function Followup({ data, mutate, busy }) {
  const [text, setText] = useState('');
  return (
    <>
      <Head
        eyebrow="DEPOIS DA CONSULTA"
        title="Acompanhamento"
        description="Consulte as orientações e registre sua evolução."
      />
      <div className="grid two-col">
        <section className="card">
          <div className="section-title">
            <div>
              <h2>Orientações médicas</h2>
              <p>Registradas pelos profissionais vinculados</p>
            </div>
          </div>
          {data.guidance.length ? (
            data.guidance.map((g) => (
              <div className="list-row" key={g.id}>
                <div>
                  <strong className="pre-wrap">{g.text}</strong>
                  <small>
                    Profissional: {g.doctor} · {whenBR(g.createdAt)}
                    {g.meds ? ' · Medicamentos: ' + g.meds : ''}
                    {g.returnDate ? ' · Retorno: ' + dateBR(g.returnDate) : ''}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Nenhuma orientação registrada"
              description="As orientações dos profissionais aparecerão aqui."
            />
          )}
        </section>
        <section className="card">
          <h2>{data.isAdmin ? 'Acompanhamentos dos usuários' : 'Meu acompanhamento'}</h2>
          <p>Registre como está evoluindo.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await mutate('/api/followups', 'POST', { text })) setText('');
            }}
          >
            <Field label="Observação">
              <textarea
                required
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Como você está desde a consulta?"
              />
            </Field>
            <Actions>
              <button className="btn primary" disabled={busy}>
                Salvar registro
              </button>
            </Actions>
          </form>
          <h2 style={{ marginTop: 24 }}>Histórico ({data.follow.length})</h2>
          {data.follow.length ? (
            data.follow.map((f) => (
              <div className="list-row" key={f.id}>
                <div>
                  <strong className="pre-wrap">{f.text}</strong>
                  <small>{whenBR(f.createdAt)}</small>
                </div>
                <button
                  disabled={busy}
                  className="btn"
                  onClick={() => {
                    if (!busy && window.confirm('Excluir este acompanhamento?'))
                      mutate('/api/followups/' + f.id, 'DELETE');
                  }}
                >
                  Excluir
                </button>
              </div>
            ))
          ) : (
            <p className="stat-note">Nenhum registro.</p>
          )}
        </section>
      </div>
    </>
  );
}
export function Patients({ data, summary }) {
  const [search, setSearch] = useState('');
  const rows = data.patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <Head
        eyebrow="CUIDADO COMPARTILHADO"
        title="Pacientes"
        description="Somente pacientes que solicitaram consulta vinculada a você."
      />
      <section className="card">
        <div className="section-title">
          <div>
            <h2>Pacientes vinculados ({data.patients.length})</h2>
            <p>Os pedidos criam vínculo com o profissional.</p>
          </div>
          <input
            className="search"
            aria-label="Buscar paciente"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Próxima consulta</th>
                  <th>Preparação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {p.nextAppointment
                        ? dateBR(p.nextAppointment.slice(0, 10)) +
                          ' · ' +
                          p.nextAppointment.slice(11)
                        : '—'}
                    </td>
                    <td>
                      <span className={'badge ' + (p.hasPreparation ? 'complete' : 'pending')}>
                        {p.hasPreparation ? 'Salva' : 'Não cadastrada'}
                      </span>
                    </td>
                    <td>
                      <button className="btn" onClick={() => summary(p.id)}>
                        Ver resumo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Nenhum paciente encontrado"
            description="Os pacientes vinculados aparecerão aqui."
          />
        )}
      </section>
    </>
  );
}
export function Notes({ data, mutate, busy }) {
  const [patientId, setPatientId] = useState(''),
    [text, setText] = useState(''),
    [returnDate, setReturnDate] = useState(''),
    [meds, setMeds] = useState('');
  return (
    <>
      <Head
        eyebrow="REGISTROS CLÍNICOS"
        title="Orientações médicas"
        description="Registre orientações apenas para pacientes vinculados ao seu perfil."
      />
      <div className="grid two-col">
        <section className="card">
          <div className="section-title">
            <div>
              <h2>Nova orientação</h2>
              <p>Preencha as informações do atendimento.</p>
            </div>
          </div>
          {data.patients.length ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await mutate('/api/guidance', 'POST', {
                    patientId: patientId || data.patients[0].id,
                    text,
                    returnDate: returnDate || null,
                    meds,
                  })
                ) {
                  setText('');
                  setMeds('');
                  setReturnDate('');
                }
              }}
            >
              <div className="form-grid">
                <Field label="Paciente" full>
                  <select
                    required
                    value={patientId || data.patients[0].id}
                    onChange={(e) => setPatientId(e.target.value)}
                  >
                    {data.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Orientações e próximos passos" full>
                  <textarea
                    required
                    maxLength={4000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Registre as orientações definidas durante o atendimento."
                  />
                </Field>
                <Field label="Data de retorno">
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </Field>
                <Field label="Medicamentos (se aplicável)">
                  <input maxLength={1000} value={meds} onChange={(e) => setMeds(e.target.value)} />
                </Field>
              </div>
              <Actions>
                <button className="btn primary" disabled={busy}>
                  Salvar orientação
                </button>
              </Actions>
            </form>
          ) : (
            <Empty
              title="Nenhum paciente disponível"
              description="O paciente precisa solicitar uma consulta antes de receber orientações."
            />
          )}
        </section>
        <section className="card">
          <h2>Orientações enviadas ({data.guidance.length})</h2>
          {data.guidance.length ? (
            data.guidance.map((g) => (
              <div className="list-row" key={g.id}>
                <div>
                  <strong>{g.patient}</strong>
                  <p className="pre-wrap">{g.text}</p>
                  <small>
                    {whenBR(g.createdAt)}
                    {g.returnDate ? ' · Retorno: ' + dateBR(g.returnDate) : ''}
                  </small>
                </div>
                <button
                  disabled={busy}
                  className="btn"
                  onClick={() => {
                    if (!busy && window.confirm('Excluir esta orientação?'))
                      mutate('/api/guidance/' + g.id, 'DELETE');
                  }}
                >
                  Excluir
                </button>
              </div>
            ))
          ) : (
            <Empty
              title="Nenhuma orientação cadastrada"
              description="As orientações enviadas serão exibidas aqui."
            />
          )}
        </section>
      </div>
    </>
  );
}
