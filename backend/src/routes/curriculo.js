import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/curriculo
 *
 * Lista o currículo de uma determinada faixa.
 *
 * Exemplo:
 * /api/curriculo?faixa=Azul
 */
router.get('/', async (req, res, next) => {
  try {
    const faixa = req.query.faixa || 'Azul';

    const { rows: categorias } = await pool.query(
      `
        SELECT *
        FROM curriculo_categorias
        WHERE academia_id = $1
          AND faixa = $2
        ORDER BY ordem, nome
      `,
      [
        req.academiaId,
        faixa
      ]
    );

    /*
     * Busca as técnicas de cada categoria.
     */
    for (const categoria of categorias) {
      const { rows: itens } = await pool.query(
        `
          SELECT *
          FROM curriculo_itens
          WHERE categoria_id = $1
            AND ativo = true
          ORDER BY ordem, nome
        `,
        [categoria.id]
      );

      categoria.itens = itens;
    }

    res.json(categorias);
  } catch (err) {
    next(err);
  }
});

/*
 * POST /api/curriculo/categorias
 *
 * Cria uma nova categoria no currículo.
 *
 * Apenas administradores e professores podem alterar
 * o currículo.
 */
router.post('/categorias', canWrite, async (req, res, next) => {
  try {
    const {
      faixa,
      kyu_dan,
      nome,
      descricao
    } = req.body;

    if (!faixa?.trim() || !nome?.trim()) {
      return res.status(400).json({
        error: 'Faixa e nome são obrigatórios'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO curriculo_categorias (
          academia_id,
          faixa,
          kyu_dan,
          nome,
          descricao,
          ordem
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          COALESCE(
            (
              SELECT MAX(ordem) + 1
              FROM curriculo_categorias
              WHERE academia_id = $1
                AND faixa = $2
            ),
            0
          )
        )
        RETURNING *
      `,
      [
        req.academiaId,
        faixa.trim(),
        kyu_dan?.trim() || null,
        nome.trim(),
        descricao?.trim() || null
      ]
    );

    res.status(201).json({
      ...rows[0],
      itens: []
    });
  } catch (err) {
    next(err);
  }
});

/*
 * PUT /api/curriculo/categorias/:id
 *
 * Edita uma categoria existente.
 */
router.put('/categorias/:id', canWrite, async (req, res, next) => {
  try {
    const {
      nome,
      descricao,
      ordem
    } = req.body;

    const { rows } = await pool.query(
      `
        UPDATE curriculo_categorias
        SET
          nome = COALESCE($1, nome),
          descricao = COALESCE($2, descricao),
          ordem = COALESCE($3, ordem),
          atualizado_em = now()
        WHERE id = $4
          AND academia_id = $5
        RETURNING *
      `,
      [
        nome?.trim() || null,
        descricao?.trim() || null,
        ordem ?? null,
        req.params.id,
        req.academiaId
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Categoria não encontrada'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/*
 * DELETE /api/curriculo/categorias/:id
 *
 * Exclui uma categoria.
 *
 * Os itens relacionados também são excluídos pelo
 * ON DELETE CASCADE definido no banco de dados.
 */
router.delete(
  '/categorias/:id',
  canWrite,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `
          DELETE FROM curriculo_categorias
          WHERE id = $1
            AND academia_id = $2
        `,
        [
          req.params.id,
          req.academiaId
        ]
      );

      res.json({
        ok: result.rowCount === 1
      });
    } catch (err) {
      next(err);
    }
  }
);

/*
 * POST /api/curriculo/itens
 *
 * Adiciona uma técnica a uma categoria.
 */
router.post('/itens', canWrite, async (req, res, next) => {
  try {
    const {
      categoria_id,
      nome
    } = req.body;

    if (!categoria_id || !nome?.trim()) {
      return res.status(400).json({
        error: 'Categoria e nome são obrigatórios'
      });
    }

    /*
     * Confirma que a categoria pertence à academia atual.
     */
    const categoria = await pool.query(
      `
        SELECT id
        FROM curriculo_categorias
        WHERE id = $1
          AND academia_id = $2
      `,
      [
        categoria_id,
        req.academiaId
      ]
    );

    if (!categoria.rows[0]) {
      return res.status(404).json({
        error: 'Categoria não encontrada'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO curriculo_itens (
          categoria_id,
          nome,
          ordem
        )
        SELECT
          $1,
          $2,
          COALESCE(MAX(ordem) + 1, 0)
        FROM curriculo_itens
        WHERE categoria_id = $1
          AND ativo = true
        RETURNING *
      `,
      [
        categoria_id,
        nome.trim()
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/*
 * PUT /api/curriculo/itens/:id
 *
 * Edita uma técnica existente.
 */
router.put('/itens/:id', canWrite, async (req, res, next) => {
  try {
    const {
      nome,
      ordem
    } = req.body;

    const { rows } = await pool.query(
      `
        UPDATE curriculo_itens AS i
        SET
          nome = COALESCE($1, i.nome),
          ordem = COALESCE($2, i.ordem),
          atualizado_em = now()
        FROM curriculo_categorias AS c
        WHERE i.id = $3
          AND i.categoria_id = c.id
          AND c.academia_id = $4
        RETURNING i.*
      `,
      [
        nome?.trim() || null,
        ordem ?? null,
        req.params.id,
        req.academiaId
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Item não encontrado'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/*
 * PATCH /api/curriculo/itens/reordenar
 *
 * Atualiza a ordem das técnicas dentro do currículo.
 */
router.patch(
  '/itens/reordenar',
  canWrite,
  async (req, res) => {
    const { itens = [] } = req.body;

    const connection = await pool.connect();

    try {
      await connection.query('BEGIN');

      for (const item of itens) {
        await connection.query(
          `
            UPDATE curriculo_itens AS i
            SET ordem = $1
            FROM curriculo_categorias AS c
            WHERE i.id = $2
              AND i.categoria_id = c.id
              AND c.academia_id = $3
          `,
          [
            item.ordem,
            item.id,
            req.academiaId
          ]
        );
      }

      await connection.query('COMMIT');

      res.json({
        ok: true
      });
    } catch (err) {
      await connection.query('ROLLBACK');

      console.error(
        'Erro ao reordenar currículo:',
        err
      );

      res.status(500).json({
        error: 'Falha ao reordenar'
      });
    } finally {
      connection.release();
    }
  }
);

/*
 * DELETE /api/curriculo/itens/:id
 *
 * Desativa uma técnica sem apagar o histórico
 * fisicamente do banco.
 */
router.delete(
  '/itens/:id',
  canWrite,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `
          UPDATE curriculo_itens AS i
          SET
            ativo = false,
            atualizado_em = now()
          FROM curriculo_categorias AS c
          WHERE i.id = $1
            AND i.categoria_id = c.id
            AND c.academia_id = $2
        `,
        [
          req.params.id,
          req.academiaId
        ]
      );

      res.json({
        ok: result.rowCount === 1
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;