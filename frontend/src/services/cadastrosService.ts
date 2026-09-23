/**
 * Autenticação simulada, escolas, faixas e turmas.
 * Cada função indica o endpoint REST que a substituirá.
 */
import type { Escola, Faixa, Turma, Usuario } from '../types';
import { agora, db, encontrar, exigirPerfil, novoId, salvar, simular, usuarioAtual } from './mockDb';

/* ---------------------------------------------------------------- Autenticação */

export const authService = {
  /** INTEGRAÇÃO BACKEND: não existe na API real, onde o login usa e-mail e senha. */
  listarUsuariosDemo(): Promise<Usuario[]> {
    return simular(() => db().usuarios.filter((u) => u.ativo));
  },

  /** INTEGRAÇÃO BACKEND: POST /api/auth/login { email, senha } → { token, usuario } */
  entrar(usuarioId: string): Promise<Usuario> {
    return simular(() => encontrar(db().usuarios, usuarioId, 'Usuário'));
  },
};

/* ---------------------------------------------------------------- Faixas */

export const faixasService = {
  /** INTEGRAÇÃO BACKEND: GET /api/faixas */
  listar(): Promise<Faixa[]> {
    return simular(() => db().faixas, 0);
  },
};

/* ---------------------------------------------------------------- Escolas */

export type EscolaInput = Pick<Escola, 'nome' | 'cidade' | 'endereco' | 'telefone' | 'responsavel'>;

export const escolasService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas (admin vê todas; professor, só a sua) */
  listar(incluirInativas = false): Promise<Escola[]> {
    return simular(() => {
      const usuario = usuarioAtual();
      return db()
        .escolas.filter((e) => incluirInativas || e.ativo)
        // Professores e alunos só enxergam a própria escola.
        .filter((e) => !usuario || usuario.perfil === 'administrador' || e.id === usuario.escolaId)
        .sort((a, b) => a.nome.localeCompare(b.nome));
    });
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas */
  criar(dados: EscolaInput): Promise<Escola> {
    return simular(() => {
      exigirPerfil(['administrador']);
      const escola: Escola = { ...dados, id: novoId(), ativo: true, criadoEm: agora(), atualizadoEm: agora() };
      db().escolas.push(escola);
      salvar();
      return escola;
    });
  },

  /** INTEGRAÇÃO BACKEND: PUT /api/escolas/:id */
  atualizar(id: string, dados: EscolaInput): Promise<Escola> {
    return simular(() => {
      exigirPerfil(['administrador']);
      const escola = encontrar(db().escolas, id, 'Escola');
      Object.assign(escola, dados, { atualizadoEm: agora() });
      salvar();
      return escola;
    });
  },

  /** INTEGRAÇÃO BACKEND: PATCH /api/escolas/:id/ativo { ativo } (desativação lógica) */
  definirAtivo(id: string, ativo: boolean): Promise<Escola> {
    return simular(() => {
      exigirPerfil(['administrador']);
      const escola = encontrar(db().escolas, id, 'Escola');
      escola.ativo = ativo;
      escola.atualizadoEm = agora();
      salvar();
      return escola;
    });
  },

  /** Resumo usado nos cartões da tela de escolas. INTEGRAÇÃO BACKEND: GET /api/escolas/resumo */
  resumo(): Promise<Record<string, { alunos: number; turmas: number }>> {
    return simular(() => {
      const { alunos, turmas, escolas } = db();
      return Object.fromEntries(
        escolas.map((e) => [
          e.id,
          {
            alunos: alunos.filter((a) => a.escolaId === e.id && a.ativo).length,
            turmas: turmas.filter((t) => t.escolaId === e.id && t.ativo).length,
          },
        ]),
      );
    });
  },
};

/* ---------------------------------------------------------------- Professores */

export const usuariosService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/professores */
  listarProfessores(escolaId: string): Promise<Usuario[]> {
    return simular(() => db().usuarios.filter((u) => u.perfil === 'professor' && u.escolaId === escolaId && u.ativo));
  },
};

/* ---------------------------------------------------------------- Turmas */

export type TurmaInput = Pick<Turma, 'nome' | 'idadeMinima' | 'idadeMaxima' | 'professorId'> & {
  horarios: Pick<Turma['horarios'][number], 'diaSemana' | 'horaInicio' | 'horaFim'>[];
};

export const turmasService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/turmas?incluirInativas=false */
  listar(escolaId: string, incluirInativas = false): Promise<Turma[]> {
    return simular(() =>
      db()
        .turmas.filter((t) => t.escolaId === escolaId && (incluirInativas || t.ativo))
        .sort((a, b) => a.idadeMinima - b.idadeMinima),
    );
  },

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/turmas */
  criar(escolaId: string, dados: TurmaInput): Promise<Turma> {
    return simular(() => {
      exigirPerfil(['administrador', 'professor']);
      const id = novoId();
      const turma: Turma = {
        ...dados,
        id,
        escolaId,
        ativo: true,
        horarios: dados.horarios.map((h) => ({ ...h, id: novoId(), turmaId: id })),
        criadoEm: agora(),
        atualizadoEm: agora(),
      };
      db().turmas.push(turma);
      salvar();
      return turma;
    });
  },

  /** INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/turmas/:id (substitui os horários) */
  atualizar(escolaId: string, id: string, dados: TurmaInput): Promise<Turma> {
    return simular(() => {
      exigirPerfil(['administrador', 'professor']);
      const turma = encontrar(db().turmas.filter((t) => t.escolaId === escolaId), id, 'Turma');
      Object.assign(turma, dados, {
        horarios: dados.horarios.map((h) => ({ ...h, id: novoId(), turmaId: id })),
        atualizadoEm: agora(),
      });
      salvar();
      return turma;
    });
  },

  /** INTEGRAÇÃO BACKEND: PATCH /api/escolas/:escolaId/turmas/:id/ativo { ativo } */
  definirAtivo(escolaId: string, id: string, ativo: boolean): Promise<Turma> {
    return simular(() => {
      exigirPerfil(['administrador', 'professor']);
      const turma = encontrar(db().turmas.filter((t) => t.escolaId === escolaId), id, 'Turma');
      turma.ativo = ativo;
      turma.atualizadoEm = agora();
      salvar();
      return turma;
    });
  },
};
