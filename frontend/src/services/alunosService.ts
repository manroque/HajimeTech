/**
 * Alunos, frequência e graduações.
 */
import type { Aluno, AlunoInput, FaixaId, Frequencia, Graduacao } from '../types';
import { ErroApi, agora, db, encontrar, exigirPerfil, novoId, salvar, simular } from './mockDb';

const GESTORES = ['administrador', 'professor'] as const;

function alunoDaEscola(escolaId: string, id: string): Aluno {
  return encontrar(db().alunos.filter((a) => a.escolaId === escolaId), id, 'Aluno');
}

/* ---------------------------------------------------------------- Alunos */

export interface FiltroAlunos {
  busca?: string;
  turmaId?: string | null;
  faixaId?: FaixaId | null;
  incluirInativos?: boolean;
}

/** Remove acentos para a busca por nome funcionar com "joao" → "João". */
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const alunosService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/alunos?busca=&turmaId=&faixaId=&incluirInativos= */
  listar(escolaId: string, filtro: FiltroAlunos = {}): Promise<Aluno[]> {
    return simular(() => {
      const busca = normalizar(filtro.busca?.trim() ?? '');
      return db()
        .alunos.filter(
          (a) =>
            a.escolaId === escolaId &&
            (filtro.incluirInativos || a.ativo) &&
            (!filtro.turmaId || a.turmaId === filtro.turmaId) &&
            (!filtro.faixaId || a.faixaId === filtro.faixaId) &&
            (!busca || normalizar(a.nome).includes(busca)),
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));
    });
  },

  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/alunos/:id */
  obter(escolaId: string, id: string): Promise<Aluno> {
    return simular(() => alunoDaEscola(escolaId, id));
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/alunos */
  criar(escolaId: string, dados: AlunoInput): Promise<Aluno> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      if (!dados.nome.trim()) throw new ErroApi(400, 'Informe o nome do aluno.');
      const aluno: Aluno = { ...dados, id: novoId(), escolaId, ativo: true, criadoEm: agora(), atualizadoEm: agora() };
      db().alunos.push(aluno);
      salvar();
      return aluno;
    });
  },

  /**
   * INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/alunos/:id
   * Obs.: a faixa só muda por meio de uma graduação (ver graduacoesService).
   */
  atualizar(escolaId: string, id: string, dados: Omit<AlunoInput, 'faixaId'>): Promise<Aluno> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const aluno = alunoDaEscola(escolaId, id);
      Object.assign(aluno, dados, { atualizadoEm: agora() });
      salvar();
      return aluno;
    });
  },

  /**
   * "Excluir" = desativação lógica (soft delete). Nada é apagado do banco.
   * INTEGRAÇÃO BACKEND: DELETE /api/escolas/:escolaId/alunos/:id  (faz UPDATE ativo = false)
   * Reativar: PATCH /api/escolas/:escolaId/alunos/:id/reativar
   */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Aluno> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const aluno = alunoDaEscola(escolaId, id);
      aluno.ativo = ativo;
      aluno.atualizadoEm = agora();
      salvar();
      return aluno;
    });
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
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/turmas/:turmaId/frequencias?data=AAAA-MM-DD */
  chamada(escolaId: string, turmaId: string, data: string): Promise<LinhaChamada[]> {
    return simular(() => {
      const { alunos, frequencias } = db();
      return alunos
        .filter((a) => a.escolaId === escolaId && a.turmaId === turmaId && a.ativo)
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((a) => {
          const registro = frequencias.find((f) => f.alunoId === a.id && f.data === data);
          return { alunoId: a.id, nome: a.nome, faixaId: a.faixaId, presente: registro ? registro.presente : null };
        });
    });
  },

  /**
   * Grava (cria ou atualiza) a presença de vários alunos de uma vez.
   * INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/turmas/:turmaId/frequencias
   * corpo: { data, registros: [{ alunoId, presente }] }, com upsert por (aluno_id, data)
   */
  registrar(escolaId: string, turmaId: string, data: string, registros: { alunoId: string; presente: boolean }[]): Promise<void> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const { frequencias } = db();
      for (const r of registros) {
        const existente = frequencias.find((f) => f.alunoId === r.alunoId && f.data === data);
        if (existente) Object.assign(existente, { presente: r.presente, turmaId });
        else frequencias.push({ id: novoId(), escolaId, alunoId: r.alunoId, turmaId, data, presente: r.presente });
      }
      salvar();
    });
  },

  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/alunos/:alunoId/frequencias */
  doAluno(escolaId: string, alunoId: string): Promise<Frequencia[]> {
    return simular(() =>
      db()
        .frequencias.filter((f) => f.escolaId === escolaId && f.alunoId === alunoId)
        .sort((a, b) => a.data.localeCompare(b.data)),
    );
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
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/graduacoes?alunoId= */
  listar(escolaId: string, alunoId?: string): Promise<Graduacao[]> {
    return simular(() =>
      db()
        .graduacoes.filter((g) => g.escolaId === escolaId && (!alunoId || g.alunoId === alunoId))
        .sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  /**
   * Registra a graduação: guarda a faixa anterior e atualiza a faixa atual do aluno.
   * INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/graduacoes (deve rodar em transação)
   */
  registrar(escolaId: string, dados: GraduacaoInput): Promise<Graduacao> {
    return simular(() => {
      exigirPerfil([...GESTORES]);
      const aluno = alunoDaEscola(escolaId, dados.alunoId);
      // Regra: a graduação segue a progressão, então a nova faixa deve ser superior à atual.
      const ordem = (id: FaixaId) => db().faixas.find((f) => f.id === id)!.ordem;
      if (ordem(dados.novaFaixaId) <= ordem(aluno.faixaId)) {
        throw new ErroApi(400, 'A nova faixa deve ser superior à faixa atual do aluno.');
      }
      const graduacao: Graduacao = {
        id: novoId(),
        escolaId,
        alunoId: aluno.id,
        faixaAnteriorId: aluno.faixaId,
        novaFaixaId: dados.novaFaixaId,
        data: dados.data,
        observacoes: dados.observacoes,
        criadoEm: agora(),
      };
      db().graduacoes.push(graduacao);
      aluno.faixaId = dados.novaFaixaId;
      aluno.atualizadoEm = agora();
      salvar();
      return graduacao;
    });
  },
};
