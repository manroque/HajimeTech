import { Router } from 'express';

import { pool } from '../db/index.js';
import { alunoDaConsulta } from '../middleware/escola.js';
import { ehUuid, rota } from '../lib/http.js';
import { paraAvaliacao, paraCriterio } from '../lib/mapeadores.js';

/* GET /api/escolas/:escolaId/criterios-avaliacao — critérios ativos, por ordem */
export const criterios = Router({ mergeParams: true });

criterios.get('/', rota(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM criterios_avaliacao WHERE escola_id = $1 AND ativo ORDER BY ordem, nome',
    [req.escolaId]
  );
  res.json(rows.map(paraCriterio));
}));

/* Avaliações de desempenho. Montado em /api/escolas/:escolaId/avaliacoes */
const router = Router({ mergeParams: true });

async function comNotas(db, avaliacoes) {
  if (!avaliacoes.length) return [];

  const { rows: notas } = await db.query(
    `SELECT n.* FROM avaliacao_notas n
       JOIN criterios_avaliacao c ON c.id = n.criterio_id
      WHERE n.avaliacao_id = ANY($1)
      ORDER BY c.ordem`,
    [avaliacoes.map((a) => a.id)]
  );

  return avaliacoes.map((a) => paraAvaliacao(a, notas.filter((n) => n.avaliacao_id === a.id)));
}

/*
 * GET /api/escolas/:escolaId/avaliacoes?alunoId=
 * Data crescente (para o gráfico de evolução). O perfil aluno recebe só as próprias.
 */
router.get('/', rota(async (req, res) => {
  const alunoId = alunoDaConsulta(req);
  if (alunoId && !ehUuid(alunoId)) return res.json([]);

  const { rows } = await pool.query(
    `SELECT * FROM avaliacoes
      WHERE escola_id = $1 AND ($2::uuid IS NULL OR aluno_id = $2)
      ORDER BY data, criado_em`,
    [req.escolaId, alunoId]
  );

  res.json(await comNotas(pool, rows));
}));

/*
 * PENDENTE (issue de registro de avaliação):
 *   POST /api/escolas/:escolaId/avaliacoes { alunoId, data, observacoes, notas: [{ criterioId, nota }] }
 * Uma nota de 1 a 5 para cada critério ativo da escola; avaliador = usuário do token;
 * gravar avaliacoes e avaliacao_notas na mesma transação. Use comNotas() para a resposta.
 */

export default router;
