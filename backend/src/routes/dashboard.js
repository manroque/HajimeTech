import { Router } from 'express';

import { pool } from '../db/index.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Total de alunos ativos
    const totalAlunosResult = await pool.query(
      `
        SELECT count(*)::int AS total
        FROM alunos
        WHERE academia_id = $1
          AND ativo = true
      `,
      [req.academiaId]
    );

    // Presenças nos últimos 30 dias
    const presencasResult = await pool.query(
      `
        SELECT count(*)::int AS total
        FROM frequencias
        WHERE academia_id = $1
          AND data >= current_date - interval '30 days'
          AND presente = true
      `,
      [req.academiaId]
    );

    // Distribuição dos alunos por faixa
    const faixasResult = await pool.query(
      `
        SELECT
          faixa_atual AS faixa,
          count(*)::int AS total
        FROM alunos
        WHERE academia_id = $1
          AND ativo = true
        GROUP BY faixa_atual
        ORDER BY total DESC
      `,
      [req.academiaId]
    );

    // Distribuição dos alunos por turma
    const turmasResult = await pool.query(
      `
        SELECT
          t.nome,
          count(a.id)::int AS total
        FROM turmas t
        LEFT JOIN alunos a
          ON a.turma_id = t.id
          AND a.ativo = true
        WHERE t.academia_id = $1
        GROUP BY t.id
        ORDER BY t.nome
      `,
      [req.academiaId]
    );

    res.json({
      total_alunos: totalAlunosResult.rows[0]?.total || 0,
      presencas_30_dias: presencasResult.rows[0]?.total || 0,
      faixas: faixasResult.rows,
      turmas: turmasResult.rows
    });
  } catch (err) {
    next(err);
  }
});

export default router;