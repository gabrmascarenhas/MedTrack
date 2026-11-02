import mongoose from 'mongoose';
import crypto from 'node:crypto';
export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
export function required(value, max, field) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(400, `${field}: informe entre 1 e ${max} caracteres.`);
  return value.trim();
}
export function optional(value, max, field) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string' || value.length > max)
    fail(400, `${field}: máximo de ${max} caracteres.`);
  return value.trim();
}
export function objectId(value, field = 'Identificador') {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value))
    fail(400, `${field} inválido.`);
  return value;
}
export function validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function validTime(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function validSlot(date, time) {
  if (!validDate(date) || date < today() || !validTime(time))
    fail(400, 'Data ou horário inválidos. Escolha um horário futuro.');
  if (date === today() && time <= new Date().toTimeString().slice(0, 5))
    fail(400, 'Escolha um horário futuro.');
}
export function prepFields(prep) {
  if (!prep || typeof prep !== 'object' || Array.isArray(prep))
    fail(400, 'Preencha a preparação pré-consulta.');
  return {
    reason: required(prep.reason, 500, 'Motivo da consulta'),
    symptoms: required(prep.symptoms, 4000, 'Sintomas ou contexto'),
    questions: optional(prep.questions, 4000, 'Dúvidas'),
    meds: optional(prep.meds, 4000, 'Medicamentos'),
    updatedAt: new Date(),
  };
}
export const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, hash) {
  const [salt, expected] = (hash || '').split(':');
  if (!salt || !/^[0-9a-f]{128}$/.test(expected || '')) return false;
  const a = crypto.scryptSync(password, salt, 64),
    b = Buffer.from(expected, 'hex');
  return crypto.timingSafeEqual(a, b);
}
export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  birthDate: u.birthDate ?? null,
  gender: u.gender ?? null,
  genderDescription: u.genderDescription ?? '',
  specialty: u.specialty ?? '',
  crm: u.crm ?? '',
  crmUf: u.crmUf ?? '',
});
export function appointmentDTO(a) {
  return {
    id: String(a._id),
    patientId: String(a.patientId._id || a.patientId),
    doctorId: String(a.doctorId._id || a.doctorId),
    patient: a.patientId.name || '',
    doctor: a.doctorId.name || '',
    date: a.date,
    time: a.time,
    reason: a.reason,
    status: a.status,
    requestedDate: a.requestedDate,
    requestedTime: a.requestedTime,
    rescheduleNote: a.rescheduleNote,
    createdAt: a.createdAt,
    prep: a.prep
      ? {
          reason: a.prep.reason,
          symptoms: a.prep.symptoms,
          questions: a.prep.questions,
          meds: a.prep.meds,
          updatedAt: a.prep.updatedAt,
        }
      : null,
  };
}
export const followDTO = (f) => ({ id: String(f._id), text: f.text, createdAt: f.createdAt });
export const guidanceDTO = (g) => ({
  id: String(g._id),
  patientId: String(g.patientId._id || g.patientId),
  doctorId: String(g.doctorId._id || g.doctorId),
  patient: g.patientId.name || '',
  doctor: g.doctorId.name || '',
  text: g.text,
  meds: g.meds,
  returnDate: g.returnDate,
  createdAt: g.createdAt,
});
