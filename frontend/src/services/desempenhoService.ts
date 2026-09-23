/**
 * Avaliações de desempenho e premiações.
 */
import type { Avaliacao, CriterioAvaliacao, NotaCriterio, Premiacao, PremiacaoAluno } from '../types';
import { ErroApi, agora, db, encontrar, exigirPerfil, novoId, salvar, simular, usuarioAtual } from './mockDb';

const GESTORES = ['administrador', 'professor'] as const;

/* ---------------------------------------------------------------- Avaliações */

export interface AvaliacaoInput {
  alunoId: string;
  data: string;
  observacoes: string;
  notas: NotaCriterio[];
}

export const avaliacoesService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/criterios-avaliacao */
  listarCriterios(escolaId: string): Promise<CriterioAvaliacao[]> {
    return simular(() =>
      db()
        .criterios.filter((c) => c.escolaId === escolaId && c.ativo)
        .sort((a, b) => a.ordem - b.ordem),
    );
  },

  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/avaliacoes?alunoId= */
  listar(escolaId: string, alunoId?: string): Promise<Avaliacao[]> {
    return simular(() =>
      db()
        .avaliacoes.filter((a) => a.escolaId === escolaId && (!alunoId || a.alunoId === alunoId))
        .sort((a, b) => a.data.localeCompare(b.data)),
    );
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/avaliacoes (grava avaliacoes + avaliacao_notas) */
  criar(escolaId: string, dados: AvaliacaoInput): Promise<Avaliacao> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      if (dados.notas.some((n) => n.nota < 1 || n.nota > 5)) throw new ErroApi(400, 'As notas devem estar entre 1 e 5.');
      encontrar(db().alunos.filter((a) => a.escolaId === escolaId), dados.alunoId, 'Aluno');
      const avaliacao: Avaliacao = {
        ...dados,
        id: novoId(),
        escolaId,
        avaliadorId: usuarioAtual()?.id ?? null,
        criadoEm: agora(),
      };
      db().avaliacoes.push(avaliacao);
      salvar();
      return avaliacao;
    });
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
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/premiacoes */
  listar(escolaId: string, incluirInativas = false): Promise<Premiacao[]> {
    return simular(() => db().premiacoes.filter((p) => p.escolaId === escolaId && (incluirInativas || p.ativo)));
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/premiacoes */
  criar(escolaId: string, dados: PremiacaoInput): Promise<Premiacao> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const premiacao: Premiacao = { ...dados, id: novoId(), escolaId, ativo: true };
      db().premiacoes.push(premiacao);
      salvar();
      return premiacao;
    });
  },

  /** INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/premiacoes/:id */
  atualizar(escolaId: string, id: string, dados: PremiacaoInput): Promise<Premiacao> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const premiacao = encontrar(db().premiacoes.filter((p) => p.escolaId === escolaId), id, 'Premiação');
      Object.assign(premiacao, dados);
      salvar();
      return premiacao;
    });
  },

  /** INTEGRAÇÃO BACKEND: PATCH /api/escolas/:escolaId/premiacoes/:id/ativo { ativo } */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Premiacao> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const premiacao = encontrar(db().premiacoes.filter((p) => p.escolaId === escolaId), id, 'Premiação');
      premiacao.ativo = ativo;
      salvar();
      return premiacao;
    });
  },

  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/premiacoes-aluno?alunoId= */
  listarConcedidas(escolaId: string, alunoId?: string): Promise<PremiacaoAluno[]> {
    return simular(() =>
      db()
        .premiacoesAluno.filter((p) => p.escolaId === escolaId && (!alunoId || p.alunoId === alunoId))
        .sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/premiacoes-aluno */
  conceder(escolaId: string, dados: ConcessaoInput): Promise<PremiacaoAluno> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      encontrar(db().alunos.filter((a) => a.escolaId === escolaId), dados.alunoId, 'Aluno');
      const concessao: PremiacaoAluno = { ...dados, id: novoId(), escolaId };
      db().premiacoesAluno.push(concessao);
      salvar();
      return concessao;
    });
  },

  /**
   * Remove uma concessão lançada por engano (o tipo de premiação continua existindo).
   * INTEGRAÇÃO BACKEND: DELETE /api/escolas/:escolaId/premiacoes-aluno/:id
   */
  removerConcessao(escolaId: string, id: string): Promise<void> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const lista = db().premiacoesAluno;
      const i = lista.findIndex((p) => p.id === id && p.escolaId === escolaId);
      if (i < 0) throw new ErroApi(404, 'Premiação não encontrada.');
      lista.splice(i, 1);
      salvar();
    });
  },
};
