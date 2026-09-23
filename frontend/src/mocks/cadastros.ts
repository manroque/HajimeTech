/**
 * Cadastros básicos de exemplo: escolas, usuários, turmas e alunos.
 * Todos os nomes, telefones e endereços são fictícios.
 */
import type { Aluno, Escola, FaixaId, Turma, Usuario } from '../types';
import { CRIADO_EM, TABELA, diasAtras, uid } from './utils';

/* ---------------------------------------------------------------- Escolas */

export const ESCOLA_HAJIME = uid(TABELA.escolas, 1);
export const ESCOLA_KIZUNA = uid(TABELA.escolas, 2);

export const ESCOLAS: Escola[] = [
  {
    id: ESCOLA_HAJIME,
    nome: 'Academia Hajime',
    cidade: 'Rio de Janeiro/RJ',
    endereco: 'Rua das Palmeiras, 120, Centro',
    telefone: '(21) 3333-1200',
    responsavel: 'Sensei Ana Paula Ribeiro',
    ativo: true,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
  },
  {
    id: ESCOLA_KIZUNA,
    nome: 'Dojo Kizuna',
    cidade: 'Niterói/RJ',
    endereco: 'Av. Litorânea, 45, Icaraí',
    telefone: '(21) 2610-4545',
    responsavel: 'Sensei Marcos Tanaka',
    ativo: true,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
  },
];

/* ---------------------------------------------------------------- Usuários */

export const USUARIO_ADMIN = uid(TABELA.usuarios, 1);
export const PROF_ANA = uid(TABELA.usuarios, 2);
export const PROF_RAFAEL = uid(TABELA.usuarios, 3);
export const PROF_MARCOS = uid(TABELA.usuarios, 4);

/* ---------------------------------------------------------------- Turmas */

export const TURMA_INFANTIL = uid(TABELA.turmas, 1);
export const TURMA_JUVENIL = uid(TABELA.turmas, 2);
export const TURMA_ADULTO = uid(TABELA.turmas, 3);
export const TURMA_KIDS = uid(TABELA.turmas, 4);
export const TURMA_KIZUNA_ADULTO = uid(TABELA.turmas, 5);

let horarioSeq = 0;
function horario(turmaId: string, diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6, horaInicio: string, horaFim: string) {
  horarioSeq += 1;
  return { id: uid(TABELA.horarios, horarioSeq), turmaId, diaSemana, horaInicio, horaFim };
}

export const TURMAS: Turma[] = [
  {
    id: TURMA_INFANTIL, escolaId: ESCOLA_HAJIME, nome: 'Infantil', idadeMinima: 6, idadeMaxima: 12,
    professorId: PROF_ANA, ativo: true, criadoEm: CRIADO_EM, atualizadoEm: CRIADO_EM,
    horarios: [horario(TURMA_INFANTIL, 2, '18:00', '19:00'), horario(TURMA_INFANTIL, 4, '18:00', '19:00')],
  },
  {
    id: TURMA_JUVENIL, escolaId: ESCOLA_HAJIME, nome: 'Juvenil', idadeMinima: 13, idadeMaxima: 17,
    professorId: PROF_RAFAEL, ativo: true, criadoEm: CRIADO_EM, atualizadoEm: CRIADO_EM,
    horarios: [horario(TURMA_JUVENIL, 2, '19:00', '20:00'), horario(TURMA_JUVENIL, 4, '19:00', '20:00')],
  },
  {
    id: TURMA_ADULTO, escolaId: ESCOLA_HAJIME, nome: 'Adulto', idadeMinima: 18, idadeMaxima: null,
    professorId: PROF_ANA, ativo: true, criadoEm: CRIADO_EM, atualizadoEm: CRIADO_EM,
    horarios: [horario(TURMA_ADULTO, 1, '20:00', '21:30'), horario(TURMA_ADULTO, 3, '20:00', '21:30')],
  },
  {
    id: TURMA_KIDS, escolaId: ESCOLA_KIZUNA, nome: 'Kids', idadeMinima: 5, idadeMaxima: 11,
    professorId: PROF_MARCOS, ativo: true, criadoEm: CRIADO_EM, atualizadoEm: CRIADO_EM,
    horarios: [horario(TURMA_KIDS, 1, '17:30', '18:30'), horario(TURMA_KIDS, 3, '17:30', '18:30')],
  },
  {
    id: TURMA_KIZUNA_ADULTO, escolaId: ESCOLA_KIZUNA, nome: 'Adulto e Juvenil', idadeMinima: 14, idadeMaxima: null,
    professorId: PROF_MARCOS, ativo: true, criadoEm: CRIADO_EM, atualizadoEm: CRIADO_EM,
    horarios: [horario(TURMA_KIZUNA_ADULTO, 3, '19:30', '21:00'), horario(TURMA_KIZUNA_ADULTO, 6, '09:00', '11:00')],
  },
];

