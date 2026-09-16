import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/turmas
 *
 * Lista todas as turmas da academia atual.
 * Professores e administradores podem visualizar.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT *
        FROM turmas
        WHERE academia_id = $1
        ORDER BY nome
      `,
      [req.academiaId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar turmas:', err);

    res.status(500).json({
      error: 'Erro ao listar turmas'
    });
  }
});

/*
 * POST /api/turmas
 *
 * Cadastra uma nova turma.
 * Somente administradores e professores podem cadastrar.
 */
router.post('/', canWrite, async (req, res) => {
  try {
    const {
      nome,
      horario,
      faixa_etaria
    } = req.body;

    if (!nome?.trim() || !horario?.trim()) {
      return res.status(400).json({
        error: 'Nome e horário são obrigatórios'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO turmas (
          academia_id,
          nome,
          horario,
          faixa_etaria
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        req.academiaId,
        nome.trim(),
        horario.trim(),
        faixa_etaria?.trim() || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao cadastrar turma:', err);

    res.status(500).json({
      error: 'Erro ao cadastrar turma'
    });
  }
});

export default router;