import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Session, Appointment } from '../src/models.js';

const uri = process.env.MONGODB_URI_TEST;
test(
  'Proposta do médico: consentimento, permissões, conflitos e concorrência',
  {
    skip: !uri ? 'Configure MONGODB_URI_TEST com o banco medtrack_test' : false,
  },
  async () => {
    assert.equal(new URL(uri).pathname, '/medtrack_test', 'Use somente medtrack_test');
    const users = [];
    let server;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    try {
      await Promise.all([User.init(), Session.init(), Appointment.init()]);
      server = app.listen(0, '127.0.0.1');
      await new Promise((resolve) => server.once('listening', resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      const agent = () => {
        let cookie = '';
        return async (path, method = 'GET', body) => {
          const res = await fetch(base + '/api' + path, {
            method,
            headers: {
              ...(body ? { 'Content-Type': 'application/json' } : {}),
              ...(cookie ? { Cookie: cookie } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const fresh = res.headers.getSetCookie();
          if (fresh.length) cookie = fresh[0].split(';')[0];
          return { status: res.status, body: await res.json() };
        };
      };
      const doctor = agent(),
        patient = agent(),
        otherDoctor = agent(),
        otherPatient = agent();
      for (const [client, role] of [
        [doctor, 'doctor'],
        [patient, 'patient'],
        [otherDoctor, 'doctor'],
        [otherPatient, 'patient'],
      ]) {
        const res = await client('/auth/register', 'POST', {
          name: 'QA reagendamento',
          email: `${crypto.randomUUID()}@example.test`,
          password: 'SenhaQA123!',
          role,
        });
        assert.equal(res.status, 201);
        users.push(res.body.user.id);
      }
      const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const prep = { reason: 'QA reagendamento', symptoms: 'Dado fictício' };
      const create = async (client, time) => {
        const res = await client('/appointments', 'POST', {
          doctorId: users[0],
          preparation: prep,
        });
        assert.equal(res.status, 201);
        const id = res.body.appointment.id;
        assert.equal(
          (await doctor(`/appointments/${id}`, 'PATCH', { status: 'Aceito', date: day, time }))
            .status,
          200,
        );
        return id;
      };
      const id = await create(patient, '14:00');
      await create(otherPatient, '16:00');
      const route = `/appointments/${id}/reschedule`;
      const propose = (time) =>
        doctor(route, 'POST', { date: day, time, note: 'Proposta fictícia' });
      const reply = (proposalId, decision = 'accept', client = patient) =>
        client(route, 'PATCH', { proposalId, decision });
      const current = async () => (await patient('/bootstrap')).body.appts.find((a) => a.id === id);
      assert.equal((await patient(route, 'POST', { date: day, time: '15:00' })).status, 403);
      assert.equal((await otherDoctor(route, 'POST', { date: day, time: '15:00' })).status, 403);
      assert.equal(
        (await doctor(route, 'POST', { date: '2000-01-01', time: '15:00' })).status,
        400,
      );
      assert.equal((await propose('14:00')).status, 400);
      assert.equal((await propose('16:00')).status, 409);
      let res = await propose('15:00');
      assert.equal(res.status, 201);
      let proposalId = res.body.appointment.rescheduleProposal.id;
      assert.equal((await current()).time, '14:00');
      assert.equal((await current()).rescheduleProposal.status, 'pending');
      assert.equal((await propose('17:00')).status, 409);
      assert.equal((await reply(proposalId, 'accept', doctor)).status, 403);
      assert.equal((await reply(proposalId, 'accept', otherPatient)).status, 403);
      assert.equal((await reply('id-antigo')).status, 409);
      assert.equal(
        (
          await patient(`/appointments/${id}`, 'PATCH', {
            status: 'Remarcação solicitada',
            requestedTime: '18:00',
          })
        ).status,
        409,
      );
      assert.equal(
        (await doctor(`/appointments/${id}`, 'PATCH', { status: 'Concluída' })).status,
        409,
      );
      assert.equal((await reply(proposalId, 'reject')).status, 200);
      assert.equal((await current()).time, '14:00');
      assert.equal((await current()).rescheduleProposal.status, 'rejected');
      assert.equal((await reply(proposalId)).status, 409);
      res = await propose('17:00');
      assert.equal(res.status, 201);
      proposalId = res.body.appointment.rescheduleProposal.id;
      assert.equal((await reply(proposalId)).status, 200);
      assert.equal((await current()).time, '17:00');
      assert.equal((await current()).rescheduleProposal.status, 'accepted');
      // O horário proposto pode ser ocupado enquanto aguarda resposta.
      res = await propose('18:00');
      assert.equal(res.status, 201);
      proposalId = res.body.appointment.rescheduleProposal.id;
      await create(otherPatient, '18:00');
      assert.equal((await reply(proposalId)).status, 409);
      assert.equal((await current()).time, '17:00');
      assert.equal((await current()).rescheduleProposal.status, 'pending');
      assert.equal((await reply(proposalId, 'reject')).status, 200);
      res = await propose('19:00');
      assert.equal(res.status, 201);
      proposalId = res.body.appointment.rescheduleProposal.id;
      const concurrent = await Promise.all([reply(proposalId), reply(proposalId, 'reject')]);
      assert.deepEqual(concurrent.map((x) => x.status).sort(), [200, 409]);
      res = await propose('20:00');
      assert.equal(res.status, 201);
      proposalId = res.body.appointment.rescheduleProposal.id;
      assert.equal(
        (await patient(`/appointments/${id}`, 'PATCH', { status: 'Cancelada' })).status,
        200,
      );
      assert.equal((await current()).rescheduleProposal, null);
      assert.equal((await reply(proposalId)).status, 409);
      assert.equal((await propose('21:00')).status, 409);
    } finally {
      if (users.length) {
        await Appointment.deleteMany({ doctorId: { $in: users } });
        await Session.deleteMany({ userId: { $in: users } });
        await User.deleteMany({ _id: { $in: users } });
      }
      if (server) await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
    }
  },
);
