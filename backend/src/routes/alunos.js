import { Router } from 'express';

import { pool } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { garantirProprioAluno } from '../middleware/escola.js';
import { hojeISO } from '../lib/datas.js';
import {
  ehData,
  ehUuid,
  exigirId,
  flagQuery,
  naoEncontrado,
  requisicaoInvalida,
  rota,
  textoObrigatorio,
  textoOpcional
} from '../lib/http.js';
import { paraAluno, paraFrequencia, paraTecnicaAluno } from '../lib/mapeadores.js';

const router = Router({ mergeParams: true });
const gestores = exigirPerfil('administrador', 'professor');

const NIVEIS = ['iniciante', 'em_desenvolvimento', 'domina'];

/* Remove acentos para "joao" encontrar "João". */
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Aluno da escola (ativo ou não). Lança 404 se não existir. */
export async function obterAluno(db, escolaId, alunoId) {
  const { rows } = await db.query(
    'SELECT * FROM alunos WHERE id = $1 AND escola_id = $2',
    [ehUuid(alunoId) ? alunoId : null, escolaId]
  );
  if (!rows[0]) throw naoEncontrado('Aluno');
  return rows[0];
}

async function validarTurma(escolaId, turmaId) {
  if (!turmaId) return null;
  const { rows } = await pool.query(
    'SELECT id FROM turmas WHERE id = $1 AND escola_id = $2',
    [ehUuid(turmaId) ? turmaId : null, escolaId]
  );
  if (!rows[0]) throw requisicaoInvalida('A turma informada não pertence a esta escola.');
  return turmaId;
}

/* Valida os dados comuns de criação e edição (AlunoInput sem a faixa). */
async function lerAluno(body, escolaId) {
  const dataNascimento = body?.dataNascimento || null;
  if (dataNascimento && !ehData(dataNascimento)) throw requisicaoInvalida('Data de nascimento inválida.');
  if (dataNascimento && dataNascimento > hojeISO()) throw requisicaoInvalida('A data de nascimento não pode ser no futuro.');

  const dataIngresso = body?.dataIngresso || hojeISO();
  if (!ehData(dataIngresso)) throw requisicaoInvalida('Data de ingresso inválida.');

  return {
    nome: textoObrigatorio(body?.nome, 'Informe o nome do aluno.'),
    dataNascimento,
    turmaId: await validarTurma(escolaId, body?.turmaId || null),
    telefone: textoOpcional(body?.telefone),
    responsavel: textoOpcional(body?.responsavel),
    observacoes: textoOpcional(body?.observacoes),
    dataIngresso
  };
}

/*
 * GET /api/escolas/:escolaId/alunos?busca=&turmaId=&faixaId=&incluirInativos=false
 * A busca ignora maiúsculas e acentos.
 */
router.get('/', gestores, rota(async (req, res) => {
  const { busca = '', turmaId = '', faixaId = '' } = req.query;

  const { rows } = await pool.query(
    `SELECT * FROM alunos
      WHERE escola_id = $1
        AND ($2 OR ativo)
        AND ($3::uuid IS NULL OR turma_id = $3)
        AND ($4::text IS NULL OR faixa_id = $4)
      ORDER BY nome`,
    [req.escolaId, flagQuery(req.query.incluirInativos), ehUuid(turmaId) ? turmaId : null, faixaId || null]
  );

  // Turma em formato inválido nunca encontra alunos.
  if (turmaId && !ehUuid(turmaId)) return res.json([]);

  const termo = normalizar(String(busca).trim());
  const filtrados = termo ? rows.filter((a) => normalizar(a.nome).includes(termo)) : rows;

  res.json(filtrados.map(paraAluno));
}));

/* GET /api/escolas/:escolaId/alunos/:id */
router.get('/:id', rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Aluno');
  garantirProprioAluno(req, id);
  res.json(paraAluno(await obterAluno(pool, req.escolaId, id)));
}));

