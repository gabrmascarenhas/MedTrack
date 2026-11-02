import React from 'react';
import { Head, Empty, Stat, AppointmentRow } from '../components/UI.jsx';
import { isPending } from '../lib/api.js';
export default function Dashboard({ data, go, openRequest, view }) {
  const patient = data.user.role === 'patient',
    appts = data.appts;
  const future = appts
    .filter(
      (a) =>
        a.status === 'Aceito' && a.date && a.time && new Date(`${a.date}T${a.time}`) >= new Date(),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pending = appts.filter(isPending);
  const cards = patient
    ? [
        [
          'Consultas aceitas',
          appts.filter((a) => a.status === 'Aceito').length,
          'Com data e hora',
          '▣',
        ],
        ['Pedidos em andamento', pending.length, 'Aguardando o profissional', '✚'],
        [
          'Resumos pré-consulta',
          appts.filter((a) => a.prep).length,
          'Organizados por consulta',
          '▤',
        ],
        ['Orientações recebidas', data.guidance.length, 'Enviadas pelo profissional', '↗'],
      ]
    : [
        ['Solicitações pendentes', pending.length, 'Para analisar', '✚'],
        [
          'Consultas aceitas',
          appts.filter((a) => a.status === 'Aceito').length,
          'Com data e hora',
          '▣',
        ],
        ['Pacientes vinculados', data.patients.length, 'Solicitaram atendimento', '♡'],
        ['Orientações registradas', data.guidance.length, 'Disponíveis aos pacientes', '▤'],
      ];
  return (
    <>
      <Head
        eyebrow={patient ? 'ÁREA DO PACIENTE' : 'PAINEL CLÍNICO'}
        title={`Olá, ${data.user.name.split(' ')[0]} 👋`}
        description={
          patient
            ? 'Solicite atendimento e envie a preparação junto com o pedido.'
            : 'Analise os pedidos e escolha o dia e o horário do atendimento.'
        }
        action={
          <button
            className="btn primary"
            onClick={patient ? openRequest : () => go('appointments')}
          >
            {patient ? '＋ Solicitar consulta' : 'Ver solicitações →'}
          </button>
        }
      />
      <div className="banner">
        <div className="banner-copy">
          <h2>
            {patient
              ? 'Sua consulta começa com uma boa preparação.'
              : 'Cada solicitação vem com um resumo do paciente.'}
          </h2>
          <p>
            {patient
              ? 'Descreva os sintomas e as dúvidas. O médico define o dia e o horário.'
              : 'Leia a preparação antes de aceitar. O paciente poderá solicitar remarcação.'}
          </p>
        </div>
        <button className="btn" onClick={() => go(patient ? 'summary' : 'appointments')}>
          {patient ? 'Meus resumos' : 'Analisar pedidos'} →
        </button>
      </div>
      <div className="grid stats">
        {cards.map(([label, value, note, icon]) => (
          <Stat key={label} label={label} value={value} note={note} icon={icon} />
        ))}
      </div>
      <div className="grid two-col">
        <section className="card">
          <div className="section-title">
            <div>
              <h2>{patient ? 'Consultas aceitas' : 'Próximos atendimentos'}</h2>
              <p>Datas confirmadas</p>
            </div>
            <button className="btn" onClick={() => go('appointments')}>
              Ver todas
            </button>
          </div>
          {future.length ? (
            future
              .slice(0, 4)
              .map((a) => <AppointmentRow key={a.id} a={a} role={data.user.role} onView={view} />)
          ) : (
            <Empty
              title="Nenhuma consulta aceita"
              description="Os horários definidos pelo médico aparecerão aqui."
            />
          )}
        </section>
        <section className="card">
          <div className="section-title">
            <div>
              <h2>{patient ? 'Solicitações em andamento' : 'Pedidos para analisar'}</h2>
              <p>
                {patient
                  ? 'Aguardando dia, horário ou remarcação'
                  : 'Com preparação pré-consulta anexada'}
              </p>
            </div>
          </div>
          {pending.length ? (
            pending
              .slice(0, 4)
              .map((a) => <AppointmentRow key={a.id} a={a} role={data.user.role} onView={view} />)
          ) : (
            <Empty
              title="Nenhuma solicitação pendente"
              description="As próximas solicitações aparecerão aqui."
            />
          )}
        </section>
      </div>
    </>
  );
}
