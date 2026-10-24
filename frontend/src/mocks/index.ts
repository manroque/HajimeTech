/**
 * Dados de demonstração do HajimeTech.
 *
 * `criarBancoInicial()` monta escolas, alunos, currículo, frequência etc. com
 * IDs fixos. O script `npm run gerar-seed` transforma esse conteúdo em
 * /database/seed.sql, que é carregado no banco. As telas não usam estes dados
 * diretamente: tudo chega pela API.
 */
import type {
  Aluno,
  Avaliacao,
  CategoriaCurriculo,
  CriterioAvaliacao,
  Escola,
  Faixa,
  Frequencia,
  Graduacao,
  Premiacao,
  PremiacaoAluno,
  Tecnica,
  TecnicaAluno,
  Turma,
  Usuario,
} from '../types';
import { ALUNOS_BASE, ESCOLAS, TURMAS, USUARIOS } from './cadastros';
import { gerarCurriculo } from './curriculo';
import { FAIXAS } from './faixas';
import {
  gerarAvaliacoes,
  gerarCriterios,
  gerarFrequencias,
  gerarGraduacoes,
  gerarPremiacoes,
  gerarPremiacoesAluno,
  gerarTecnicasAluno,
} from './geradores';

export interface BancoMock {
  faixas: Faixa[];
  escolas: Escola[];
  usuarios: Usuario[];
  turmas: Turma[];
  alunos: Aluno[];
  frequencias: Frequencia[];
  graduacoes: Graduacao[];
  categorias: CategoriaCurriculo[];
  tecnicas: Tecnica[];
  tecnicasAluno: TecnicaAluno[];
  criterios: CriterioAvaliacao[];
  avaliacoes: Avaliacao[];
  premiacoes: Premiacao[];
  premiacoesAluno: PremiacaoAluno[];
}

export function criarBancoInicial(): BancoMock {
  const { alunos, graduacoes } = gerarGraduacoes(ALUNOS_BASE);
  const { categorias, tecnicas } = gerarCurriculo();
  const frequencias = gerarFrequencias(alunos, TURMAS);
  const criterios = gerarCriterios();
  const premiacoes = gerarPremiacoes();

  return {
    faixas: FAIXAS,
    escolas: structuredClone(ESCOLAS),
    usuarios: structuredClone(USUARIOS),
    turmas: structuredClone(TURMAS),
    alunos,
    frequencias,
    graduacoes,
    categorias,
    tecnicas,
    tecnicasAluno: gerarTecnicasAluno(alunos, categorias, tecnicas),
    criterios,
    avaliacoes: gerarAvaliacoes(alunos, TURMAS, criterios),
    premiacoes,
    premiacoesAluno: gerarPremiacoesAluno(alunos, premiacoes, frequencias),
  };
}

export { FAIXAS };
