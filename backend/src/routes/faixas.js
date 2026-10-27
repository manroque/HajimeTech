import { Router } from 'express';

import { pool } from '../db/index.js';
import { rota } from '../lib/http.js';
import { paraFaixa } from '../lib/mapeadores.js';

const router = Router();

/*
 * GET /api/faixas
 * Progressão de faixas (tabela global, igual para todas as escolas).
 */
router.get('/', rota(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM faixas ORDER BY ordem');
  res.json(rows.map(paraFaixa));
}));

export default router;
