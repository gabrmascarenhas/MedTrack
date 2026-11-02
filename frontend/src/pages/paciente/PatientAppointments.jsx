import { CalendarPlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function PatientAppointments() {
  return (
    <>
      <PageHeader
        title="Minhas consultas"
        description="Consultas agendadas, preparadas e já realizadas."
      />
      <EmptyState
        icon={CalendarPlus}
        title="Nenhuma consulta ainda"
        text="Você ainda não tem consultas. Quando agendar uma, ela aparece aqui."
      />
    </>
  );
}
