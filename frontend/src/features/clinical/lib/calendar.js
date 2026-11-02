export const calendarDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function monthDays(year, month) {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0, 12).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= count ? calendarDate(new Date(year, month, day, 12)) : null;
  });
}

export function groupAppointments(appointments) {
  const grouped = {};
  for (const appointment of appointments) {
    if (!appointment.date || !appointment.time || appointment.status === 'Cancelada') continue;
    (grouped[appointment.date] ??= []).push(appointment);
  }
  for (const entries of Object.values(grouped))
    entries.sort((a, b) => a.time.localeCompare(b.time));
  return grouped;
}
