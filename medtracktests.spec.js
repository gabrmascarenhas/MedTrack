import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const site = 'http://127.0.0.1:5173';
const password = 'QA-Playwright123!';

// Uma execução por vez facilita acompanhar as telas e os resultados.
test.describe.configure({ mode: 'default' });
test.setTimeout(60_000);

// Cria somente contas fictícias. A API usa o banco configurado no backend.
async function account(request, role = 'patient') {
  const id = randomUUID();
  const user = {
    name: `QA ${role} ${id.slice(0, 8)}`,
    email: `qa-playwright-${id}@example.test`,
    password,
    role,
  };
  const response = await request.post(`${site}/api/auth/register`, { data: user });
  expect(response.status(), await response.text()).toBe(201);
  return { ...user, id: (await response.json()).user.id };
}

async function login(page, user, secret = password) {
  await page.goto(`${site}/login`);
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  if (secret === password) {
    await expect(page).toHaveURL(`${site}/${user.role === 'doctor' ? 'medico' : 'paciente'}`);
  }
}

// API prepara os dados; a ação que cada teste avalia é feita pela interface.
async function seed(request, accepted = false) {
  const doctor = await account(request, 'doctor');
  const patient = await account(request);
  const reason = `Consulta QA ${randomUUID().slice(0, 8)}`;
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const created = await request.post(`${site}/api/appointments`, {
    data: {
      doctorId: doctor.id,
      preparation: { reason, symptoms: 'Contexto fictício para teste de interface.' },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const appointment = (await created.json()).appointment;
  if (accepted) {
    const auth = await request.post(`${site}/api/auth/login`, {
      data: { email: doctor.email, password },
    });
    expect(auth.status()).toBe(200);
    const response = await request.patch(`${site}/api/appointments/${appointment.id}`, {
      data: { status: 'Aceito', date, time: '14:00' },
    });
    expect(response.status(), await response.text()).toBe(200);
  }
  return { doctor, patient, reason, date, appointmentId: appointment.id };
}

async function savedAppointment(page, id) {
  const response = await page.request.get(`${site}/api/bootstrap`);
  expect(response.status()).toBe(200);
  return (await response.json()).appts.find(item => item.id === id);
}

async function openDoctorAppointment(page, reason, accepted = false) {
  await page.goto(`${site}/medico/agenda`);
  await expect(page.getByRole('heading', { name: 'Minha agenda', exact: true })).toBeVisible();
  if (accepted) {
    await page.getByText(/Todos os registros \(/).click();
  }
  await page.getByRole('row').filter({ hasText: reason }).first()
    .getByRole('button', { name: 'Detalhes', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function proposeThroughUI(page, data) {
  await login(page, data.doctor);
  await openDoctorAppointment(page, data.reason, true);
  await page.getByRole('button', { name: 'Reagendar consulta', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nova data *', { exact: true }).fill(data.date);
  await dialog.getByLabel('Novo horário *', { exact: true }).fill('15:00');
  await dialog.getByLabel('Motivo do reagendamento (opcional)', { exact: true })
    .fill('Motivo fictício de QA.');
  await expect(dialog).toContainText('poderá aceitar ou recusar');
  // Começa a observar antes do clique para não perder a resposta da API.
  const responsePromise = page.waitForResponse(response =>
    new URL(response.url()).pathname ===
      `/api/appointments/${data.appointmentId}/reschedule` &&
    response.request().method() === 'POST'
  );
  await dialog.getByRole('button', { name: 'Enviar proposta ao paciente', exact: true }).click();
  const response = await responsePromise;
  const responseBody = await response.text();
  const hint = response.status() === 404
    ? ' A rota não foi encontrada. Confira se o backend foi reiniciado com o código atual.'
    : '';
  expect(response.status(), `Falha ao propor reagendamento.${hint} Resposta: ${responseBody}`).toBe(201);
  await expect(dialog).toBeHidden();
  const appointment = await savedAppointment(page, data.appointmentId);
  expect(appointment.time).toBe('14:00');
  expect(appointment.rescheduleProposal.status).toBe('pending');
  await page.getByRole('button', { name: 'Sair ↗', exact: true }).click();
  await expect(page).toHaveURL(`${site}/login`);
  await login(page, data.patient);
  await expect(page.getByText(/propôs reagendar sua consulta/)).toBeVisible();
  await page.getByRole('button', { name: 'Ver reagendamento', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('15:00');
}

// Compartilhado pelos testes 09 e 10: verifica a resposta real da decisão.
async function respondToProposal(page, data, decision) {
  const dialog = page.getByRole('dialog');
  const responsePromise = page.waitForResponse(response =>
    new URL(response.url()).pathname ===
      `/api/appointments/${data.appointmentId}/reschedule` &&
    response.request().method() === 'PATCH'
  );
  await dialog.getByRole('button', {
    name: decision === 'accept' ? 'Aceitar novo horário' : 'Recusar reagendamento',
    exact: true,
  }).click();
  const response = await responsePromise;
  const body = await response.text();
  expect(response.status(), `Falha ao responder ao reagendamento: ${body}`).toBe(200);
  const appointment = JSON.parse(body).appointment;
  expect(appointment.id).toBe(data.appointmentId);
  expect(appointment.rescheduleProposal.status).toBe(
    decision === 'accept' ? 'accepted' : 'rejected'
  );
  await expect(dialog).toBeHidden();
}

test('01 — Homepage tem o título MedTrack', async ({ page }) => {
  await page.goto(site);
  await expect(page).toHaveTitle('MedTrack');
});

test('02 — Sem login, área protegida redireciona para login', async ({ page }) => {
  await page.goto(`${site}/paciente`);
  await expect(page).toHaveURL(`${site}/login`);
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
});

test('03 — Login rejeita senha incorreta', async ({ page, request }) => {
  const patient = await account(request);
  await login(page, patient, 'SenhaIncorreta123!');
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos.');
  await expect(page).toHaveURL(`${site}/login`);
});

test('04 — Login de paciente abre a área correta', async ({ page, request }) => {
  const patient = await account(request);
  await login(page, patient);
  await expect(page.getByRole('heading', { name: /^Olá,/ })).toBeVisible();
  await expect(page.getByText(patient.email, { exact: true })).toBeVisible();
});

test('05 — Cadastro rejeita confirmação de senha diferente', async ({ page }) => {
  await page.goto(`${site}/cadastro?perfil=patient`);
  await page.getByLabel('Nome', { exact: true }).fill('QA Confirmação');
  await page.getByLabel('E-mail', { exact: true }).fill(`qa-${randomUUID()}@example.test`);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill('OutraSenha123!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('As senhas não coincidem');
  await expect(page).toHaveURL(/\/cadastro/);
});

test('06 — Editar cadastro mantém os dados após recarregar', async ({ page, request }) => {
  const patient = await account(request);
  await login(page, patient);
  await page.goto(`${site}/paciente/cadastro`);
  await page.getByLabel('Nome', { exact: true }).fill('QA Nome Atualizado');
  await page.getByLabel('Data de nascimento (opcional)', { exact: true }).fill('2000-01-15');
  await page.getByLabel('Gênero (opcional)', { exact: true }).selectOption('non_binary');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Cadastro atualizado.');
  await page.reload();
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('QA Nome Atualizado');
  await expect(page.getByLabel('Data de nascimento (opcional)', { exact: true })).toHaveValue('2000-01-15');
  await expect(page.getByLabel('Gênero (opcional)', { exact: true })).toHaveValue('non_binary');
});

test('07 — Paciente solicita consulta pela tela', async ({ page, request }) => {
  const doctor = await account(request, 'doctor');
  const patient = await account(request);
  const reason = `Solicitação pela tela ${randomUUID().slice(0, 8)}`;
  await login(page, patient);
  await page.goto(`${site}/paciente/consultas`);
  await page.getByRole('button', { name: /Solicitar consulta/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Profissional *', { exact: true }).selectOption(doctor.id);
  await dialog.getByLabel('Motivo da consulta *', { exact: true }).fill(reason);
  await dialog.getByLabel('Sintomas ou contexto *', { exact: true }).fill('Contexto fictício de QA.');
  await dialog.getByRole('button', { name: /Enviar solicitação e preparação/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: reason })).toContainText('Solicitada');
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: reason })).toContainText(doctor.name);
});

test('08 — Médico aceita consulta e define horário pela tela', async ({ page, request }) => {
  const data = await seed(request);
  await login(page, data.doctor);
  await openDoctorAppointment(page, data.reason);
  await page.getByRole('button', { name: 'Aceitar e definir horário', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Data *', { exact: true }).fill(data.date);
  await dialog.getByLabel('Horário *', { exact: true }).fill('14:00');
  await dialog.getByRole('button', { name: /Aceitar consulta/ }).click();
  await expect(dialog).toBeHidden();
  const appointment = await savedAppointment(page, data.appointmentId);
  expect(appointment.status).toBe('Aceito');
  expect(appointment.date).toBe(data.date);
  expect(appointment.time).toBe('14:00');
  await page.reload();
  await page.getByText(/Todos os registros \(/).click();
  await expect(page.getByRole('row').filter({ hasText: data.reason })).toContainText('Aceito');
});

test('09 — Médico propõe e paciente aceita reagendamento', async ({ page, request }) => {
  const data = await seed(request, true);
  await proposeThroughUI(page, data);
  await respondToProposal(page, data, 'accept');
  const appointment = await savedAppointment(page, data.appointmentId);
  expect(appointment.time).toBe('15:00');
  expect(appointment.rescheduleProposal.status).toBe('accepted');
  await page.goto(`${site}/paciente/consultas`);
  await expect(page.getByRole('row').filter({ hasText: data.reason })).toContainText('15:00');
});

test('10 — Paciente recusa proposta e mantém horário anterior', async ({ page, request }) => {
  const data = await seed(request, true);
  await proposeThroughUI(page, data);
  await respondToProposal(page, data, 'reject');
  const appointment = await savedAppointment(page, data.appointmentId);
  expect(appointment.time).toBe('14:00');
  expect(appointment.rescheduleProposal.status).toBe('rejected');
  await page.goto(`${site}/paciente/consultas`);
  await expect(page.getByRole('row').filter({ hasText: data.reason })).toContainText('14:00');
});