/* POST /api/escolas/:escolaId/alunos */
router.post('/', gestores, rota(async (req, res) => {
  const a = await lerAluno(req.body, req.escolaId);
  const faixaId = req.body?.faixaId || 'branca';

  const faixa = await pool.query('SELECT id FROM faixas WHERE id = $1', [faixaId]);
  if (!faixa.rows[0]) throw requisicaoInvalida('Faixa inválida.');

  const { rows } = await pool.query(
    `INSERT INTO alunos
       (escola_id, turma_id, nome, data_nascimento, faixa_id, telefone, responsavel, observacoes, data_ingresso)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [req.escolaId, a.turmaId, a.nome, a.dataNascimento, faixaId, a.telefone, a.responsavel, a.observacoes, a.dataIngresso]
  );

  res.status(201).json(paraAluno(rows[0]));
}));

/* PUT /api/escolas/:escolaId/alunos/:id — a faixa só muda por graduação, então é ignorada aqui */
router.put('/:id', gestores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Aluno');
  const a = await lerAluno(req.body, req.escolaId);

  const { rows } = await pool.query(
    `UPDATE alunos
        SET turma_id = $1, nome = $2, data_nascimento = $3, telefone = $4,
            responsavel = $5, observacoes = $6, data_ingresso = $7
      WHERE id = $8 AND escola_id = $9
      RETURNING *`,
    [a.turmaId, a.nome, a.dataNascimento, a.telefone, a.responsavel, a.observacoes, a.dataIngresso, id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Aluno');
  res.json(paraAluno(rows[0]));
}));

async function definirAtivo(req, res, ativo) {
  const id = exigirId(req.params.id, 'Aluno');

  const { rows } = await pool.query(
    'UPDATE alunos SET ativo = $1 WHERE id = $2 AND escola_id = $3 RETURNING *',
    [ativo, id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Aluno');
  res.json(paraAluno(rows[0]));
}

/* DELETE /api/escolas/:escolaId/alunos/:id — "Excluir" é desativação lógica, nada é apagado */
router.delete('/:id', gestores, rota((req, res) => definirAtivo(req, res, false)));

/* PATCH /api/escolas/:escolaId/alunos/:id/reativar */
router.patch('/:id/reativar', gestores, rota((req, res) => definirAtivo(req, res, true)));

/* GET /api/escolas/:escolaId/alunos/:alunoId/frequencias */
router.get('/:alunoId/frequencias', rota(async (req, res) => {
  const alunoId = exigirId(req.params.alunoId, 'Aluno');
  garantirProprioAluno(req, alunoId);
  await obterAluno(pool, req.escolaId, alunoId);

  const { rows } = await pool.query(
    'SELECT * FROM frequencias WHERE aluno_id = $1 AND escola_id = $2 ORDER BY data',
    [alunoId, req.escolaId]
  );

  res.json(rows.map(paraFrequencia));
}));

/* GET /api/escolas/:escolaId/alunos/:alunoId/tecnicas */
router.get('/:alunoId/tecnicas', rota(async (req, res) => {
  const alunoId = exigirId(req.params.alunoId, 'Aluno');
  garantirProprioAluno(req, alunoId);
  await obterAluno(pool, req.escolaId, alunoId);

  const { rows } = await pool.query(
    'SELECT * FROM tecnicas_aluno WHERE aluno_id = $1 AND escola_id = $2',
    [alunoId, req.escolaId]
  );

  res.json(rows.map(paraTecnicaAluno));
}));

/* PUT /api/escolas/:escolaId/alunos/:alunoId/tecnicas/:tecnicaId { nivel, observacoes } */
router.put('/:alunoId/tecnicas/:tecnicaId', gestores, rota(async (req, res) => {
  const alunoId = exigirId(req.params.alunoId, 'Aluno');
  const tecnicaId = exigirId(req.params.tecnicaId, 'Técnica');
  const nivel = req.body?.nivel;

  if (!NIVEIS.includes(nivel)) throw requisicaoInvalida('Nível inválido. Use iniciante, em_desenvolvimento ou domina.');

  await obterAluno(pool, req.escolaId, alunoId);
  const tecnica = await pool.query('SELECT id FROM tecnicas WHERE id = $1 AND escola_id = $2', [tecnicaId, req.escolaId]);
  if (!tecnica.rows[0]) throw naoEncontrado('Técnica');

  const { rows } = await pool.query(
    `INSERT INTO tecnicas_aluno (escola_id, aluno_id, tecnica_id, nivel, observacoes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (aluno_id, tecnica_id)
     DO UPDATE SET nivel = EXCLUDED.nivel, observacoes = EXCLUDED.observacoes
     RETURNING *`,
    [req.escolaId, alunoId, tecnicaId, nivel, textoOpcional(req.body?.observacoes)]
  );

  res.json(paraTecnicaAluno(rows[0]));
}));

/*
 * GET /api/escolas/:escolaId/alunos/:alunoId/progresso
 * Considera só técnicas ativas de categorias ativas da faixa atual do aluno.
 */
router.get('/:alunoId/progresso', rota(async (req, res) => {
  const alunoId = exigirId(req.params.alunoId, 'Aluno');
  garantirProprioAluno(req, alunoId);
  const aluno = await obterAluno(pool, req.escolaId, alunoId);

  const { rows } = await pool.query(
    `SELECT f.id AS faixa_id,
            f.conteudo_definido,
            count(t.id)::int AS total,
            count(*) FILTER (WHERE ta.nivel = 'domina')::int AS domina,
            count(*) FILTER (WHERE ta.nivel = 'em_desenvolvimento')::int AS em_desenvolvimento,
            count(*) FILTER (WHERE ta.nivel = 'iniciante')::int AS iniciante
       FROM faixas f
       LEFT JOIN categorias_curriculo c
              ON c.faixa_id = f.id AND c.escola_id = $2 AND c.ativo
       LEFT JOIN tecnicas t
              ON t.categoria_id = c.id AND t.ativo
       LEFT JOIN tecnicas_aluno ta
              ON ta.tecnica_id = t.id AND ta.aluno_id = $3
      WHERE f.id = $1
      GROUP BY f.id, f.conteudo_definido`,
    [aluno.faixa_id, req.escolaId, alunoId]
  );

  const p = rows[0];
  res.json({
    faixaId: p.faixa_id,
    conteudoDefinido: p.conteudo_definido,
    total: p.total,
    domina: p.domina,
    emDesenvolvimento: p.em_desenvolvimento,
    iniciante: p.iniciante,
    percentual: p.total ? Math.round((p.domina / p.total) * 100) : 0
  });
}));

export default router;
