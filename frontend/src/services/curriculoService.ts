/**
 * Currículo (categorias e técnicas por faixa) e acompanhamento técnico dos alunos.
 *
 * Regras:
 *  - Somente administradores e professores criam, editam, reordenam ou desativam itens.
 *  - Técnicas nunca são apagadas: "excluir" = desativar (ativo = false).
 *  - Categorias "excluídas" também são desativadas, para preservar o histórico
 *    das técnicas que os alunos já aprenderam.
 *  - Marrom e Preta não têm conteúdo definido: a API recusa criar itens nelas.
 */
import type { CategoriaComTecnicas, CategoriaCurriculo, FaixaId, NivelTecnica, Tecnica, TecnicaAluno } from '../types';
import { ErroApi, agora, db, encontrar, exigirPerfil, novoId, salvar, simular } from './mockDb';

const EDITORES = ['administrador', 'professor'] as const;
type Direcao = 'cima' | 'baixo';

function categoriaDaEscola(escolaId: string, id: string): CategoriaCurriculo {
  return encontrar(db().categorias.filter((c) => c.escolaId === escolaId && c.ativo), id, 'Categoria');
}

function tecnicaDaEscola(escolaId: string, id: string): Tecnica {
  return encontrar(db().tecnicas.filter((t) => t.escolaId === escolaId), id, 'Técnica');
}

/** Troca a posição de um item com o vizinho e renumera a ordem (1, 2, 3...). */
function mover<T extends { id: string; ordem: number }>(irmaos: T[], id: string, direcao: Direcao): void {
  const lista = [...irmaos].sort((a, b) => a.ordem - b.ordem);
  const i = lista.findIndex((x) => x.id === id);
  const j = direcao === 'cima' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  lista.forEach((x, k) => (x.ordem = k + 1));
}

function exigirConteudoDefinido(faixaId: FaixaId): void {
  const faixa = db().faixas.find((f) => f.id === faixaId);
  if (!faixa?.conteudoDefinido) {
    throw new ErroApi(422, `O conteúdo da faixa ${faixa?.nome ?? faixaId} ainda não foi definido pela academia.`);
  }
}

