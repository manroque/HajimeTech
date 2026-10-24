/**
 * Currículo (categorias e técnicas por faixa) e acompanhamento técnico dos alunos.
 *
 * Regras aplicadas pela API:
 *  Somente administradores e professores criam, editam, reordenam ou desativam itens.
 *  Técnicas e categorias nunca são apagadas, apenas desativadas.
 *  Marrom e Preta não têm conteúdo definido: a API recusa criar itens nelas (422).
 */
import type { CategoriaComTecnicas, CategoriaCurriculo, FaixaId, NivelTecnica, Tecnica, TecnicaAluno } from '../types';
import { consulta, daEscola, http } from './http';

const doCurriculo = (escolaId: string) => `${daEscola(escolaId)}/curriculo`;

export const curriculoService = {
  /** GET /api/escolas/:escolaId/curriculo?faixaId=&incluirInativas= */
  listarPorFaixa(escolaId: string, faixaId: FaixaId, incluirInativas = false): Promise<CategoriaComTecnicas[]> {
    return http.get(`${doCurriculo(escolaId)}${consulta({ faixaId, incluirInativas })}`);
  },

  /** GET /api/escolas/:escolaId/tecnicas: técnicas ativas com a faixa e o nome da categoria */
  listarTecnicas(escolaId: string): Promise<(Tecnica & { faixaId: FaixaId; categoriaNome: string })[]> {
    return http.get(`${daEscola(escolaId)}/tecnicas`);
  },

  /* ----- Categorias ----- */

  /** POST /api/escolas/:escolaId/curriculo/categorias */
  criarCategoria(escolaId: string, dados: { faixaId: FaixaId; nome: string; descricao: string }): Promise<CategoriaCurriculo> {
    return http.post(`${doCurriculo(escolaId)}/categorias`, dados);
  },

  /** PUT /api/escolas/:escolaId/curriculo/categorias/:id */
  atualizarCategoria(escolaId: string, id: string, dados: { nome: string; descricao: string }): Promise<CategoriaCurriculo> {
    return http.put(`${doCurriculo(escolaId)}/categorias/${id}`, dados);
  },

  /** DELETE /api/escolas/:escolaId/curriculo/categorias/:id (desativa a categoria e suas técnicas) */
  excluirCategoria(escolaId: string, id: string): Promise<void> {
    return http.delete(`${doCurriculo(escolaId)}/categorias/${id}`);
  },

  /** PATCH /api/escolas/:escolaId/curriculo/categorias/reordenar { ids }: todas as categorias ativas da faixa, na nova ordem */
  reordenarCategorias(escolaId: string, ids: string[]): Promise<void> {
    return http.patch(`${doCurriculo(escolaId)}/categorias/reordenar`, { ids });
  },

  /* ----- Técnicas ----- */

  /** POST /api/escolas/:escolaId/curriculo/tecnicas */
  criarTecnica(escolaId: string, dados: { categoriaId: string; nome: string; descricao: string }): Promise<Tecnica> {
    return http.post(`${doCurriculo(escolaId)}/tecnicas`, dados);
  },

  /** PUT /api/escolas/:escolaId/curriculo/tecnicas/:id */
  atualizarTecnica(escolaId: string, id: string, dados: { nome: string; descricao: string }): Promise<Tecnica> {
    return http.put(`${doCurriculo(escolaId)}/tecnicas/${id}`, dados);
  },

  /** PATCH /api/escolas/:escolaId/curriculo/tecnicas/:id/ativo { ativo }: desativa ou reativa, nunca apaga */
  definirTecnicaAtiva(escolaId: string, id: string, ativo: boolean): Promise<Tecnica> {
    return http.patch(`${doCurriculo(escolaId)}/tecnicas/${id}/ativo`, { ativo });
  },

  /** PATCH /api/escolas/:escolaId/curriculo/tecnicas/reordenar { categoriaId, ids }: todas as técnicas ativas da categoria */
  reordenarTecnicas(escolaId: string, categoriaId: string, ids: string[]): Promise<void> {
    return http.patch(`${doCurriculo(escolaId)}/tecnicas/reordenar`, { categoriaId, ids });
  },
};

/** Troca um item com o vizinho e devolve a nova lista de ids (usado nos botões subir e descer). */
export function moverNaLista(ids: string[], id: string, direcao: 'cima' | 'baixo'): string[] | null {
  const i = ids.indexOf(id);
  const j = direcao === 'cima' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const nova = [...ids];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

/* ---------------------------------------------------------------- Acompanhamento técnico */

export interface ProgressoCurriculo {
  faixaId: FaixaId;
  conteudoDefinido: boolean;
  total: number;
  domina: number;
  emDesenvolvimento: number;
  iniciante: number;
  /** 0 a 100: percentual de técnicas da faixa atual que o aluno já domina. */
  percentual: number;
}

export const tecnicasAlunoService = {
  /** GET /api/escolas/:escolaId/alunos/:alunoId/tecnicas */
  listar(escolaId: string, alunoId: string): Promise<TecnicaAluno[]> {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/tecnicas`);
  },

  /** PUT /api/escolas/:escolaId/alunos/:alunoId/tecnicas/:tecnicaId { nivel, observacoes } (cria ou atualiza) */
  salvar(escolaId: string, alunoId: string, tecnicaId: string, nivel: NivelTecnica, observacoes: string): Promise<TecnicaAluno> {
    return http.put(`${daEscola(escolaId)}/alunos/${alunoId}/tecnicas/${tecnicaId}`, { nivel, observacoes });
  },

  /** GET /api/escolas/:escolaId/alunos/:alunoId/progresso */
  progresso(escolaId: string, alunoId: string): Promise<ProgressoCurriculo> {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/progresso`);
  },
};
