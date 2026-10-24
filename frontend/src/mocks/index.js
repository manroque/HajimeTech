import { ALUNOS_BASE, ESCOLAS, TURMAS, USUARIOS } from './cadastros.js';
import { gerarCurriculo } from './curriculo.js';
import { FAIXAS } from './faixas.js';
import {
  gerarAvaliacoes,
  gerarCriterios,
  gerarFrequencias,
  gerarGraduacoes,
  gerarPremiacoes,
  gerarPremiacoesAluno,
  gerarTecnicasAluno,
} from './geradores.js';

export function criarBancoInicial() {
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
