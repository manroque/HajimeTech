/**
 * Alunos, frequência e graduações.
 */
import type { Aluno, AlunoInput, FaixaId, Frequencia, Graduacao } from '../types';
import { consulta, daEscola, http } from './http';

/* ---------------------------------------------------------------- Alunos */

export interface FiltroAlunos {
  busca?: string;
  turmaId?: string | null;
  faixaId?: FaixaId | null;
  incluirInativos?: boolean;
}

export const alunosService = {
  /** GET /api/escolas/:escolaId/alunos?busca=&turmaId=&faixaId=&incluirInativos= (a busca ignora acentos) */
  listar(escolaId: string, filtro: FiltroAlunos = {}): Promise<Aluno[]> {
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
  obter(escolaId: string, id: string): Promise<Aluno> {
    return http.get(`${daEscola(escolaId)}/alunos/${id}`);
  },

  /** POST /api/escolas/:escolaId/alunos */
  criar(escolaId: string, dados: AlunoInput): Promise<Aluno> {
    return http.post(`${daEscola(escolaId)}/alunos`, dados);
  },

  /** PUT /api/escolas/:escolaId/alunos/:id (a faixa só muda por meio de uma graduação) */
  atualizar(escolaId: string, id: string, dados: Omit<AlunoInput, 'faixaId'>): Promise<Aluno> {
    return http.put(`${daEscola(escolaId)}/alunos/${id}`, dados);
  },

  /**
   * "Excluir" é desativação lógica: nada é apagado.
   * DELETE /api/escolas/:escolaId/alunos/:id  ou  PATCH .../:id/reativar
   */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Aluno> {
    const rota = `${daEscola(escolaId)}/alunos/${id}`;
    return ativo ? http.patch(`${rota}/reativar`) : http.delete(rota);
  },
};

/* ---------------------------------------------------------------- Frequência */

export interface LinhaChamada {
  alunoId: string;
  nome: string;
  faixaId: FaixaId;
  /** Nulo = chamada ainda não registrada para este aluno nesta data. */
  presente: boolean | null;
}

export const frequenciaService = {
  /** GET /api/escolas/:escolaId/turmas/:turmaId/frequencias?data=AAAA-MM-DD */
  chamada(escolaId: string, turmaId: string, data: string): Promise<LinhaChamada[]> {
    return http.get(`${daEscola(escolaId)}/turmas/${turmaId}/frequencias${consulta({ data })}`);
  },

  /** PUT /api/escolas/:escolaId/turmas/:turmaId/frequencias { data, registros } (cria ou corrige) */
  registrar(escolaId: string, turmaId: string, data: string, registros: { alunoId: string; presente: boolean }[]): Promise<void> {
    return http.put(`${daEscola(escolaId)}/turmas/${turmaId}/frequencias`, { data, registros });
  },

  /** GET /api/escolas/:escolaId/alunos/:alunoId/frequencias */
  doAluno(escolaId: string, alunoId: string): Promise<Frequencia[]> {
    return http.get(`${daEscola(escolaId)}/alunos/${alunoId}/frequencias`);
  },
};

/* ---------------------------------------------------------------- Graduações */

export interface GraduacaoInput {
  alunoId: string;
  novaFaixaId: FaixaId;
  data: string;
  observacoes: string;
}

export const graduacoesService = {
  /** GET /api/escolas/:escolaId/graduacoes?alunoId= (mais recentes primeiro) */
  listar(escolaId: string, alunoId?: string): Promise<Graduacao[]> {
    return http.get(`${daEscola(escolaId)}/graduacoes${consulta({ alunoId })}`);
  },

  /** POST /api/escolas/:escolaId/graduacoes: guarda a faixa anterior e atualiza a faixa do aluno */
  registrar(escolaId: string, dados: GraduacaoInput): Promise<Graduacao> {
    return http.post(`${daEscola(escolaId)}/graduacoes`, dados);
  },
};
