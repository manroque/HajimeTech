import { consulta, daEscola, http } from './http';

/* ---------------------------------------------------------------- Alunos */

export const alunosService = {
  /** GET /api/escolas/:escolaId/alunos?busca=&turmaId=&faixaId=&incluirInativos= (a busca ignora acentos) */
  listar(escolaId, filtro = {}) {
    return http.get(
      `${daEscola(escolaId)}/alunos${consulta({
        busca: filtro.busca?.trim(),
        turmaId: filtro.turmaId,
        faixaId: filtro.faixaId,
        incluirInativos: filtro.incluirInativos,
      })}`,
    );
  },

  /** GET /api/escolas/:escolaId/alunos/:id */
  obter(escolaId, id) {
    return http.get(`${daEscola(escolaId)}/alunos/${id}`);
  },

  /** POST /api/escolas/:escolaId/alunos */
  criar(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/alunos`, dados);
  },

  /** PUT /api/escolas/:escolaId/alunos/:id (a faixa só muda por meio de uma graduação) */
  atualizar(escolaId, id, dados) {
    return http.put(`${daEscola(escolaId)}/alunos/${id}`, dados);
  },

  /**
   * "Excluir" é desativação lógica: nada é apagado.
   * DELETE /api/escolas/:escolaId/alunos/:id  ou  PATCH .../:id/reativar
   */
  definirAtivo(escolaId, id, ativo) {
    const rota = `${daEscola(escolaId)}/alunos/${id}`;
    return ativo ? http.patch(`${rota}/reativar`) : http.delete(rota);
  },
};

/* ---------------------------------------------------------------- Frequência */

export const frequenciaService = {
  /** GET /api/escolas/:escolaId/turmas/:turmaId/frequencias?data=AAAA-MM-DD */
  chamada(escolaId, turmaId, data) {
    return http.get(`${daEscola(escolaId)}/turmas/${turmaId}/frequencias${consulta({ data })}`);
  },

  /** PUT /api/escolas/:escolaId/turmas/:turmaId/frequencias { data, registros } (cria ou corrige) */
  registrar(escolaId, turmaId, data, registros) {
    return http.put(`${daEscola(escolaId)}/turmas/${turmaId}/frequencias`, { data, registros });
  },

  /** GET /api/escolas/:escolaId/alunos/:alunoId/frequencias */
  doAluno(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/frequencias`);
  },
};

/* ---------------------------------------------------------------- Graduações */

export const graduacoesService = {
  /** GET /api/escolas/:escolaId/graduacoes?alunoId= (mais recentes primeiro) */
  listar(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/graduacoes${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/graduacoes: guarda a faixa anterior e atualiza a faixa do aluno */
  registrar(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/graduacoes`, dados);
  },
};
