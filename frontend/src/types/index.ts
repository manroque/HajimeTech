/**
 * Tipos de domínio do HajimeTech.
 *
 * Espelham as tabelas de /database/schema.sql (nomes em camelCase no front,
 * snake_case no banco). Ao integrar o backend, a API deve devolver objetos
 * com este formato, ou os services devem fazer a conversão.
 */

export type ID = string;
/** Data no formato ISO `AAAA-MM-DD`. */
export type DataISO = string;
/** Data e hora no formato ISO 8601. */
export type DataHoraISO = string;

/* ---------------------------------------------------------------- Faixas */

export type FaixaId =
  | 'branca'
  | 'azul'
  | 'amarela'
  | 'laranja'
  | 'verde'
  | 'roxa'
  | 'marrom'
  | 'preta';

export interface Faixa {
  id: FaixaId;
  nome: string;
  /** Posição na progressão (1 = Branca ... 8 = Preta). */
  ordem: number;
  /** Cor real da faixa, usada em badges e gráficos. */
  cor: string;
  /** Cor de texto com contraste acessível sobre `cor`. */
  corTexto: string;
  /** Falso quando a academia ainda não definiu o conteúdo (Marrom e Preta). */
  conteudoDefinido: boolean;
}

/* ---------------------------------------------------------------- Escolas */

export interface Escola {
  id: ID;
  nome: string;
  cidade: string;
  endereco: string;
  telefone: string;
  responsavel: string;
  ativo: boolean;
  criadoEm: DataHoraISO;
  atualizadoEm: DataHoraISO;
}

/* ---------------------------------------------------------------- Usuários */

export type Perfil = 'administrador' | 'professor' | 'aluno';

export interface Usuario {
  id: ID;
  /** Nulo para administradores globais (acessam todas as escolas). */
  escolaId: ID | null;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Preenchido apenas para o perfil aluno. */
  alunoId: ID | null;
  ativo: boolean;
}

/* ---------------------------------------------------------------- Turmas */

/** 0 = domingo ... 6 = sábado (mesmo padrão de `Date.getDay()` e do banco). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HorarioTurma {
  id: ID;
  turmaId: ID;
  diaSemana: DiaSemana;
  /** `HH:MM` */
  horaInicio: string;
  /** `HH:MM` */
  horaFim: string;
}

export interface Turma {
  id: ID;
  escolaId: ID;
  nome: string;
  idadeMinima: number;
  /** Nulo quando não há limite (ex.: "18 anos ou mais"). */
  idadeMaxima: number | null;
  professorId: ID | null;
  ativo: boolean;
  horarios: HorarioTurma[];
  criadoEm: DataHoraISO;
  atualizadoEm: DataHoraISO;
}

/* ---------------------------------------------------------------- Alunos */

export interface Aluno {
  id: ID;
  escolaId: ID;
  turmaId: ID | null;
  nome: string;
  dataNascimento: DataISO;
  faixaId: FaixaId;
  telefone: string;
  responsavel: string;
  observacoes: string;
  dataIngresso: DataISO;
  /** Soft delete: "Excluir" apenas marca como falso. */
  ativo: boolean;
  criadoEm: DataHoraISO;
  atualizadoEm: DataHoraISO;
}

export type AlunoInput = Omit<Aluno, 'id' | 'escolaId' | 'ativo' | 'criadoEm' | 'atualizadoEm'>;

/* ---------------------------------------------------------------- Frequência */

export interface Frequencia {
  id: ID;
  escolaId: ID;
  alunoId: ID;
  turmaId: ID;
  data: DataISO;
  presente: boolean;
}

/* ---------------------------------------------------------------- Graduações */

export interface Graduacao {
  id: ID;
  escolaId: ID;
  alunoId: ID;
  faixaAnteriorId: FaixaId;
  novaFaixaId: FaixaId;
  data: DataISO;
  observacoes: string;
  criadoEm: DataHoraISO;
}

/* ---------------------------------------------------------------- Currículo */

export interface CategoriaCurriculo {
  id: ID;
  escolaId: ID;
  faixaId: FaixaId;
  nome: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
  criadoEm: DataHoraISO;
  atualizadoEm: DataHoraISO;
}

export interface Tecnica {
  id: ID;
  escolaId: ID;
  categoriaId: ID;
  nome: string;
  descricao: string;
  ordem: number;
  /** Técnicas nunca são apagadas, apenas desativadas. */
  ativo: boolean;
  criadoEm: DataHoraISO;
  atualizadoEm: DataHoraISO;
}

/** Categoria com suas técnicas, já ordenadas. Formato usado pela tela de currículo. */
export interface CategoriaComTecnicas extends CategoriaCurriculo {
  tecnicas: Tecnica[];
}

/* ---------------------------------------------------------------- Acompanhamento técnico */

export type NivelTecnica = 'iniciante' | 'em_desenvolvimento' | 'domina';

export interface TecnicaAluno {
  id: ID;
  escolaId: ID;
  alunoId: ID;
  tecnicaId: ID;
  nivel: NivelTecnica;
  observacoes: string;
  atualizadoEm: DataHoraISO;
}

/* ---------------------------------------------------------------- Avaliações */

export interface CriterioAvaliacao {
  id: ID;
  escolaId: ID;
  nome: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
}

export interface NotaCriterio {
  criterioId: ID;
  /** Nota de 1 a 5. */
  nota: number;
}

export interface Avaliacao {
  id: ID;
  escolaId: ID;
  alunoId: ID;
  avaliadorId: ID | null;
  data: DataISO;
  observacoes: string;
  notas: NotaCriterio[];
  criadoEm: DataHoraISO;
}

/* ---------------------------------------------------------------- Premiações */

export type TipoPremiacao = 'destaque_mes' | 'frequencia' | 'campeonato' | 'evolucao' | 'outro';

export interface Premiacao {
  id: ID;
  escolaId: ID;
  nome: string;
  descricao: string;
  tipo: TipoPremiacao;
  ativo: boolean;
}

export interface PremiacaoAluno {
  id: ID;
  escolaId: ID;
  premiacaoId: ID;
  alunoId: ID;
  data: DataISO;
  descricao: string;
}

/* ---------------------------------------------------------------- Dashboard */

export interface FiltroDashboard {
  /** Tamanho do período em dias (ex.: 30, 90, 180). */
  periodoDias: number;
  /** Nulo = todas as turmas. */
  turmaId: ID | null;
}

export interface IndicadorComparado {
  atual: number;
  anterior: number;
  /** Variação percentual em relação ao período anterior (nulo se não houver base). */
  variacao: number | null;
}

export interface PontoFrequencia {
  /** Início da semana (segunda-feira). */
  semana: DataISO;
  presencas: number;
  faltas: number;
}

export interface Dashboard {
  alunosAtivos: IndicadorComparado;
  presencas: IndicadorComparado;
  taxaPresenca: IndicadorComparado;
  graduacoes: IndicadorComparado;
  porFaixa: { faixaId: FaixaId; nome: string; cor: string; total: number }[];
  porTurma: { turmaId: ID; nome: string; total: number }[];
  evolucaoFrequencia: PontoFrequencia[];
  graduacoesRecentes: (Graduacao & { alunoNome: string })[];
  premiacoesRecentes: (PremiacaoAluno & { alunoNome: string; premiacaoNome: string; tipo: TipoPremiacao })[];
  maisAssiduos: { alunoId: ID; nome: string; faixaId: FaixaId; presencas: number }[];
}
