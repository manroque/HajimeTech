import { Router } from 'express';

import { pool, transacao } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { dataObrigatoria, ehUuid, exigirId, naoEncontrado, requisicaoInvalida, rota } from '../lib/http.js';

/*
 * Chamada por turma. Montado em /api/escolas/:escolaId/turmas/:turmaId/frequencias
 * Somente administradores e professores.
 */
const router = Router({ mergeParams: true });

router.use(exigirPerfil('administrador', 'professor'));

async function obterTurma(escolaId, turmaId) {
  const id = exigirId(turmaId, 'Turma');
  const { rows } = await pool.query('SELECT id FROM turmas WHERE id = $1 AND escola_id = $2', [id, escolaId]);
  if (!rows[0]) throw naoEncontrado('Turma');
  return id;
}

/*
 * GET ...?data=AAAA-MM-DD
 * Alunos ativos da turma, por nome, com a presença da data (null = sem registro).
 */
router.get('/', rota(async (req, res) => {
  const turmaId = await obterTurma(req.escolaId, req.params.turmaId);
  const data = dataObrigatoria(req.query.data);

  const { rows } = await pool.query(
    `SELECT a.id, a.nome, a.faixa_id, f.presente
       FROM alunos a
       LEFT JOIN frequencias f ON f.aluno_id = a.id AND f.data = $3::date
      WHERE a.escola_id = $1 AND a.turma_id = $2 AND a.ativo
      ORDER BY a.nome`,
    [req.escolaId, turmaId, data]
  );

  res.json(rows.map((r) => ({
    alunoId: r.id,
    nome: r.nome,
    faixaId: r.faixa_id,
    presente: r.presente ?? null
  })));
}));

/*
 * PUT ... { data, registros: [{ alunoId, presente }] }
 * Grava a chamada em lote. Um registro por aluno e data (upsert).
 */
router.put('/', rota(async (req, res) => {
  const turmaId = await obterTurma(req.escolaId, req.params.turmaId);
  const data = dataObrigatoria(req.body?.data);
  const registros = req.body?.registros;

  if (!Array.isArray(registros) || !registros.length) {
    throw requisicaoInvalida('Marque a presença de pelo menos um aluno.');
  }

  for (const r of registros) {
    if (!ehUuid(r?.alunoId) || typeof r.presente !== 'boolean') {
      throw requisicaoInvalida('Há registros de presença inválidos.');
    }
  }

  const ids = [...new Set(registros.map((r) => r.alunoId))];
  const { rows } = await pool.query(
    'SELECT id FROM alunos WHERE id = ANY($1) AND escola_id = $2',
    [ids, req.escolaId]
  );
  if (rows.length !== ids.length) throw requisicaoInvalida('Há alunos que não pertencem a esta escola.');

  await transacao(async (client) => {
    for (const r of registros) {
      await client.query(
        `INSERT INTO frequencias (escola_id, aluno_id, turma_id, data, presente)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (aluno_id, data)
         DO UPDATE SET presente = EXCLUDED.presente, turma_id = EXCLUDED.turma_id`,
        [req.escolaId, r.alunoId, turmaId, data, r.presente]
      );
    }
  });

  res.status(204).end();
}));

export default router;
