import { fail, optional, validDate, today } from './helpers.js';

export const GENDERS = [
  'woman',
  'man',
  'non_binary',
  'agender',
  'gender_fluid',
  'self_described',
  'prefer_not_to_say',
];

export const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

// Datas são strings YYYY-MM-DD para não sofrer deslocamentos de fuso horário.
export function profileFields(data, role) {
  const birthDate = data.birthDate === '' || data.birthDate == null ? null : data.birthDate;
  if (birthDate !== null && (!validDate(birthDate) || birthDate > today())) {
    fail(400, 'Informe uma data de nascimento válida que não esteja no futuro.');
  }
  const gender = data.gender === '' || data.gender == null ? null : data.gender;
  if (gender !== null && !GENDERS.includes(gender))
    fail(400, 'Selecione uma opção de gênero válida.');
  const genderDescription =
    gender === 'self_described' ? optional(data.genderDescription, 120, 'Descrição do gênero') : '';
  const specialty = ['doctor', 'admin'].includes(role)
    ? optional(data.specialty, 120, 'Especialidade')
    : '';
  const professional = ['doctor', 'admin'].includes(role);
  const crm = professional ? optional(data.crm, 10, 'CRM') : '';
  const crmUf = professional ? optional(data.crmUf, 2, 'UF do CRM').toUpperCase() : '';
  if (crm && !/^[0-9]{1,10}$/.test(crm))
    fail(400, 'Informe apenas os números do CRM, com até 10 dígitos.');
  if (crmUf && !BRAZIL_STATES.includes(crmUf)) fail(400, 'Selecione uma UF válida para o CRM.');
  if (Boolean(crm) !== Boolean(crmUf)) fail(400, 'Preencha o número do CRM e a UF juntos.');
  return { birthDate, gender, genderDescription, specialty, crm, crmUf };
}
