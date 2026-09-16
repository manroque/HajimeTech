import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/frequencias
 *
 * Lista as frequências de uma determinada data.
 * Se nenhuma data for informada, utiliza a data atual.
 */
router.get('/', async (req, res) => {
  try {
    const date =
      req.query.data || new Date().toISOString().slice(0, 10);

    const { rows } = await pool.query(
      `
        SELECT
          f.*,
          a.nome AS aluno_nome
        FROM frequencias f
        JOIN alunos a
          ON a.id = f.aluno_id
        WHERE f.academia_id = $1
          AND f.data = $2
        ORDER BY a.nome
      `,
      [req.academiaId, date]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar frequências:', err);

    res.status(500).json({
      error: 'Erro ao listar frequências'
    });
  }
});

/*
 * POST /api/frequencias
 *
 * Registra ou atualiza a presença de um aluno.
 *
 * Se já existir uma frequência para o mesmo aluno
 * na mesma data, o registro é atualizado.
 */
router.post('/', canWrite, async (req, res) => {
  try {
    const {
      aluno_id,
      turma_id,
      data,
      presente = true
    } = req.body;

    if (!aluno_id || !data) {
      return res.status(400).json({
        error: 'Aluno e data são obrigatórios'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO frequencias (
          academia_id,
          aluno_id,
          turma_id,
          data,
          presente
        )
        VALUES ($1, $2, $3, $4, $5)

        ON CONFLICT (aluno_id, data)
        DO UPDATE SET
          presente = EXCLUDED.presente,
          turma_id = EXCLUDED.turma_id

        RETURNING *
      `,
      [
        req.academiaId,
        aluno_id,
        turma_id || null,
        data,
        presente
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao registrar frequência:', err);

    res.status(500).json({
      error: 'Erro ao registrar frequência'
    });
  }
});

export default router;