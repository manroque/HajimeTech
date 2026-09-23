import type { Perfil } from '../types';

/**
 * Matriz de permissões do front-end.
 *
 * ATENÇÃO: no front isso serve apenas para esconder/desabilitar botões.
 * A proteção de verdade deve ser feita no backend (ver /backend/README.md);
 * o mock (services/mockDb.ts → exigirPerfil) simula essa verificação.
 */
export const PERMISSOES = {
  gerenciarEscolas: ['administrador'],
  editarCurriculo: ['administrador', 'professor'],
  gerenciarAlunos: ['administrador', 'professor'],
  gerenciarTurmas: ['administrador', 'professor'],
  registrarFrequencia: ['administrador', 'professor'],
  registrarGraduacao: ['administrador', 'professor'],
  registrarTecnicas: ['administrador', 'professor'],
  avaliarAlunos: ['administrador', 'professor'],
  gerenciarPremiacoes: ['administrador', 'professor'],
  verPainelEscola: ['administrador', 'professor'],
} as const satisfies Record<string, readonly Perfil[]>;

export type Acao = keyof typeof PERMISSOES;

export function pode(perfil: Perfil | undefined, acao: Acao): boolean {
  return !!perfil && (PERMISSOES[acao] as readonly Perfil[]).includes(perfil);
}
