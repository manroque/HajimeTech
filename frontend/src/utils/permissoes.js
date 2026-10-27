/**
 * Matriz de permissões do front-end.
 *
 * ATENÇÃO: no front isso serve apenas para esconder/desabilitar botões.
 * A proteção de verdade é feita pela API (ver /backend/README.md, seção 4).
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
};

export function pode(perfil, acao) {
  return !!perfil && PERMISSOES[acao].includes(perfil);
}