/* ---------------------------------------------------------------- Alunos */

/**
 * Linha compacta de aluno: [nome, nascimento, turma, faixa, telefone, responsável, observações, ativo]
 * A data de ingresso é calculada em `geradores.ts` a partir do histórico de graduações.
 */
type LinhaAluno = [string, string, string, FaixaId, string, string, string, boolean?];

const LINHAS_ALUNOS: LinhaAluno[] = [
  // Academia Hajime: Infantil
  ['Lucas Oliveira', '2015-04-12', TURMA_INFANTIL, 'amarela', '(21) 98811-2041', 'Márcia Oliveira', ''],
  ['Sofia Martins', '2016-09-03', TURMA_INFANTIL, 'azul', '(21) 98722-1133', 'Pedro Martins', 'Alergia a amendoim.'],
  ['Gabriel Santos', '2014-01-22', TURMA_INFANTIL, 'laranja', '(21) 99654-7780', 'Juliana Santos', ''],
  ['Helena Costa', '2017-06-15', TURMA_INFANTIL, 'branca', '(21) 97433-5521', 'Renata Costa', 'Começou este ano, ainda tímida.'],
  ['Miguel Ferreira', '2016-11-30', TURMA_INFANTIL, 'azul', '(21) 98100-4432', 'Carlos Ferreira', ''],
  ['Alice Rodrigues', '2015-02-08', TURMA_INFANTIL, 'amarela', '(21) 99210-8876', 'Patrícia Rodrigues', ''],
  ['Davi Almeida', '2017-03-19', TURMA_INFANTIL, 'branca', '(21) 98543-2210', 'Fernanda Almeida', ''],
  ['Laura Pereira', '2014-08-25', TURMA_INFANTIL, 'laranja', '(21) 97654-3398', 'Roberto Pereira', 'Participa de competições.'],
  ['Arthur Lima', '2016-05-02', TURMA_INFANTIL, 'branca', '(21) 98877-6655', 'Camila Lima', '', false],
  // Academia Hajime: Juvenil
  ['Beatriz Carvalho', '2010-07-14', TURMA_JUVENIL, 'verde', '(21) 99876-1122', 'Luciana Carvalho', 'Atleta da equipe de competição.'],
  ['Pedro Henrique Souza', '2011-03-09', TURMA_JUVENIL, 'laranja', '(21) 98234-5567', 'Eduardo Souza', ''],
  ['Manuela Gomes', '2009-12-01', TURMA_JUVENIL, 'roxa', '(21) 97765-4321', 'Sandra Gomes', ''],
  ['Rafael Barbosa', '2012-05-27', TURMA_JUVENIL, 'amarela', '(21) 99345-6789', 'Marcelo Barbosa', ''],
  ['Isabela Ribeiro', '2010-10-18', TURMA_JUVENIL, 'verde', '(21) 98456-7890', 'Adriana Ribeiro', 'Lesão no joelho em recuperação.'],
  ['Enzo Araújo', '2011-08-05', TURMA_JUVENIL, 'azul', '(21) 97567-8901', 'Tatiana Araújo', ''],
  ['Valentina Rocha', '2012-02-11', TURMA_JUVENIL, 'laranja', '(21) 99678-9012', 'Fábio Rocha', ''],
  // Academia Hajime: Adulto
  ['Ricardo Mendes', '1988-04-03', TURMA_ADULTO, 'preta', '(21) 98789-0123', '', 'Auxilia nas aulas infantis.'],
  ['Juliana Teixeira', '1995-09-21', TURMA_ADULTO, 'marrom', '(21) 99890-1234', '', ''],
  ['Thiago Nascimento', '1999-01-16', TURMA_ADULTO, 'roxa', '(21) 97901-2345', '', ''],
  ['Camila Duarte', '2001-06-28', TURMA_ADULTO, 'verde', '(21) 98012-3456', '', ''],
  ['Bruno Cavalcanti', '1992-11-07', TURMA_ADULTO, 'amarela', '(21) 99123-4567', '', 'Voltou a treinar após 5 anos.'],
  ['Fernanda Moreira', '1997-03-13', TURMA_ADULTO, 'azul', '(21) 97234-5678', '', ''],
  ['André Pinto', '1985-08-30', TURMA_ADULTO, 'branca', '(21) 98345-6780', '', ''],
  // Dojo Kizuna: Kids
  ['Yuki Tanaka', '2016-02-20', TURMA_KIDS, 'amarela', '(21) 99456-1001', 'Marcos Tanaka', ''],
  ['Heitor Cardoso', '2017-07-07', TURMA_KIDS, 'branca', '(21) 98567-1002', 'Aline Cardoso', ''],
  ['Lorena Dias', '2015-10-10', TURMA_KIDS, 'laranja', '(21) 97678-1003', 'Vanessa Dias', ''],
  ['Benício Freitas', '2018-01-25', TURMA_KIDS, 'branca', '(21) 99789-1004', 'Diego Freitas', ''],
  ['Cecília Monteiro', '2016-04-04', TURMA_KIDS, 'azul', '(21) 98890-1005', 'Priscila Monteiro', 'Usa óculos esportivos.'],
  ['Samuel Vieira', '2015-12-12', TURMA_KIDS, 'azul', '(21) 97901-1006', 'Leandro Vieira', ''],
  // Dojo Kizuna: Adulto e Juvenil
  ['Mariana Castro', '2008-05-19', TURMA_KIZUNA_ADULTO, 'verde', '(21) 99012-1007', 'Cláudia Castro', ''],
  ['Felipe Azevedo', '1990-09-09', TURMA_KIZUNA_ADULTO, 'marrom', '(21) 98123-1008', '', ''],
  ['Larissa Nunes', '2003-02-14', TURMA_KIZUNA_ADULTO, 'laranja', '(21) 97234-1009', '', ''],
  ['Gustavo Ramos', '1994-06-06', TURMA_KIZUNA_ADULTO, 'roxa', '(21) 99345-1010', '', ''],
  ['Paula Batista', '2000-11-11', TURMA_KIZUNA_ADULTO, 'amarela', '(21) 98456-1011', '', ''],
  ['Otávio Correia', '1987-03-03', TURMA_KIZUNA_ADULTO, 'azul', '(21) 97567-1012', '', '', false],
];