export const curriculoService = {
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/curriculo?faixaId=azul&incluirInativas=false */
  listarPorFaixa(escolaId: string, faixaId: FaixaId, incluirInativas = false): Promise<CategoriaComTecnicas[]> {
    return simular(() => {
      const { categorias, tecnicas } = db();
      return categorias
        .filter((c) => c.escolaId === escolaId && c.faixaId === faixaId && c.ativo)
        .sort((a, b) => a.ordem - b.ordem)
        .map((c) => ({
          ...c,
          tecnicas: tecnicas
            .filter((t) => t.categoriaId === c.id && (incluirInativas || t.ativo))
            .sort((a, b) => a.ordem - b.ordem),
        }));
    });
  },

  /** Todas as técnicas ativas da escola (usado no acompanhamento técnico). GET /api/escolas/:escolaId/tecnicas */
  listarTecnicas(escolaId: string): Promise<(Tecnica & { faixaId: FaixaId; categoriaNome: string })[]> {
    return simular(() => {
      const { categorias, tecnicas } = db();
      return tecnicas
        .filter((t) => t.escolaId === escolaId && t.ativo)
        .flatMap((t) => {
          const c = categorias.find((x) => x.id === t.categoriaId && x.ativo);
          return c ? [{ ...t, faixaId: c.faixaId, categoriaNome: c.nome }] : [];
        });
    });
  },

  /* ----- Categorias ----- */

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/curriculo/categorias */
  criarCategoria(escolaId: string, dados: { faixaId: FaixaId; nome: string; descricao: string }): Promise<CategoriaCurriculo> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      exigirConteudoDefinido(dados.faixaId);
      const irmas = db().categorias.filter((c) => c.escolaId === escolaId && c.faixaId === dados.faixaId && c.ativo);
      const categoria: CategoriaCurriculo = {
        ...dados,
        id: novoId(),
        escolaId,
        ordem: irmas.length + 1,
        ativo: true,
        criadoEm: agora(),
        atualizadoEm: agora(),
      };
      db().categorias.push(categoria);
      salvar();
      return categoria;
    });
  },

  /** INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/curriculo/categorias/:id */
  atualizarCategoria(escolaId: string, id: string, dados: { nome: string; descricao: string }): Promise<CategoriaCurriculo> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const categoria = categoriaDaEscola(escolaId, id);
      Object.assign(categoria, dados, { atualizadoEm: agora() });
      salvar();
      return categoria;
    });
  },

  /** INTEGRAÇÃO BACKEND: DELETE /api/escolas/:escolaId/curriculo/categorias/:id (desativa categoria e técnicas) */
  excluirCategoria(escolaId: string, id: string): Promise<void> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const categoria = categoriaDaEscola(escolaId, id);
      categoria.ativo = false;
      categoria.atualizadoEm = agora();
      db().tecnicas.filter((t) => t.categoriaId === id).forEach((t) => (t.ativo = false));
      const restantes = db().categorias.filter((c) => c.escolaId === escolaId && c.faixaId === categoria.faixaId && c.ativo);
      restantes.sort((a, b) => a.ordem - b.ordem).forEach((c, k) => (c.ordem = k + 1));
      salvar();
    });
  },

  /** INTEGRAÇÃO BACKEND: PATCH /api/escolas/:escolaId/curriculo/categorias/reordenar { ids: [...] } */
  moverCategoria(escolaId: string, id: string, direcao: Direcao): Promise<void> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const categoria = categoriaDaEscola(escolaId, id);
      mover(db().categorias.filter((c) => c.escolaId === escolaId && c.faixaId === categoria.faixaId && c.ativo), id, direcao);
      salvar();
    }, 80);
  },

  /* ----- Técnicas ----- */

  /** INTEGRAÇÃO BACKEND: POST /api/escolas/:escolaId/curriculo/tecnicas */
  criarTecnica(escolaId: string, dados: { categoriaId: string; nome: string; descricao: string }): Promise<Tecnica> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const categoria = categoriaDaEscola(escolaId, dados.categoriaId);
      exigirConteudoDefinido(categoria.faixaId);
      const irmas = db().tecnicas.filter((t) => t.categoriaId === categoria.id);
      const tecnica: Tecnica = {
        ...dados,
        id: novoId(),
        escolaId,
        ordem: irmas.length + 1,
        ativo: true,
        criadoEm: agora(),
        atualizadoEm: agora(),
      };
      db().tecnicas.push(tecnica);
      salvar();
      return tecnica;
    });
  },

  /** INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/curriculo/tecnicas/:id */
  atualizarTecnica(escolaId: string, id: string, dados: { nome: string; descricao: string }): Promise<Tecnica> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const tecnica = tecnicaDaEscola(escolaId, id);
      Object.assign(tecnica, dados, { atualizadoEm: agora() });
      salvar();
      return tecnica;
    });
  },

  /**
   * Desativar/reativar técnica. Nunca apaga.
   * INTEGRAÇÃO BACKEND: PATCH /api/escolas/:escolaId/curriculo/tecnicas/:id/ativo { ativo }
   */
  definirTecnicaAtiva(escolaId: string, id: string, ativo: boolean): Promise<Tecnica> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const tecnica = tecnicaDaEscola(escolaId, id);
      tecnica.ativo = ativo;
      tecnica.atualizadoEm = agora();
      salvar();
      return tecnica;
    });
  },

  /** INTEGRAÇÃO BACKEND: PATCH /api/escolas/:escolaId/curriculo/tecnicas/reordenar { categoriaId, ids: [...] } */
  moverTecnica(escolaId: string, id: string, direcao: Direcao): Promise<void> {
    return simular(() => {
      exigirPerfil([...EDITORES]);
      const tecnica = tecnicaDaEscola(escolaId, id);
      mover(db().tecnicas.filter((t) => t.categoriaId === tecnica.categoriaId && t.ativo), id, direcao);
      salvar();
    }, 80);
  },
};

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
  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/alunos/:alunoId/tecnicas */
  listar(escolaId: string, alunoId: string): Promise<TecnicaAluno[]> {
    return simular(() => db().tecnicasAluno.filter((t) => t.escolaId === escolaId && t.alunoId === alunoId));
  },

  /**
   * Cria ou atualiza o nível de uma técnica para o aluno.
   * INTEGRAÇÃO BACKEND: PUT /api/escolas/:escolaId/alunos/:alunoId/tecnicas/:tecnicaId { nivel, observacoes }
   */
  salvar(escolaId: string, alunoId: string, tecnicaId: string, nivel: NivelTecnica, observacoes: string): Promise<TecnicaAluno> {
    return simular(() => {
      exigirPerfil(['administrador', 'professor']);
      encontrar(db().alunos.filter((a) => a.escolaId === escolaId), alunoId, 'Aluno');
      tecnicaDaEscola(escolaId, tecnicaId);
      const lista = db().tecnicasAluno;
      let registro = lista.find((t) => t.alunoId === alunoId && t.tecnicaId === tecnicaId);
      if (registro) Object.assign(registro, { nivel, observacoes, atualizadoEm: agora() });
      else {
        registro = { id: novoId(), escolaId, alunoId, tecnicaId, nivel, observacoes, atualizadoEm: agora() };
        lista.push(registro);
      }
      salvar();
      return registro;
    }, 100);
  },

  /** INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/alunos/:alunoId/progresso */
  progresso(escolaId: string, alunoId: string): Promise<ProgressoCurriculo> {
    return simular(() => {
      const { alunos, faixas, categorias, tecnicas, tecnicasAluno } = db();
      const aluno = encontrar(alunos.filter((a) => a.escolaId === escolaId), alunoId, 'Aluno');
      const faixa = faixas.find((f) => f.id === aluno.faixaId)!;
      const idsCategorias = new Set(
        categorias.filter((c) => c.escolaId === escolaId && c.faixaId === faixa.id && c.ativo).map((c) => c.id),
      );
      const idsTecnicas = tecnicas.filter((t) => idsCategorias.has(t.categoriaId) && t.ativo).map((t) => t.id);
      const registros = tecnicasAluno.filter((r) => r.alunoId === alunoId && idsTecnicas.includes(r.tecnicaId));
      const contar = (n: NivelTecnica) => registros.filter((r) => r.nivel === n).length;
      const total = idsTecnicas.length;
      return {
        faixaId: faixa.id,
        conteudoDefinido: faixa.conteudoDefinido,
        total,
        domina: contar('domina'),
        emDesenvolvimento: contar('em_desenvolvimento'),
        iniciante: contar('iniciante'),
        percentual: total ? Math.round((contar('domina') / total) * 100) : 0,
      };
    });
  },
};
