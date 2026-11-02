// Teste ponta a ponta opcional. Configure MONGODB_URI_TEST para um DB isolado chamado medtrack_test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Session, Appointment, Followup, Guidance } from '../src/models.js';
const uri = process.env.MONGODB_URI_TEST;
test(
  'Fluxo completo paciente > médico > remarcação',
  { skip: !uri ? 'Configure MONGODB_URI_TEST para executar integração' : false },
  async () => {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    let server;
    try {
      if (mongoose.connection.name !== 'medtrack_test')
        throw Error(
          'Por segurança, MONGODB_URI_TEST deve utilizar um banco nomeado medtrack_test.',
        );
      await Promise.all([Appointment.init(), User.init(), Session.init()]);
      server = app.listen(0, '127.0.0.1');
      await new Promise((r) => server.once('listening', r));
      const port = server.address().port,
        origin = `http://127.0.0.1:${port}`;
      function agent() {
        let cookie = '';
        return async (path, method = 'GET', payload) => {
          const res = await fetch(origin + path, {
            method,
            headers: {
              ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
              ...(cookie ? { Cookie: cookie } : {}),
            },
            body: payload !== undefined ? JSON.stringify(payload) : undefined,
          });
          const cookies = res.headers.getSetCookie?.() || [];
          if (cookies.length) cookie = cookies[0].split(';')[0];
          return { status: res.status, data: await res.json() };
        };
      }
      const patient = agent(),
        doctor = agent(),
        other = agent();
      const suffix = crypto.randomBytes(6).toString('hex');
      const d = await doctor('/api/auth/register', 'POST', {
        name: 'Doutora Teste',
        email: `doc-${suffix}@example.test`,
        password: 'senhaSegura123',
        role: 'doctor',
      });
      assert.equal(d.status, 201);
      const p = await patient('/api/auth/register', 'POST', {
        name: 'Paciente Teste',
        email: `pac-${suffix}@example.test`,
        password: 'senhaSegura123',
        role: 'patient',
      });
      assert.equal(p.status, 201);
      const dp = d.data.user.id;
      const prep = {
        reason: 'Avaliar sintomas',
        symptoms: 'Dor leve há 2 dias',
        questions: 'Quais cuidados?',
        meds: 'Nenhum',
      };
      const post = await patient('/api/appointments', 'POST', { doctorId: dp, preparation: prep });
      assert.equal(post.status, 201);
      const id = post.data.appointment.id;
      assert.equal(post.data.appointment.status, 'Solicitada');
      assert.equal(post.data.appointment.prep.symptoms, prep.symptoms);
      let calendar = await doctor('/api/bootstrap');
      assert.equal(
        calendar.data.appts.some((x) => x.id === id),
        true,
      );
      const unauthorized = await other(`/api/appointments/${id}`, 'PATCH', { status: 'Aceito' });
      assert.equal(unauthorized.status, 401);
      const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const accept = await doctor(`/api/appointments/${id}`, 'PATCH', {
        status: 'Aceito',
        date: day,
        time: '14:00',
      });
      assert.equal(accept.status, 200);
      assert.equal(accept.data.appointment.status, 'Aceito');
      const pView = await patient('/api/bootstrap');
      assert.equal(pView.data.appts.find((x) => x.id === id).time, '14:00');
      const requestNew = await patient(`/api/appointments/${id}`, 'PATCH', {
        status: 'Remarcação solicitada',
        requestedTime: '16:00',
        rescheduleNote: 'Prefiro à tarde',
      });
      assert.equal(requestNew.status, 200);
      const change = await doctor(`/api/appointments/${id}`, 'PATCH', {
        status: 'Aceito',
        date: day,
        time: '16:00',
      });
      assert.equal(change.status, 200);
      assert.equal(change.data.appointment.status, 'Aceito');
      const guidance = await doctor('/api/guidance', 'POST', {
        patientId: p.data.user.id,
        text: 'Acompanhar os sintomas',
        returnDate: day,
      });
      assert.equal(guidance.status, 201);
      const note = await patient('/api/followups', 'POST', { text: 'Estou melhorando' });
      assert.equal(note.status, 201);
      const sum = await doctor(`/api/patients/${p.data.user.id}/summary`);
      assert.equal(sum.status, 200);
      assert.equal(sum.data.follow.length, 1);
      const patientView = await patient('/api/bootstrap');
      assert.equal(patientView.data.guidance.length, 1);
      // Remover apenas os documentos criados pelo teste.
      await Promise.all([
        Followup.deleteMany({ patientId: p.data.user.id }),
        Guidance.deleteMany({ patientId: p.data.user.id }),
        Appointment.deleteMany({ patientId: p.data.user.id }),
        Session.deleteMany({ userId: { $in: [p.data.user.id, dp] } }),
      ]);
      await User.deleteMany({ _id: { $in: [p.data.user.id, dp] } });
    } finally {
      if (server) await new Promise((r) => server.close(r));
      await mongoose.disconnect();
    }
  },
);
