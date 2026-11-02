export const genderOptions = [
  { value: 'woman', label: 'Mulher' },
  { value: 'man', label: 'Homem' },
  { value: 'non_binary', label: 'Pessoa não binária' },
  { value: 'agender', label: 'Agênero' },
  { value: 'gender_fluid', label: 'Gênero fluido' },
  { value: 'self_described', label: 'Prefiro me descrever' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
];
export const genderLabel = (user) => {
  if (user.gender === 'self_described') return user.genderDescription || 'Autodescrição';
  return genderOptions.find((option) => option.value === user.gender)?.label || 'Não informado';
};
export const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const formatBirthDate = (value) =>
  value ? value.split('-').reverse().join('/') : 'Não informada';
export const brazilStates = [
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
export const formatCrm = (user) =>
  user.crm ? `${user.crm}${user.crmUf ? ` / ${user.crmUf}` : ''}` : 'Não informado';
export const emptyProfile = {
  birthDate: '',
  gender: '',
  genderDescription: '',
  specialty: '',
  crm: '',
  crmUf: '',
};
