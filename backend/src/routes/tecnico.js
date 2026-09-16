import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/tecnico/aluno/:id
 *
 * Lista o acompanhamento técnico de um aluno.
 */
router.get('/aluno/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT *
        FROM acompanhamento_tecnico
        WHERE aluno_id = $1
          AND academia_id = $2
        ORDER BY tecnica
      `,
      [
        req.params.id,
        req.academiaId
      ]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar acompanhamento técnico:', err);

    res.status(500).json({
      error: 'Erro ao buscar acompanhamento técnico'
    });
  }
});

/*
 * POST /api/tecnico
 *
 * Registra o nível de uma técnica para um aluno.
 */
router.post('/', canWrite, async (req, res) => {
  try {
    const {
      aluno_id,
      tecnica,
      nivel,
      observacao
    } = req.body;

    if (!aluno_id || !tecnica?.trim() || !nivel?.trim()) {
      return res.status(400).json({
        error: 'Aluno, técnica e nível são obrigatórios'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO acompanhamento_tecnico (
          academia_id,
          aluno_id,
          tecnica,
          nivel,
          observacao
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        req.academiaId,
        aluno_id,
        tecnica.trim(),
        nivel.trim(),
        observacao?.trim() || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao registrar acompanhamento técnico:', err);

    res.status(500).json({
      error: 'Erro ao registrar acompanhamento técnico'
    });
  }
});

export default router;