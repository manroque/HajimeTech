/*
 * Datas no formato 'AAAA-MM-DD', calculadas no fuso local do servidor.
 */

export function paraISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function deISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function hojeISO() {
  return paraISO(new Date());
}

export function somarDias(iso, dias) {
  const d = deISO(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

/* Segunda-feira da semana da data. */
export function inicioDaSemana(iso) {
  const d = deISO(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return paraISO(d);
}
