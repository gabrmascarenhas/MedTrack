import { CalendarDays } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function DoctorSchedule() {
  return (
    <>
      <PageHeader
        title="Agenda"
        description="Suas consultas, com o resumo de preparação de cada paciente."
      />
      <EmptyState
        icon={CalendarDays}
        title="Nenhuma consulta na agenda"
        text="Quando um paciente marcar uma consulta com você, ela aparece aqui junto com o resumo que ele preparou."
      />
    </>
  );
}
