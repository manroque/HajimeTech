/**
 * Avaliações de desempenho e premiações.
 */
import type { Avaliacao, CriterioAvaliacao, NotaCriterio, Premiacao, PremiacaoAluno } from '../types';
import { consulta, daEscola, http } from './http';

/* ---------------------------------------------------------------- Avaliações */

export interface AvaliacaoInput {
  alunoId: string;
  data: string;
  observacoes: string;
  notas: NotaCriterio[];
}

export const avaliacoesService = {
  /** GET /api/escolas/:escolaId/criterios-avaliacao */
  listarCriterios(escolaId: string): Promise<CriterioAvaliacao[]> {
    return http.get(`${daEscola(escolaId)}/criterios-avaliacao`);
  },

  /** GET /api/escolas/:escolaId/avaliacoes?alunoId= (data crescente, para o gráfico) */
  listar(escolaId: string, alunoId?: string): Promise<Avaliacao[]> {
    return http.get(`${daEscola(escolaId)}/avaliacoes${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/avaliacoes (uma nota de 1 a 5 para cada critério) */
  criar(escolaId: string, dados: AvaliacaoInput): Promise<Avaliacao> {
    return http.post(`${daEscola(escolaId)}/avaliacoes`, dados);
  },
};

/** Média simples das notas de uma avaliação (1 a 5). */
export function mediaAvaliacao(a: Pick<Avaliacao, 'notas'>): number {
  if (!a.notas.length) return 0;
  return a.notas.reduce((s, n) => s + n.nota, 0) / a.notas.length;
}

/* ---------------------------------------------------------------- Premiações */

export type PremiacaoInput = Pick<Premiacao, 'nome' | 'descricao' | 'tipo'>;
export type ConcessaoInput = Pick<PremiacaoAluno, 'premiacaoId' | 'alunoId' | 'data' | 'descricao'>;

export const premiacoesService = {
  /** GET /api/escolas/:escolaId/premiacoes?incluirInativas= */
  listar(escolaId: string, incluirInativas = false): Promise<Premiacao[]> {
    return http.get(`${daEscola(escolaId)}/premiacoes${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas/:escolaId/premiacoes */
  criar(escolaId: string, dados: PremiacaoInput): Promise<Premiacao> {
    return http.post(`${daEscola(escolaId)}/premiacoes`, dados);
  },

  /** PUT /api/escolas/:escolaId/premiacoes/:id */
  atualizar(escolaId: string, id: string, dados: PremiacaoInput): Promise<Premiacao> {
    return http.put(`${daEscola(escolaId)}/premiacoes/${id}`, dados);
  },

  /** PATCH /api/escolas/:escolaId/premiacoes/:id/ativo { ativo } */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Premiacao> {
    return http.patch(`${daEscola(escolaId)}/premiacoes/${id}/ativo`, { ativo });
  },

  /** GET /api/escolas/:escolaId/premiacoes-aluno?alunoId= (mais recentes primeiro) */
  listarConcedidas(escolaId: string, alunoId?: string): Promise<PremiacaoAluno[]> {
    return http.get(`${daEscola(escolaId)}/premiacoes-aluno${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/premiacoes-aluno */
  conceder(escolaId: string, dados: ConcessaoInput): Promise<PremiacaoAluno> {
    return http.post(`${daEscola(escolaId)}/premiacoes-aluno`, dados);
  },

  /** DELETE /api/escolas/:escolaId/premiacoes-aluno/:id (remove uma concessão lançada por engano) */
  removerConcessao(escolaId: string, id: string): Promise<void> {
    return http.delete(`${daEscola(escolaId)}/premiacoes-aluno/${id}`);
  },
};
