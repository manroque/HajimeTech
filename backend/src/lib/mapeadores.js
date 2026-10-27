/*
 * Conversão das linhas do banco (snake_case) para os tipos do front (camelCase),
 * definidos em frontend/src/types/index.ts.
 */

const paraCamel = (chave) => chave.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());

/* Converte todas as colunas da linha, sem tratamento especial. */
export function camel(row) {
  return Object.fromEntries(Object.entries(row).map(([chave, valor]) => [paraCamel(chave), valor]));
}

/* TIME do PostgreSQL vem como 'HH:MM:SS'; o front usa 'HH:MM'. */
const hora = (valor) => (typeof valor === 'string' ? valor.slice(0, 5) : valor);

export const paraEscola = camel;
export const paraCategoria = camel;
export const paraTecnica = camel;
export const paraTecnicaAluno = camel;
export const paraCriterio = camel;
export const paraPremiacao = camel;
export const paraPremiacaoAluno = camel;
export const paraFrequencia = camel;
export const paraGraduacao = camel;

export function paraFaixa(row) {
  return {
    id: row.id,
    nome: row.nome,
    ordem: row.ordem,
    cor: row.cor,
    corTexto: row.cor_texto,
    conteudoDefinido: row.conteudo_definido
  };
}

/* Nunca devolve senha_hash. */
export function paraUsuario(row) {
  return {
    id: row.id,
    escolaId: row.escola_id,
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    alunoId: row.aluno_id,
    ativo: row.ativo
  };
}

/* data_nascimento é opcional no banco; o front trabalha com texto vazio. */
export function paraAluno(row) {
  const aluno = camel(row);
  aluno.dataNascimento = row.data_nascimento ?? '';
  return aluno;
}

export function paraHorario(row) {
  return {
    id: row.id,
    turmaId: row.turma_id,
    diaSemana: row.dia_semana,
    horaInicio: hora(row.hora_inicio),
    horaFim: hora(row.hora_fim)
  };
}

export function paraTurma(row, horarios = []) {
  return { ...camel(row), horarios: horarios.map(paraHorario) };
}

export function paraAvaliacao(row, notas = []) {
  return {
    ...camel(row),
    notas: notas.map((n) => ({ criterioId: n.criterio_id, nota: n.nota }))
  };
}
