import { daEscola, http, consulta } from './http';

/* ---------------------------------------------------------------- Autenticação */

export const authService = {
  /** POST /api/auth/login { email, senha } → { token, usuario } */
  entrar(email, senha) {
    return http.post('/auth/login', { email, senha });
  },

  /** GET /api/auth/me → usuário do token (confirma que a sessão continua válida) */
  sessaoAtual() {
    return http.get('/auth/me');
  },
};

/* ---------------------------------------------------------------- Faixas */

export const faixasService = {
  /** GET /api/faixas */
  listar() {
    return http.get('/faixas');
  },
};

/* ---------------------------------------------------------------- Escolas */

export const escolasService = {
  /** GET /api/escolas (administrador vê todas; professor e aluno, só a sua) */
  listar(incluirInativas = false) {
    return http.get(`/escolas${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas */
  criar(dados) {
    return http.post('/escolas', dados);
  },

  /** PUT /api/escolas/:id */
  atualizar(id, dados) {
    return http.put(`/escolas/${id}`, dados);
  },

  /** PATCH /api/escolas/:id/ativo { ativo } (desativação lógica) */
  definirAtivo(id, ativo) {
    return http.patch(`/escolas/${id}/ativo`, { ativo });
  },

  /** GET /api/escolas/resumo: alunos e turmas ativos por escola */
  resumo() {
    return http.get('/escolas/resumo');
  },
};

/* ---------------------------------------------------------------- Professores */

export const usuariosService = {
  /** GET /api/escolas/:escolaId/professores */
  listarProfessores(escolaId) {
    return http.get(`${daEscola(escolaId)}/professores`);
  },
};

/* ---------------------------------------------------------------- Turmas */

/** Envia só os campos esperados pela API (a tela pode passar a turma inteira). */
const corpoTurma = (d) => ({
  nome: d.nome,
  idadeMinima: d.idadeMinima,
  idadeMaxima: d.idadeMaxima,
  professorId: d.professorId,
  horarios: d.horarios.map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim })),
});

export const turmasService = {
  /** GET /api/escolas/:escolaId/turmas?incluirInativas= */
  listar(escolaId, incluirInativas = false) {
    return http.get(`${daEscola(escolaId)}/turmas${consulta({ incluirInativas })}`);
  },

  /** POST /api/escolas/:escolaId/turmas */
  criar(escolaId, dados) {
    return http.post(`${daEscola(escolaId)}/turmas`, corpoTurma(dados));
  },

  /** PUT /api/escolas/:escolaId/turmas/:id (substitui os horários) */
  atualizar(escolaId, id, dados) {
    return http.put(`${daEscola(escolaId)}/turmas/${id}`, corpoTurma(dados));
  },

  /** PATCH /api/escolas/:escolaId/turmas/:id/ativo { ativo } */
  definirAtivo(escolaId, id, ativo) {
    return http.patch(`${daEscola(escolaId)}/turmas/${id}/ativo`, { ativo });
  },
};
