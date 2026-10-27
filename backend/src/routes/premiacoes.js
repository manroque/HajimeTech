import { Router } from 'express';

import { pool } from '../db/index.js';
import { alunoDaConsulta } from '../middleware/escola.js';
import { ehUuid, flagQuery, rota } from '../lib/http.js';
import { paraPremiacao, paraPremiacaoAluno } from '../lib/mapeadores.js';

/* ------------------------------------------------------------------ Tipos de premiação */

/* Montado em /api/escolas/:escolaId/premiacoes */
const router = Router({ mergeParams: true });

/* GET ...?incluirInativas=false */
router.get('/', rota(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM premiacoes
      WHERE escola_id = $1 AND ($2 OR ativo)
      ORDER BY criado_em, nome`,
    [req.escolaId, flagQuery(req.query.incluirInativas)]
  );
  res.json(rows.map(paraPremiacao));
}));

/*
 * PENDENTE (issue de premiações):
 *   POST  .../premiacoes            { nome, descricao, tipo }
 *   PUT   .../premiacoes/:id        { nome, descricao, tipo }
 *   PATCH .../premiacoes/:id/ativo  { ativo }
 * `tipo` deve ser um de: destaque_mes, frequencia, campeonato, evolucao, outro.
 */

export default router;

/* ------------------------------------------------------------------ Premiações concedidas */

/* Montado em /api/escolas/:escolaId/premiacoes-aluno */
export const premiacoesAluno = Router({ mergeParams: true });

/* GET ...?alunoId= — mais recentes primeiro. O perfil aluno recebe só as próprias. */
premiacoesAluno.get('/', rota(async (req, res) => {
  const alunoId = alunoDaConsulta(req);
  if (alunoId && !ehUuid(alunoId)) return res.json([]);

  const { rows } = await pool.query(
    `SELECT * FROM premiacoes_aluno
      WHERE escola_id = $1 AND ($2::uuid IS NULL OR aluno_id = $2)
      ORDER BY data DESC, criado_em DESC`,
    [req.escolaId, alunoId]
  );

  res.json(rows.map(paraPremiacaoAluno));
}));

/*
 * PENDENTE (issue de premiações):
 *   POST   .../premiacoes-aluno      { premiacaoId, alunoId, data, descricao }
 *   DELETE .../premiacoes-aluno/:id  (remove uma concessão lançada por engano; único DELETE físico)
 * Premiação e aluno precisam ser ativos e da mesma escola; data não pode ser no futuro.
 */
