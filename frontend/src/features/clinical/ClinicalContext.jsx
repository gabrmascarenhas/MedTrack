import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMockAuth } from '../../services/authService';
import { api } from './lib/api';
import ClinicalModal from './ClinicalModal';

const Context = createContext(null);
export function ClinicalProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const enabled = !useMockAuth && /^\/(paciente|medico)(\/|$)/.test(pathname);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const alive = useRef(false);
  const writing = useRef(false);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    const result = await api('/api/bootstrap');
    if (alive.current && version === requestVersion.current) {
      setData(result);
      setError('');
    }
    return result;
  }, [user.id_usuario]);

  useEffect(() => {
    alive.current = true;
    if (!enabled) {
      setLoading(false);
      return () => {
        alive.current = false;
      };
    }
    setLoading(true);
    refresh()
      .catch((err) => {
        if (alive.current) setError(err.message);
      })
      .finally(() => {
        if (alive.current) setLoading(false);
      });
    const sync = () => {
      if (document.visibilityState === 'hidden' || writing.current) return;
      refresh().catch((err) => {
        if (alive.current) setError(err.message);
      });
    };
    const timer = setInterval(sync, 30000);
    window.addEventListener('focus', sync);
    return () => {
      alive.current = false;
      requestVersion.current++;
      clearInterval(timer);
      window.removeEventListener('focus', sync);
    };
  }, [enabled, refresh]);

  useEffect(() => {
    setModal(null);
    setNotice('');
  }, [pathname]);

  async function mutate(path, method, payload, close = false) {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await api(path, method, payload);
      if (alive.current && close) setModal(null);
      try {
        await refresh();
        if (alive.current) setNotice('Alteração salva.');
      } catch {
        if (alive.current) setNotice('Alteração salva. Atualize a lista para conferir os dados.');
      }
      return true;
    } catch (err) {
      if (alive.current) setError(err.message);
      return false;
    } finally {
      writing.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const view = (appointment) => {
    if (writing.current) return;
    setError('');
    setModal({ kind: 'appointment', appt: appointment });
  };
  async function patientSummary(id) {
    setError('');
    try {
      const summary = await api(`/api/patients/${id}/summary`);
      if (alive.current) setModal({ kind: 'patientSummary', summary });
    } catch (err) {
      if (alive.current) setError(err.message);
    }
  }
  const value = {
    data,
    loading,
    error,
    notice,
    busy,
    modal,
    setModal,
    refresh,
    mutate,
    view,
    patientSummary,
    setError,
  };
  return (
    <Context.Provider value={value}>
      {children}
      <ClinicalModal />
    </Context.Provider>
  );
}
export const useClinical = () => {
  const value = useContext(Context);
  if (!value) throw new Error('Use ClinicalProvider para carregar os dados clínicos.');
  return value;
};
