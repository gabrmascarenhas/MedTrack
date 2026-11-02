import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';
import EditProfile from '../pages/shared/EditProfile';
import AdminHome from '../pages/admin/AdminHome';
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import NotFound from '../pages/public/NotFound';
import PatientHome from '../pages/paciente/PatientHome';
import PatientAppointments from '../pages/paciente/PatientAppointments';
import DoctorHome from '../pages/medico/DoctorHome';
import DoctorSchedule from '../pages/medico/DoctorSchedule';
import ClinicalPage from '../features/clinical/ClinicalPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<Login />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="cadastro" element={<EditProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['paciente']} />}>
        <Route path="/paciente" element={<AppLayout />}>
          <Route index element={<PatientHome />} />
          <Route path="cadastro" element={<EditProfile />} />
          <Route path="consultas" element={<PatientAppointments />} />
          <Route
            path="preparacao"
            element={<ClinicalPage page="preparation" perspective="patient" />}
          />
          <Route path="resumos" element={<ClinicalPage page="summary" perspective="patient" />} />
          <Route
            path="acompanhamento"
            element={<ClinicalPage page="followup" perspective="patient" />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['medico']} />}>
        <Route path="/medico" element={<AppLayout />}>
          <Route index element={<DoctorHome />} />
          <Route path="cadastro" element={<EditProfile />} />
          <Route path="agenda" element={<DoctorSchedule />} />
          <Route path="pacientes" element={<ClinicalPage page="patients" perspective="doctor" />} />
          <Route path="orientacoes" element={<ClinicalPage page="notes" perspective="doctor" />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
