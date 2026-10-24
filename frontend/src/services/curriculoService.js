import { consulta, daEscola, http } from './http';

const doCurriculo = (escolaId) => `${daEscola(escolaId)}/curriculo`;

export const curriculoService = {
  /** GET /api/escolas/:escolaId/curriculo?faixaId=&incluirInativas= */
  listarPorFaixa(escolaId, faixaId, incluirInativas = false) {
    return http.get(`${doCurriculo(escolaId)}${consulta({ faixaId, incluirInativas })}`);
  },

  /** GET /api/escolas/:escolaId/tecnicas: técnicas ativas com a faixa e o nome da categoria */
  listarTecnicas(escolaId) {
    return http.get(`${daEscola(escolaId)}/tecnicas`);
  },

  /* ----- Categorias ----- */

  /** POST /api/escolas/:escolaId/curriculo/categorias */
  criarCategoria(escolaId, dados) {
    return http.post(`${doCurriculo(escolaId)}/categorias`, dados);
  },

  /** PUT /api/escolas/:escolaId/curriculo/categorias/:id */
  atualizarCategoria(escolaId, id, dados) {
    return http.put(`${doCurriculo(escolaId)}/categorias/${id}`, dados);
  },

  /** DELETE /api/escolas/:escolaId/curriculo/categorias/:id (desativa a categoria e suas técnicas) */
  excluirCategoria(escolaId, id) {
    return http.delete(`${doCurriculo(escolaId)}/categorias/${id}`);
  },

  /** PATCH /api/escolas/:escolaId/curriculo/categorias/reordenar { ids }: todas as categorias ativas da faixa, na nova ordem */
  reordenarCategorias(escolaId, ids) {
    return http.patch(`${doCurriculo(escolaId)}/categorias/reordenar`, { ids });
  },

  /* ----- Técnicas ----- */

  /** POST /api/escolas/:escolaId/curriculo/tecnicas */
  criarTecnica(escolaId, dados) {
    return http.post(`${doCurriculo(escolaId)}/tecnicas`, dados);
  },

  /** PUT /api/escolas/:escolaId/curriculo/tecnicas/:id */
  atualizarTecnica(escolaId, id, dados) {
    return http.put(`${doCurriculo(escolaId)}/tecnicas/${id}`, dados);
  },

  /** PATCH /api/escolas/:escolaId/curriculo/tecnicas/:id/ativo { ativo }: desativa ou reativa, nunca apaga */
  definirTecnicaAtiva(escolaId, id, ativo) {
    return http.patch(`${doCurriculo(escolaId)}/tecnicas/${id}/ativo`, { ativo });
  },

  /** PATCH /api/escolas/:escolaId/curriculo/tecnicas/reordenar { categoriaId, ids }: todas as técnicas ativas da categoria */
  reordenarTecnicas(escolaId, categoriaId, ids) {
    return http.patch(`${doCurriculo(escolaId)}/tecnicas/reordenar`, { categoriaId, ids });
  },
};

/** Troca um item com o vizinho e devolve a nova lista de ids (usado nos botões subir e descer). */
export function moverNaLista(ids, id, direcao) {
  const i = ids.indexOf(id);
  const j = direcao === 'cima' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const nova = [...ids];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

/* ---------------------------------------------------------------- Acompanhamento técnico */

export const tecnicasAlunoService = {
  /** GET /api/escolas/:escolaId/alunos/:alunoId/tecnicas */
  listar(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/tecnicas`);
  },

  /** PUT /api/escolas/:escolaId/alunos/:alunoId/tecnicas/:tecnicaId { nivel, observacoes } (cria ou atualiza) */
  salvar(escolaId, alunoId, tecnicaId, nivel, observacoes) {
    return http.put(`${daEscola(escolaId)}/alunos/${alunoId}/tecnicas/${tecnicaId}`, { nivel, observacoes });
  },

  /** GET /api/escolas/:escolaId/alunos/:alunoId/progresso */
  progresso(escolaId, alunoId) {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/progresso`);
  },
};
