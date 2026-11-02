import StatusBadge from './ui/StatusBadge';

const STEPS = [
  { status: 'agendada', title: 'Consulta marcada', text: 'A data e o médico já estão definidos.' },
  {
    status: 'preparada',
    title: 'Preparação enviada',
    text: 'Motivo, sintomas, dúvidas e medicamentos em uso viram um resumo para o médico.',
  },
  {
    status: 'realizada',
    title: 'Orientações registradas',
    text: 'Depois do atendimento, ficam salvos as orientações, os medicamentos e o retorno.',
  },
];

export default function ConsultationFlow() {
  return (
    <>
      <ol className="steps">
        {STEPS.map((step) => (
          <li key={step.status} className="steps__item">
            <span className="steps__title">{step.title}</span>
            <div className="steps__text">
              <p className="mb-2">{step.text}</p>
              <StatusBadge status={step.status} />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 mb-0 text-body-secondary">
        Se uma consulta for desmarcada, ela continua na lista com o status{' '}
        <StatusBadge status="cancelada" />
      </p>
    </>
  );
}
