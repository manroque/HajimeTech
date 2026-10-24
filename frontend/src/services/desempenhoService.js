import { consulta, daEscola, http } from './http';

/* ---------------------------------------------------------------- Avaliações */

export const avaliacoesService = {
  /** GET /api/escolas/:escolaId/criterios-avaliacao */
  listarCriterios(escolaId) {
    return http.get(`${daEscola(escolaId)}/criterios-avaliacao`);
  },

  /** GET /api/escolas/:escolaId/avaliacoes?alunoId= (data crescente, para o gráfico) */
  listar(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/avaliacoes${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/avaliacoes (uma nota de 1 a 5 para cada critério) */
  criar(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/avaliacoes`, dados);
  },
};

/** Média simples das notas de uma avaliação (1 a 5). */
export function mediaAvaliacao(a) {
  if (!a.notas.length) return 0;
  return a.notas.reduce((s, n) => s + n.nota, 0) / a.notas.length;
}

/* ---------------------------------------------------------------- Premiações */

export const premiacoesService = {
  /** GET /api/escolas/:escolaId/premiacoes?incluirInativas= */
  listar(escolaId, incluirInativas = false) {
    return http.get(`${daEscola(escolaId)}/premiacoes${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas/:escolaId/premiacoes */
  criar(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/premiacoes`, dados);
  },

  /** PUT /api/escolas/:escolaId/premiacoes/:id */
  atualizar(escolaId, id, dados) {
    return http.put(`${daEscola(escolaId)}/premiacoes/${id}`, dados);
  },

  /** PATCH /api/escolas/:escolaId/premiacoes/:id/ativo { ativo } */
  definirAtivo(escolaId, id, ativo) {
    return http.patch(`${daEscola(escolaId)}/premiacoes/${id}/ativo`, { ativo });
  },

  /** GET /api/escolas/:escolaId/premiacoes-aluno?alunoId= (mais recentes primeiro) */
  listarConcedidas(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/premiacoes-aluno${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/premiacoes-aluno */
  conceder(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/premiacoes-aluno`, dados);
  },

  /** DELETE /api/escolas/:escolaId/premiacoes-aluno/:id (remove uma concessão lançada por engano) */
  removerConcessao(escolaId, id) {
    return http.delete(`${daEscola(escolaId)}/premiacoes-aluno/${id}`);
  },
};
