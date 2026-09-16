import { Router } from 'express';

import { pool } from '../db/index.js';
import { canWrite } from '../middleware/tenant.js';

const router = Router();

/*
 * GET /api/alunos
 *
 * Lista somente os alunos ativos da academia atual.
 * Professores e administradores podem visualizar.
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          a.*,
          t.nome AS turma_nome,
          t.horario
        FROM alunos a
        LEFT JOIN turmas t
          ON t.id = a.turma_id
        WHERE
          a.academia_id = $1
          AND a.ativo = true
        ORDER BY a.nome
      `,
      [req.academiaId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);

    res.status(500).json({
      error: 'Erro ao listar alunos'
    });
  }
});

/*
 * POST /api/alunos
 *
 * Cadastra um novo aluno.
 * Somente administradores e professores podem cadastrar.
 */
router.post('/', canWrite, async (req, res) => {
  try {
    const {
      nome,
      data_nascimento,
      faixa_atual = 'Branca',
      telefone,
      observacoes,
      turma_id
    } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({
        error: 'Nome é obrigatório'
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO alunos (
          academia_id,
          nome,
          data_nascimento,
          faixa_atual,
          telefone,
          observacoes,
          turma_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        req.academiaId,
        nome.trim(),
        data_nascimento || null,
        faixa_atual,
        telefone?.trim() || null,
        observacoes?.trim() || null,
        turma_id || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao cadastrar aluno:', err);

    res.status(500).json({
      error: 'Erro ao cadastrar aluno'
    });
  }
});

/*
 * PUT /api/alunos/:id
 *
 * Edita um aluno ativo da academia atual.
 * Somente administradores e professores podem editar.
 */
router.put('/:id', canWrite, async (req, res) => {
  try {
    const {
      nome,
      data_nascimento,
      faixa_atual,
      telefone,
      observacoes,
      turma_id
    } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({
        error: 'Nome é obrigatório'
      });
    }

    const { rows } = await pool.query(
      `
        UPDATE alunos
        SET
          nome = $1,
          data_nascimento = $2,
          faixa_atual = $3,
          telefone = $4,
          observacoes = $5,
          turma_id = $6,
          atualizado_em = now()
        WHERE
          id = $7
          AND academia_id = $8
          AND ativo = true
        RETURNING *
      `,
      [
        nome.trim(),
        data_nascimento || null,
        faixa_atual || 'Branca',
        telefone?.trim() || null,
        observacoes?.trim() || null,
        turma_id || null,
        req.params.id,
        req.academiaId
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Aluno não encontrado'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao editar aluno:', err);

    res.status(500).json({
      error: 'Erro ao editar aluno'
    });
  }
});

/*
 * DELETE /api/alunos/:id
 *
 * Não apaga o aluno fisicamente.
 * Apenas desativa o cadastro.
 *
 * Somente administradores e professores podem realizar a ação.
 */
router.delete('/:id', canWrite, async (req, res) => {
  try {
    const result = await pool.query(
      `
        UPDATE alunos
        SET
          ativo = false,
          atualizado_em = now()
        WHERE
          id = $1
          AND academia_id = $2
          AND ativo = true
      `,
      [
        req.params.id,
        req.academiaId
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Aluno não encontrado'
      });
    }

    res.json({
      ok: true
    });
  } catch (err) {
    console.error('Erro ao desativar aluno:', err);

    res.status(500).json({
      error: 'Erro ao excluir aluno'
    });
  }
});

export default router;