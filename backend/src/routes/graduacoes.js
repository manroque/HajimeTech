import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/graduacoes
 *
 * Lista o histórico de graduações da academia.
 * As graduações mais recentes aparecem primeiro.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          g.*,
          a.nome AS aluno_nome
        FROM graduacoes g
        JOIN alunos a
          ON a.id = g.aluno_id
        WHERE g.academia_id = $1
        ORDER BY g.data_graduacao DESC
      `,
      [req.academiaId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar graduações:', err);

    res.status(500).json({
      error: 'Erro ao listar graduações'
    });
  }
});

/*
 * POST /api/graduacoes
 *
 * Registra uma nova graduação e atualiza
 * a faixa atual do aluno.
 */
router.post('/', canWrite, async (req, res) => {
  const {
    aluno_id,
    faixa_anterior,
    nova_faixa,
    data_graduacao,
    observacoes
  } = req.body;

  if (!aluno_id || !nova_faixa || !data_graduacao) {
    return res.status(400).json({
      error: 'Aluno, nova faixa e data são obrigatórios'
    });
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    /*
     * Primeiro registra a graduação no histórico.
     */
    const { rows } = await connection.query(
      `
        INSERT INTO graduacoes (
          academia_id,
          aluno_id,
          faixa_anterior,
          nova_faixa,
          data_graduacao,
          observacoes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        req.academiaId,
        aluno_id,
        faixa_anterior || null,
        nova_faixa,
        data_graduacao,
        observacoes || null
      ]
    );

    const graduacao = rows[0];

    /*
     * Depois atualiza a faixa atual do aluno.
     */
    await connection.query(
      `
        UPDATE alunos
        SET
          faixa_atual = $1,
          atualizado_em = now()
        WHERE id = $2
          AND academia_id = $3
      `,
      [
        nova_faixa,
        aluno_id,
        req.academiaId
      ]
    );

    await connection.query('COMMIT');

    res.status(201).json(graduacao);
  } catch (err) {
    await connection.query('ROLLBACK');

    console.error('Erro ao registrar graduação:', err);

    res.status(500).json({
      error: 'Não foi possível registrar graduação'
    });
  } finally {
    connection.release();
  }
});

export default router;