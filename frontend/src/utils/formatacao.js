import { FAIXAS } from '../mocks/faixas';
import { deISO, hojeLocal, paraISO } from '../mocks/utils';

export { paraISO, hojeLocal, deISO };

/**
 * Faixas são dados de referência fixos (também existem na tabela `faixas`),
 * por isso ficam disponíveis de forma síncrona para toda a interface.
 */
export const faixaPorId = (id) => FAIXAS.find((f) => f.id === id);
export const proximaFaixa = (id) => FAIXAS.find((f) => f.ordem === faixaPorId(id).ordem + 1);
export { FAIXAS };

export const hojeISO = () => paraISO(hojeLocal());

/** 2026-03-05 → 05/03/2026 */
export function formatarData(iso) {
  if (!iso) return '-';
  return deISO(iso.slice(0, 10)).toLocaleDateString('pt-BR');
}

/** 2026-03-05 → 5 de mar. */
export function formatarDataCurta(iso) {
  return deISO(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/** 2026-03-05 → quinta-feira, 5 de março de 2026 */
export function formatarDataExtensa(iso) {
  return deISO(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function idade(dataNascimento) {
  const nasc = deISO(dataNascimento);
  const hoje = hojeLocal();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

/** "há 3 dias", "hoje", "há 2 meses" */
export function tempoRelativo(iso) {
  const dias = Math.round((hojeLocal().getTime() - deISO(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(dias / 365);
  return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

export const numero = (n) => n.toLocaleString('pt-BR');

export const DIAS_SEMANA = {
  0: { curto: 'Dom', longo: 'Domingo' },
  1: { curto: 'Seg', longo: 'Segunda' },
  2: { curto: 'Ter', longo: 'Terça' },
  3: { curto: 'Qua', longo: 'Quarta' },
  4: { curto: 'Qui', longo: 'Quinta' },
  5: { curto: 'Sex', longo: 'Sexta' },
  6: { curto: 'Sáb', longo: 'Sábado' },
};

/** "6 a 12 anos" / "18 anos ou mais" */
export function faixaEtaria(t) {
  return t.idadeMaxima == null ? `${t.idadeMinima} anos ou mais` : `${t.idadeMinima} a ${t.idadeMaxima} anos`;
}

/** "Ter e Qui, 18:00 às 19:00" */
export function resumoHorarios(t) {
  if (!t.horarios.length) return 'Sem horário definido';
  const grupos = new Map();
  [...t.horarios]
    .sort((a, b) => a.diaSemana - b.diaSemana)
    .forEach((h) => {
      const chave = `${h.horaInicio} às ${h.horaFim}`;
      grupos.set(chave, [...(grupos.get(chave) ?? []), DIAS_SEMANA[h.diaSemana].curto]);
    });
  return [...grupos.entries()].map(([hora, dias]) => `${dias.join(' e ')} · ${hora}`).join(' | ');
}

export const NIVEIS_TECNICA = {
  iniciante: { rotulo: 'Iniciante', descricao: 'Está conhecendo a técnica.' },
  em_desenvolvimento: { rotulo: 'Em desenvolvimento', descricao: 'Já executa, mas ainda precisa de ajustes.' },
  domina: { rotulo: 'Domina', descricao: 'Executa a técnica com segurança.' },
};

export const PERFIS = {
  administrador: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
};

export const TIPOS_PREMIACAO = {
  destaque_mes: 'Destaque do mês',
  frequencia: 'Frequência',
  campeonato: 'Campeonato',
  evolucao: 'Evolução',
  outro: 'Outro',
};

/** Texto amigável da variação: "+12% em relação ao período anterior". */
export function textoVariacao(variacao, rotuloPeriodo) {
  if (variacao === null) return `Sem dados do ${rotuloPeriodo} para comparar`;
  const arred = Math.round(variacao);
  if (arred === 0) return `Igual ao ${rotuloPeriodo}`;
  return `${arred > 0 ? '+' : ''}${arred}% em relação ao ${rotuloPeriodo}`;
}
