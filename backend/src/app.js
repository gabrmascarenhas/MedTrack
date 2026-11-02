import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { User, Session, Appointment, Followup, Guidance } from './models.js';
import {
  fail,
  required,
  optional,
  objectId,
  validDate,
  validTime,
  today,
  validSlot,
  prepFields,
  digest,
  hashPassword,
  verifyPassword,
  publicUser,
  appointmentDTO,
  followDTO,
  guidanceDTO,
} from './helpers.js';

import { profileFields } from './profile.js';
import { connectDatabase } from './database.js';
import { hasRole, ownsRecord } from './permissions.js';

const app = express();
app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
const COOKIE = 'medtrack_session';
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sendError = (req, res, next) =>
  wrap(async () => {
    if (!req.user) fail(401, 'Sua sessão terminou. Entre novamente.');
    next();
  })(req, res, next);
const role = (name) => (req, res, next) =>
  hasRole(req.user, name)
    ? next()
    : next(Object.assign(new Error('Acesso não permitido para este perfil.'), { status: 403 }));
function setCookie(res, token, seconds) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: seconds * 1000,
  });
}
async function createSession(user, res, remember = true) {
  const token = crypto.randomBytes(32).toString('hex');
  const seconds = remember ? 7 * 86400 : 12 * 3600;
  await Session.create({
    tokenHash: digest(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + seconds * 1000),
  });
  setCookie(res, token, seconds);
}
app.use(
  '/api',
  wrap(async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      await connectDatabase();
    } catch (error) {
      console.error('[API] Falha na conexão com MongoDB:', error.name);
      fail(503, 'Banco de dados indisponível. Tente novamente em instantes.');
    }
    // Bloqueia mudanças cross-site feitas por navegadores com cookie de sessão.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
      const expected = `${req.protocol}://${req.get('host')}`;
      // O proxy de desenvolvimento do Vite encaminha a origem do navegador, mas o Host pode ser o do destino.
      const devOrigin = 'http://127.0.0.1:5173';
      const allowed = [
        expected,
        ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
        ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN.replace(/\/$/, '')] : []),
        ...(process.env.NODE_ENV === 'production' ? [] : [devOrigin, 'http://localhost:5173']),
      ];
      if (!allowed.includes(req.headers.origin)) fail(403, 'Origem não autorizada.');
    }
    const token = req.cookies[COOKIE];
    if (token && /^[0-9a-f]{64}$/.test(token)) {
      const sess = await Session.findOne({
        tokenHash: digest(token),
        expiresAt: { $gt: new Date() },
      }).populate('userId');
      if (sess?.userId) req.user = sess.userId;
    }
    next();
  }),
);
app.get('/api/health', (req, res) => res.json({ ok: true, db: 'mongodb' }));
app.post(
  '/api/auth/register',
  wrap(async (req, res) => {
    const { name, email, password, role: profile } = req.body;
    const cleanName = required(name, 120, 'Nome');
    const cleanEmail = required(email, 254, 'E-mail').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) fail(400, 'E-mail inválido.');
    const pw = required(password, 128, 'Senha');
    if (pw.length < 8) fail(400, 'A senha deve conter pelo menos 8 caracteres.');
    if (!['patient', 'doctor'].includes(profile)) fail(400, 'Perfil inválido.');
    const u = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(pw),
      role: profile,
      ...profileFields(req.body, profile),
    });
    await createSession(u, res);
    res.status(201).json({ user: publicUser(u) });
  }),
);
app.post(
  '/api/auth/login',
  wrap(async (req, res) => {
    const email = required(req.body.email, 254, 'E-mail').toLowerCase();
    const pw = required(req.body.password, 128, 'Senha');
    const u = await User.findOne({ email });
    // Mesmo para contas inexistentes, executa uma derivação de chave.
    const dummy = '00000000000000000000000000000000:' + '00'.repeat(64);
    if (!verifyPassword(pw, u?.passwordHash || dummy) || !u)
      fail(401, 'E-mail ou senha incorretos.');
    await createSession(u, res, req.body.remember === true);
    res.json({ user: publicUser(u) });
  }),
);
app.post(
  '/api/auth/logout',
  wrap(async (req, res) => {
    const token = req.cookies[COOKIE];
    if (token && /^[0-9a-f]{64}$/.test(token))
      await Session.deleteOne({ tokenHash: digest(token) });
    res.clearCookie(COOKIE, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.json({ ok: true });
  }),
);
app.use('/api', sendError);
app.get('/api/auth/me', (req, res) => res.json({ user: publicUser(req.user) }));
// Somente administradores podem listar e editar dados de outros usuários.
app.get(
  '/api/admin/users',
  role('admin'),
  wrap(async (req, res) => {
    const users = await User.find({})
      .select('name email role birthDate gender genderDescription specialty crm crmUf')
      .sort({ name: 1 });
    res.json({ users: users.map(publicUser) });
  }),
);
app.patch(
  '/api/admin/users/:id',
  role('admin'),
  wrap(async (req, res) => {
    const user = await User.findById(objectId(req.params.id, 'Usuário'));
    if (!user) fail(404, 'Usuário não encontrado.');
    const name = required(req.body.name, 120, 'Nome');
    const email = required(req.body.email, 254, 'E-mail').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'E-mail inválido.');
    // Lista explícita de campos: o corpo da requisição não pode mudar senha nem perfil.
    user.name = name;
    user.email = email;
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);
app.patch(
  '/api/profile',
  wrap(async (req, res) => {
    const name = req.body.name === undefined ? req.user.name : required(req.body.name, 120, 'Nome');
    const email =
      req.body.email === undefined
        ? req.user.email
        : required(req.body.email, 254, 'E-mail').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'E-mail inválido.');
    const details = profileFields({ ...req.user.toObject(), ...req.body }, req.user.role);
    // Somente os campos permitidos são copiados; role e senha não podem ser alterados aqui.
    req.user.name = name;
    req.user.email = email;
    Object.assign(req.user, details);
    await req.user.save();
    res.json({ ok: true, user: publicUser(req.user) });
  }),
);
app.get(
  '/api/doctors',
  wrap(async (req, res) => {
    const doctors = await User.find({ role: 'doctor' }).select('name').sort('name').lean();
    res.json({ doctors: doctors.map((d) => ({ id: String(d._id), name: d.name })) });
  }),
);
const withNames = (q) => q.populate('patientId', 'name').populate('doctorId', 'name');
async function isLinked(doctorId, patientId) {
  return !!(await Appointment.exists({ doctorId, patientId }));
}
async function overview(user) {
  const [appointments, doctors] = await Promise.all([
    withNames(
      Appointment.find(
        user.role === 'admin'
          ? {}
          : { [user.role === 'doctor' ? 'doctorId' : 'patientId']: user._id },
      ).sort({ createdAt: -1 }),
    ).lean(),
    User.find({ role: 'doctor' }).select('name').sort('name').lean(),
  ]);
  const rank = {
    'Solicitada': 0,
    'Remarcação solicitada': 1,
    'Aceito': 2,
    'Concluída': 3,
    'Cancelada': 4,
  };
  const appts = appointments
    .map(appointmentDTO)
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] || (a.date || '9999').localeCompare(b.date || '9999'),
    );
  const docs = doctors.map((d) => ({ id: String(d._id), name: d.name }));
  if (user.role === 'patient') {
    const [follow, guidance] = await Promise.all([
      Followup.find({ patientId: user._id }).sort({ createdAt: -1 }).lean(),
      Guidance.find({ patientId: user._id })
        .populate('doctorId', 'name')
        .populate('patientId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    return {
      user: publicUser(user),
      appts,
      doctors: docs,
      patients: [],
      follow: follow.map(followDTO),
      guidance: guidance.map(guidanceDTO),
    };
  }
  const [followPatients, guidance] = await Promise.all([
    User.find(
      user.role === 'admin'
        ? { role: { $in: ['patient', 'admin'] } }
        : { _id: { $in: [...new Set(appointments.map((a) => String(a.patientId._id)))] } },
    )
      .select('name email')
      .sort('name')
      .lean(),
    Guidance.find(user.role === 'admin' ? {} : { doctorId: user._id })
      .populate('doctorId', 'name')
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const patients = followPatients.map((p) => {
    const related = appts.filter((a) => a.patientId === String(p._id));
    const next = related
      .filter((a) => a.status === 'Aceito' && a.date >= today())
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    return {
      id: String(p._id),
      name: p.name,
      email: p.email,
      hasPreparation: related.some((a) => !!a.prep),
      nextAppointment: next ? `${next.date} ${next.time}` : null,
    };
  });
  return {
    user: publicUser(user),
    appts,
    doctors: docs,
    patients,
    follow:
      user.role === 'admin'
        ? (await Followup.find({}).sort({ createdAt: -1 }).lean()).map(followDTO)
        : [],
    guidance: guidance.map(guidanceDTO),
  };
}
app.get(
  '/api/bootstrap',
  wrap(async (req, res) => res.json(await overview(req.user))),
);
app.post(
  '/api/appointments',
  role('patient'),
  wrap(async (req, res) => {
    const doctorId = objectId(req.body.doctorId, 'Médico');
    if (!(await User.exists({ _id: doctorId, role: 'doctor' })))
      fail(400, 'Escolha um profissional cadastrado.');
    const prep = prepFields(req.body.preparation);
    const patientId =
      req.user.role === 'admin' && req.body.patientId
        ? objectId(req.body.patientId, 'Paciente')
        : req.user._id;
    if (!(await User.exists({ _id: patientId, role: { $in: ['patient', 'admin'] } })))
      fail(400, 'Paciente inválido.');
    const appt = await Appointment.create({
      patientId,
      doctorId,
      reason: prep.reason,
      prep,
      status: 'Solicitada',
    });
    res.status(201).json({
      appointment: appointmentDTO(await withNames(Appointment.findById(appt._id)).lean()),
    });
  }),
);
async function ownedAppointment(req) {
  const id = objectId(req.params.id, 'Consulta');
  const a = await Appointment.findById(id);
  if (!a) fail(404, 'Consulta não encontrada.');
  const owner = String(req.user.role === 'doctor' ? a.doctorId : a.patientId);
  if (!ownsRecord(req.user, owner)) fail(403, 'Você não tem acesso a esta consulta.');
  return a;
}
app.put(
  '/api/appointments/:id/preparation',
  role('patient'),
  wrap(async (req, res) => {
    const a = await ownedAppointment(req);
    if (['Concluída', 'Cancelada'].includes(a.status)) fail(409, 'Consulta encerrada.');
    const prep = prepFields(req.body);
    a.prep = prep;
    a.reason = prep.reason;
    await a.save();
    res.json({ appointment: appointmentDTO(await withNames(Appointment.findById(a._id)).lean()) });
  }),
);
app.patch(
  '/api/appointments/:id',
  wrap(async (req, res) => {
    const a = await ownedAppointment(req),
      b = req.body;
    if (b.status === 'Cancelada') {
      if (['Concluída', 'Cancelada'].includes(a.status)) fail(409, 'Consulta já encerrada.');
      a.status = 'Cancelada';
    } else if (hasRole(req.user, 'doctor') && b.status === 'Concluída') {
      if (a.status !== 'Aceito') fail(409, 'Somente consultas aceitas podem ser concluídas.');
      a.status = 'Concluída';
    } else if (hasRole(req.user, 'doctor') && b.status === 'Aceito') {
      if (!['Solicitada', 'Remarcação solicitada'].includes(a.status))
        fail(409, 'A consulta não está aguardando horário.');
      validSlot(b.date, b.time);
      a.status = 'Aceito';
      a.date = b.date;
      a.time = b.time;
      a.requestedDate = null;
      a.requestedTime = null;
      a.rescheduleNote = '';
    } else if (hasRole(req.user, 'patient') && b.status === 'Remarcação solicitada') {
      if (a.status !== 'Aceito') fail(409, 'Só é possível remarcar consultas aceitas.');
      const d = b.requestedDate ? required(b.requestedDate, 10, 'Data') : null,
        t = b.requestedTime ? required(b.requestedTime, 5, 'Horário') : null;
      const note = optional(b.rescheduleNote, 1000, 'Observação');
      if (!d && !t && !note) fail(400, 'Informe outro dia, horário ou uma observação.');
      if (d && (!validDate(d) || d < today()))
        fail(400, 'A data desejada deve ser válida e futura.');
      if (t && !validTime(t)) fail(400, 'Horário desejado inválido.');
      a.status = 'Remarcação solicitada';
      a.requestedDate = d;
      a.requestedTime = t;
      a.rescheduleNote = note;
    } else fail(403, 'Ação indisponível para este perfil ou status.');
    await a.save();
    res.json({ appointment: appointmentDTO(await withNames(Appointment.findById(a._id)).lean()) });
  }),
);
app.delete(
  '/api/appointments/:id',
  wrap(async (req, res) => {
    const a = await ownedAppointment(req);
    if (['Aceito', 'Concluída'].includes(a.status))
      fail(409, 'Cancele a consulta antes de excluí-la.');
    await a.deleteOne();
    res.json({ ok: true });
  }),
);
app.get(
  '/api/patients/:id/summary',
  role('doctor'),
  wrap(async (req, res) => {
    const patientId = objectId(req.params.id, 'Paciente');
    if (req.user.role !== 'admin' && !(await isLinked(req.user._id, patientId)))
      fail(403, 'Paciente não vinculado a este profissional.');
    const [p, appointments, follow] = await Promise.all([
      User.findOne({ _id: patientId, role: { $in: ['patient', 'admin'] } })
        .select('name')
        .lean(),
      withNames(
        Appointment.find(
          req.user.role === 'admin' ? { patientId } : { patientId, doctorId: req.user._id },
        ).sort({ createdAt: -1 }),
      ).lean(),
      Followup.find({ patientId }).sort({ createdAt: -1 }).lean(),
    ]);
    if (!p) fail(404, 'Paciente não encontrado.');
    res.json({
      patient: { id: String(p._id), name: p.name },
      appointments: appointments.map(appointmentDTO),
      follow: follow.map(followDTO),
    });
  }),
);
app.post(
  '/api/followups',
  role('patient'),
  wrap(async (req, res) => {
    const patientId =
      req.user.role === 'admin' && req.body.patientId
        ? objectId(req.body.patientId, 'Paciente')
        : req.user._id;
    if (!(await User.exists({ _id: patientId, role: { $in: ['patient', 'admin'] } })))
      fail(400, 'Paciente inválido.');
    await Followup.create({ patientId, text: required(req.body.text, 2000, 'Observação') });
    res.status(201).json({ ok: true });
  }),
);
app.delete(
  '/api/followups/:id',
  role('patient'),
  wrap(async (req, res) => {
    const x = await Followup.deleteOne({
      _id: objectId(req.params.id),
      ...(req.user.role === 'admin' ? {} : { patientId: req.user._id }),
    });
    if (!x.deletedCount) fail(404, 'Registro não encontrado.');
    res.json({ ok: true });
  }),
);
app.post(
  '/api/guidance',
  role('doctor'),
  wrap(async (req, res) => {
    const patientId = objectId(req.body.patientId, 'Paciente');
    if (req.user.role !== 'admin' && !(await isLinked(req.user._id, patientId)))
      fail(403, 'Paciente não vinculado a você.');
    if (!(await User.exists({ _id: patientId, role: { $in: ['patient', 'admin'] } })))
      fail(400, 'Paciente inválido.');
    const text = required(req.body.text, 4000, 'Orientação'),
      meds = optional(req.body.meds, 1000, 'Medicamentos');
    const returnDate = req.body.returnDate || null;
    if (returnDate && !validDate(returnDate)) fail(400, 'Data de retorno inválida.');
    await Guidance.create({ patientId, doctorId: req.user._id, text, meds, returnDate });
    res.status(201).json({ ok: true });
  }),
);
app.delete(
  '/api/guidance/:id',
  role('doctor'),
  wrap(async (req, res) => {
    const x = await Guidance.deleteOne({
      _id: objectId(req.params.id),
      ...(req.user.role === 'admin' ? {} : { doctorId: req.user._id }),
    });
    if (!x.deletedCount) fail(404, 'Orientação não encontrada.');
    res.json({ ok: true });
  }),
);
// Em produção, o Express pode servir a compilação do React (após npm run build).
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use((err, req, res, next) => {
  const status =
    err.status || (err.code === 11000 ? 409 : err.name === 'ValidationError' ? 400 : 500);
  if (status === 500) console.error('[MedTrack]', err);
  const message =
    err.code === 11000
      ? err.keyPattern?.email
        ? 'E-mail já cadastrado.'
        : 'Este profissional já possui uma consulta aceita nesse horário.'
      : status === 500
        ? 'Erro interno no servidor.'
        : err.message;
  res.status(status).json({ error: message });
});
export default app;
