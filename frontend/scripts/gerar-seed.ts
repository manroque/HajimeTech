/**
 * Gera /database/seed.sql a partir dos MESMOS mocks usados pelo front-end,
 * garantindo que banco e interface tenham exatamente os mesmos dados.
 *
 * Uso (dentro de /frontend):  npm run gerar-seed
 *
 * Datas de movimento (ingresso, frequência, graduações, avaliações,
 * premiações) são gravadas como `CURRENT_DATE - n`, para que o banco sempre
 * tenha dados "recentes", igual aos mocks. Datas de nascimento são fixas.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarBancoInicial } from '../src/mocks';
import { deISO, hojeLocal } from '../src/mocks/utils';

const banco = criarBancoInicial();
const hoje = hojeLocal().getTime();

type Valor = string | number | boolean | null | { sql: string };

const txt = (s: string | null | undefined): Valor => (s == null ? null : s);
/** Data relativa a hoje, ex.: CURRENT_DATE - 12 */
const rel = (iso: string): Valor => {
  const dias = Math.round((hoje - deISO(iso).getTime()) / 86_400_000);
  return { sql: dias === 0 ? 'CURRENT_DATE' : `CURRENT_DATE - ${dias}` };
};

function literal(v: Valor): string {
  if (v === null) return 'NULL';
  if (typeof v === 'object') return v.sql;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function inserir(tabela: string, colunas: string[], linhas: Valor[][], lote = 400): string {
  if (!linhas.length) return `-- ${tabela}: sem registros\n`;
  const partes: string[] = [];
  for (let i = 0; i < linhas.length; i += lote) {
    const valores = linhas
      .slice(i, i + lote)
      .map((l) => `  (${l.map(literal).join(', ')})`)
      .join(',\n');
    partes.push(`INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES\n${valores};`);
  }
  return partes.join('\n') + '\n';
}

const professoresEAdmin = banco.usuarios.filter((u) => u.perfil !== 'aluno');
const usuariosAluno = banco.usuarios.filter((u) => u.perfil === 'aluno');
const colunasUsuario = ['id', 'escola_id', 'nome', 'email', 'perfil', 'aluno_id', 'ativo'];
const linhaUsuario = (u: (typeof banco.usuarios)[number]): Valor[] => [u.id, u.escolaId, u.nome, u.email, u.perfil, u.alunoId, u.ativo];

const sql = `-- =============================================================================
-- HajimeTech: dados de exemplo
-- ARQUIVO GERADO AUTOMATICAMENTE por frontend/scripts/gerar-seed.ts
-- Não edite à mão: altere os mocks em frontend/src/mocks e rode "npm run gerar-seed".
--
-- Coerente com os mocks do front-end (mesmos IDs, nomes e quantidades).
-- As faixas Marrom e Preta NÃO possuem categorias nem técnicas.
-- Nomes, telefones e endereços são fictícios.
-- =============================================================================

BEGIN;

-- Faixas -----------------------------------------------------------------------
${inserir('faixas', ['id', 'nome', 'ordem', 'cor', 'cor_texto', 'conteudo_definido'],
  banco.faixas.map((f) => [f.id, f.nome, f.ordem, f.cor, f.corTexto, f.conteudoDefinido]))}
-- Escolas ----------------------------------------------------------------------
${inserir('escolas', ['id', 'nome', 'cidade', 'endereco', 'telefone', 'responsavel', 'ativo'],
  banco.escolas.map((e) => [e.id, e.nome, e.cidade, e.endereco, e.telefone, e.responsavel, e.ativo]))}
-- Usuários (administrador e professores) ---------------------------------------
${inserir('usuarios', colunasUsuario, professoresEAdmin.map(linhaUsuario))}
-- Turmas e horários ------------------------------------------------------------
${inserir('turmas', ['id', 'escola_id', 'nome', 'idade_minima', 'idade_maxima', 'professor_id', 'ativo'],
  banco.turmas.map((t) => [t.id, t.escolaId, t.nome, t.idadeMinima, t.idadeMaxima, t.professorId, t.ativo]))}
${inserir('horarios_turma', ['id', 'turma_id', 'dia_semana', 'hora_inicio', 'hora_fim'],
  banco.turmas.flatMap((t) => t.horarios.map((h) => [h.id, h.turmaId, h.diaSemana, h.horaInicio, h.horaFim])))}
-- Alunos -----------------------------------------------------------------------
${inserir('alunos', ['id', 'escola_id', 'turma_id', 'nome', 'data_nascimento', 'faixa_id', 'telefone', 'responsavel', 'observacoes', 'data_ingresso', 'ativo'],
  banco.alunos.map((a) => [a.id, a.escolaId, a.turmaId, a.nome, a.dataNascimento, a.faixaId, a.telefone, txt(a.responsavel), a.observacoes, rel(a.dataIngresso), a.ativo]))}
-- Usuários com perfil aluno (dependem de alunos) -------------------------------
${inserir('usuarios', colunasUsuario, usuariosAluno.map(linhaUsuario))}
-- Currículo: categorias e técnicas (Branca a Roxa) -----------------------------
${inserir('categorias_curriculo', ['id', 'escola_id', 'faixa_id', 'nome', 'descricao', 'ordem', 'ativo'],
  banco.categorias.map((c) => [c.id, c.escolaId, c.faixaId, c.nome, c.descricao, c.ordem, c.ativo]))}
${inserir('tecnicas', ['id', 'escola_id', 'categoria_id', 'nome', 'descricao', 'ordem', 'ativo'],
  banco.tecnicas.map((t) => [t.id, t.escolaId, t.categoriaId, t.nome, t.descricao, t.ordem, t.ativo]))}
-- Graduações -------------------------------------------------------------------
${inserir('graduacoes', ['id', 'escola_id', 'aluno_id', 'faixa_anterior_id', 'nova_faixa_id', 'data', 'observacoes'],
  banco.graduacoes.map((g) => [g.id, g.escolaId, g.alunoId, g.faixaAnteriorId, g.novaFaixaId, rel(g.data), g.observacoes]))}
-- Frequência (${banco.frequencias.length} registros) -------------------------------------------
${inserir('frequencias', ['id', 'escola_id', 'aluno_id', 'turma_id', 'data', 'presente'],
  banco.frequencias.map((f) => [f.id, f.escolaId, f.alunoId, f.turmaId, rel(f.data), f.presente]))}
-- Acompanhamento técnico -------------------------------------------------------
${inserir('tecnicas_aluno', ['id', 'escola_id', 'aluno_id', 'tecnica_id', 'nivel', 'observacoes'],
  banco.tecnicasAluno.map((t) => [t.id, t.escolaId, t.alunoId, t.tecnicaId, t.nivel, t.observacoes]))}
-- Avaliações de desempenho -----------------------------------------------------
${inserir('criterios_avaliacao', ['id', 'escola_id', 'nome', 'descricao', 'ordem', 'ativo'],
  banco.criterios.map((c) => [c.id, c.escolaId, c.nome, c.descricao, c.ordem, c.ativo]))}
${inserir('avaliacoes', ['id', 'escola_id', 'aluno_id', 'avaliador_id', 'data', 'observacoes'],
  banco.avaliacoes.map((a) => [a.id, a.escolaId, a.alunoId, a.avaliadorId, rel(a.data), a.observacoes]))}
${inserir('avaliacao_notas', ['avaliacao_id', 'criterio_id', 'nota'],
  banco.avaliacoes.flatMap((a) => a.notas.map((n) => [a.id, n.criterioId, n.nota])))}
-- Premiações -------------------------------------------------------------------
${inserir('premiacoes', ['id', 'escola_id', 'nome', 'descricao', 'tipo', 'ativo'],
  banco.premiacoes.map((p) => [p.id, p.escolaId, p.nome, p.descricao, p.tipo, p.ativo]))}
${inserir('premiacoes_aluno', ['id', 'escola_id', 'premiacao_id', 'aluno_id', 'data', 'descricao'],
  banco.premiacoesAluno.map((p) => [p.id, p.escolaId, p.premiacaoId, p.alunoId, rel(p.data), p.descricao]))}
COMMIT;
`;

const destino = resolve(dirname(fileURLToPath(import.meta.url)), '../../database/seed.sql');
writeFileSync(destino, sql, 'utf8');
console.log(`seed.sql gerado em ${destino}`);
console.log(
  Object.entries(banco)
    .map(([k, v]) => `  ${k}: ${(v as unknown[]).length}`)
    .join('\n'),
);