const ESCOLA_DA_TURMA: Record<string, string> = Object.fromEntries(TURMAS.map((t) => [t.id, t.escolaId]));

/** Alunos sem a data de ingresso, que é preenchida em `geradores.ts`. */
export const ALUNOS_BASE: Aluno[] = LINHAS_ALUNOS.map(
  ([nome, nascimento, turmaId, faixaId, telefone, responsavel, observacoes, ativo], i) => ({
    id: uid(TABELA.alunos, i + 1),
    escolaId: ESCOLA_DA_TURMA[turmaId],
    turmaId,
    nome,
    dataNascimento: nascimento,
    faixaId,
    telefone,
    responsavel,
    observacoes,
    dataIngresso: diasAtras(60),
    ativo: ativo ?? true,
    criadoEm: CRIADO_EM,
    atualizadoEm: CRIADO_EM,
  }),
);

export const ALUNO_LUCAS = ALUNOS_BASE[0].id;
export const ALUNO_YUKI = ALUNOS_BASE.find((a) => a.nome === 'Yuki Tanaka')!.id;

export const USUARIOS: Usuario[] = [
  { id: USUARIO_ADMIN, escolaId: null, nome: 'Coordenação HajimeTech', email: 'admin@hajimetech.local', perfil: 'administrador', alunoId: null, ativo: true },
  { id: PROF_ANA, escolaId: ESCOLA_HAJIME, nome: 'Sensei Ana Paula Ribeiro', email: 'ana@hajime.local', perfil: 'professor', alunoId: null, ativo: true },
  { id: PROF_RAFAEL, escolaId: ESCOLA_HAJIME, nome: 'Prof. Rafael Souza', email: 'rafael@hajime.local', perfil: 'professor', alunoId: null, ativo: true },
  { id: PROF_MARCOS, escolaId: ESCOLA_KIZUNA, nome: 'Sensei Marcos Tanaka', email: 'marcos@kizuna.local', perfil: 'professor', alunoId: null, ativo: true },
  { id: uid(TABELA.usuarios, 5), escolaId: ESCOLA_HAJIME, nome: 'Lucas Oliveira', email: 'lucas@aluno.local', perfil: 'aluno', alunoId: ALUNO_LUCAS, ativo: true },
  { id: uid(TABELA.usuarios, 6), escolaId: ESCOLA_KIZUNA, nome: 'Yuki Tanaka', email: 'yuki@aluno.local', perfil: 'aluno', alunoId: ALUNO_YUKI, ativo: true },
];
