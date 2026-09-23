/**
 * Utilitários dos mocks.
 *
 * Os dados de exemplo precisam ser DETERMINÍSTICOS: o script
 * `npm run gerar-seed` lê estes mesmos mocks para gerar /database/seed.sql,
 * então IDs e sorteios devem sair sempre iguais.
 */
import type { DataISO } from '../types';

/** Códigos de tabela usados no primeiro bloco dos UUIDs de exemplo. */
export const TABELA = {
  escolas: 1,
  usuarios: 2,
  turmas: 3,
  horarios: 4,
  alunos: 5,
  frequencias: 6,
  graduacoes: 7,
  categorias: 8,
  tecnicas: 9,
  tecnicasAluno: 10,
  criterios: 11,
  avaliacoes: 12,
  premiacoes: 13,
  premiacoesAluno: 14,
} as const;

/** Gera um UUID válido e previsível, ex.: `00000005-0000-4000-8000-000000000012`. */
export function uid(tabela: number, n: number): string {
  return `${tabela.toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString().padStart(12, '0')}`;
}

/** Gerador pseudoaleatório com semente (mulberry32). */
export function criarSorteio(semente: number) {
  let a = semente >>> 0;
  return function sorteio(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Data local de hoje, sem horário. */
export function hojeLocal(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function paraISO(d: Date): DataISO {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function deISO(iso: DataISO): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Data de `n` dias atrás, em ISO. As datas dos mocks são relativas a hoje. */
export function diasAtras(n: number): DataISO {
  const d = hojeLocal();
  d.setDate(d.getDate() - n);
  return paraISO(d);
}

/** Momento fixo usado nos campos criado_em/atualizado_em dos mocks. */
export const CRIADO_EM = new Date().toISOString();
