import { Router } from 'express';

import { pool, transacao } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { alunoDaConsulta } from '../middleware/escola.js';
import { hojeISO } from '../lib/datas.js';
import { dataObrigatoria, ehUuid, naoEncontrado, requisicaoInvalida, rota, textoOpcional } from '../lib/http.js';
import { paraGraduacao } from '../lib/mapeadores.js';

const router = Router({ mergeParams: true });

/*
 * GET /api/escolas/:escolaId/graduacoes?alunoId=
 * Mais recentes primeiro. O perfil aluno recebe só as próprias.
 */
router.get('/', rota(async (req, res) => {
  const alunoId = alunoDaConsulta(req);

  if (alunoId && !ehUuid(alunoId)) return res.json([]);

  const { rows } = await pool.query(
    `SELECT * FROM graduacoes
      WHERE escola_id = $1 AND ($2::uuid IS NULL OR aluno_id = $2)
      ORDER BY data DESC, criado_em DESC`,
    [req.escolaId, alunoId]
  );

  res.json(rows.map(paraGraduacao));
}));

/*
 * POST /api/escolas/:escolaId/graduacoes { alunoId, novaFaixaId, data, observacoes }
 * Guarda a faixa anterior (calculada aqui) e atualiza a faixa atual do aluno.
 * A nova faixa precisa ser superior à atual na progressão.
 */
router.post('/', exigirPerfil('administrador', 'professor'), rota(async (req, res) => {
  const { alunoId, novaFaixaId } = req.body ?? {};
  const data = dataObrigatoria(req.body?.data, 'Informe a data da graduação.');

  if (!ehUuid(alunoId)) throw requisicaoInvalida('Selecione o aluno.');
  if (data > hojeISO()) throw requisicaoInvalida('A data da graduação não pode ser no futuro.');

  const graduacao = await transacao(async (client) => {
    const { rows: alunos } = await client.query(
      `SELECT a.id, a.faixa_id, f.ordem
         FROM alunos a JOIN faixas f ON f.id = a.faixa_id
        WHERE a.id = $1 AND a.escola_id = $2 AND a.ativo
        FOR UPDATE OF a`,
      [alunoId, req.escolaId]
    );
    const aluno = alunos[0];
    if (!aluno) throw naoEncontrado('Aluno');

    const { rows: faixas } = await client.query('SELECT id, ordem FROM faixas WHERE id = $1', [novaFaixaId ?? null]);
    if (!faixas[0]) throw requisicaoInvalida('Selecione a nova faixa.');
    if (faixas[0].ordem <= aluno.ordem) {
      throw requisicaoInvalida('A nova faixa deve ser superior à faixa atual do aluno.');
    }

    const { rows } = await client.query(
      `INSERT INTO graduacoes (escola_id, aluno_id, faixa_anterior_id, nova_faixa_id, data, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.escolaId, aluno.id, aluno.faixa_id, novaFaixaId, data, textoOpcional(req.body?.observacoes)]
    );

    await client.query('UPDATE alunos SET faixa_id = $1 WHERE id = $2', [novaFaixaId, aluno.id]);
    return rows[0];
  });

  res.status(201).json(paraGraduacao(graduacao));
}));

export default router;
