/**
 * Autenticação, faixas, escolas, professores e turmas.
 */
import type { Escola, Faixa, Turma, Usuario } from '../types';
import { daEscola, http, consulta } from './http';

/* ---------------------------------------------------------------- Autenticação */

export interface SessaoLogin {
  token: string;
  usuario: Usuario;
}

export const authService = {
  /** POST /api/auth/login { email, senha } → { token, usuario } */
  entrar(email: string, senha: string): Promise<SessaoLogin> {
    return http.post<SessaoLogin>('/auth/login', { email, senha });
  },

  /** GET /api/auth/me → usuário do token (confirma que a sessão continua válida) */
  sessaoAtual(): Promise<Usuario> {
    return http.get<Usuario>('/auth/me');
  },
};

/* ---------------------------------------------------------------- Faixas */

export const faixasService = {
  /** GET /api/faixas */
  listar(): Promise<Faixa[]> {
    return http.get('/faixas');
  },
};

/* ---------------------------------------------------------------- Escolas */

export type EscolaInput = Pick<Escola, 'nome' | 'cidade' | 'endereco' | 'telefone' | 'responsavel'>;

export const escolasService = {
  /** GET /api/escolas (administrador vê todas; professor e aluno, só a sua) */
  listar(incluirInativas = false): Promise<Escola[]> {
    return http.get(`/escolas${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas */
  criar(dados: EscolaInput): Promise<Escola> {
    return http.post('/escolas', dados);
  },

  /** PUT /api/escolas/:id */
  atualizar(id: string, dados: EscolaInput): Promise<Escola> {
    return http.put(`/escolas/${id}`, dados);
  },

  /** PATCH /api/escolas/:id/ativo { ativo } (desativação lógica) */
  definirAtivo(id: string, ativo: boolean): Promise<Escola> {
    return http.patch(`/escolas/${id}/ativo`, { ativo });
  },

  /** GET /api/escolas/resumo: alunos e turmas ativos por escola */
  resumo(): Promise<Record<string, { alunos: number; turmas: number }>> {
    return http.get('/escolas/resumo');
  },
};

/* ---------------------------------------------------------------- Professores */

export const usuariosService = {
  /** GET /api/escolas/:escolaId/professores */
  listarProfessores(escolaId: string): Promise<Usuario[]> {
    return http.get(`${daEscola(escolaId)}/professores`);
  },
};

/* ---------------------------------------------------------------- Turmas */

export type TurmaInput = Pick<Turma, 'nome' | 'idadeMinima' | 'idadeMaxima' | 'professorId'> & {
  horarios: Pick<Turma['horarios'][number], 'diaSemana' | 'horaInicio' | 'horaFim'>[];
};

/** Envia só os campos esperados pela API (a tela pode passar a turma inteira). */
const corpoTurma = (d: TurmaInput): TurmaInput => ({
  nome: d.nome,
  idadeMinima: d.idadeMinima,
  idadeMaxima: d.idadeMaxima,
  professorId: d.professorId,
  horarios: d.horarios.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })),
});

export const turmasService = {
  /** GET /api/escolas/:escolaId/turmas?incluirInativas= */
  listar(escolaId: string, incluirInativas = false): Promise<Turma[]> {
    return http.get(`${daEscola(escolaId)}/turmas${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas/:escolaId/turmas */
  criar(escolaId: string, dados: TurmaInput): Promise<Turma> {
    return http.post(`${daEscola(escolaId)}/turmas`, corpoTurma(dados));
  },

  /** PUT /api/escolas/:escolaId/turmas/:id (substitui os horários) */
  atualizar(escolaId: string, id: string, dados: TurmaInput): Promise<Turma> {
    return http.put(`${daEscola(escolaId)}/turmas/${id}`, corpoTurma(dados));
  },

  /** PATCH /api/escolas/:escolaId/turmas/:id/ativo { ativo } */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Turma> {
    return http.patch(`${daEscola(escolaId)}/turmas/${id}/ativo`, { ativo });
  },
};
