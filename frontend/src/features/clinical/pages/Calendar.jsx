import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Head, AppointmentTable } from '../components/UI';
import { today, isPending } from '../lib/api';
import { calendarDate, monthDays, groupAppointments } from '../lib/calendar';

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const fullDate = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
export default function Calendar({ data, view }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 12);
  });
  const [selected, setSelected] = useState(today);
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () =>
      data.appts.filter((item) =>
        [item.patient, item.doctor, item.reason, item.status]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(search.trim().toLocaleLowerCase('pt-BR')),
      ),
    [data.appts, search],
  );
  const grouped = useMemo(() => groupAppointments(filtered), [filtered]);
  const days = monthDays(month.getFullYear(), month.getMonth());
  const label = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedRows = grouped[selected] || [];
  const pending = filtered.filter(isPending);
  function changeMonth(offset) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12);
    setMonth(next);
    setSelected(calendarDate(next));
  }
  function goToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12));
    setSelected(calendarDate(now));
  }
  return (
    <>
      <Head
        eyebrow="AGENDA DE CONSULTAS"
        title="Minha agenda"
        description="Veja os dias com consultas e selecione uma data para conferir os atendimentos."
      />
      <div className="clinical-calendar-search">
        <label htmlFor="calendar-search">Buscar consultas</label>
        <input
          id="calendar-search"
          className="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Paciente, motivo ou status"
        />
      </div>
      <div className="clinical-calendar-layout">
        <section className="card clinical-calendar" aria-labelledby="calendar-month">
          <div className="clinical-calendar-toolbar">
            <h2 id="calendar-month" aria-live="polite">
              {label}
            </h2>
            <div>
              <button
                type="button"
                className="btn"
                aria-label="Mês anterior"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="btn" onClick={goToday}>
                Hoje
              </button>
              <button
                type="button"
                className="btn"
                aria-label="Próximo mês"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <table className="clinical-calendar-grid">
            <caption className="visually-hidden">
              Agenda de {label}. Selecione um dia para ver as consultas.
            </caption>
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th scope="col" key={day}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week}>
                  {days.slice(week * 7, week * 7 + 7).map((date, index) => {
                    if (!date) return <td key={`empty-${index}`} aria-hidden="true" />;
                    const records = grouped[date] || [];
                    const hasPending = records.some(isPending);
                    const completed =
                      records.length > 0 && records.every((item) => item.status === 'Concluída');
                    const status = hasPending ? 'reschedule' : completed ? 'completed' : 'booked';
                    return (
                      <td key={date}>
                        <button
                          type="button"
                          className={`clinical-calendar-day ${records.length ? 'has-appointments ' + status : ''} ${selected === date ? 'is-selected' : ''}`}
                          aria-pressed={selected === date}
                          aria-current={date === today() ? 'date' : undefined}
                          aria-label={`${fullDate(date)}: ${records.length} consulta${records.length === 1 ? '' : 's'}${hasPending ? ', com pedido de remarcação' : ''}`}
                          onClick={() => setSelected(date)}
                        >
                          <span>{Number(date.slice(-2))}</span>
                          {records.length > 0 && (
                            <span className="clinical-calendar-count" aria-hidden="true">
                              {records.length}
                              <CalendarDays size={12} />
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="clinical-calendar-legend">
            <span>
              <i className="booked" />
              Consulta marcada
            </span>
            <span>
              <i className="reschedule" />
              Remarcação pendente
            </span>
            <span>
              <i className="completed" />
              Concluída
            </span>
          </div>
          <p className="stat-note">
            O número no dia indica a quantidade de consultas. Consultas canceladas não marcam o
            calendário.{search.trim() ? ' A busca também filtra os dias destacados.' : ''}
          </p>
        </section>
        <section className="card clinical-calendar-selected" aria-labelledby="selected-day">
          <h2 id="selected-day">Consultas do dia</h2>
          <p className="clinical-calendar-date" aria-live="polite">
            {fullDate(selected)}
          </p>
          <AppointmentTable appts={selectedRows} role="doctor" onView={view} />
        </section>
      </div>
      <section className="card clinical-calendar-pending">
        <div className="section-title">
          <div>
            <h2>Solicitações e remarcações ({pending.length})</h2>
            <p>Abra os detalhes para definir ou atualizar a data e o horário.</p>
          </div>
        </div>
        <AppointmentTable appts={pending} role="doctor" onView={view} />
      </section>
      <details className="card clinical-calendar-history">
        <summary>Todos os registros ({filtered.length}), incluindo cancelados</summary>
        <AppointmentTable appts={filtered} role="doctor" onView={view} />
      </details>
    </>
  );
}
