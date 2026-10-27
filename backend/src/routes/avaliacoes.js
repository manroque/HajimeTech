import { Router } from 'express';

import { pool, transacao } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { alunoDaConsulta } from '../middleware/escola.js';
import {
  booleano,
  ehUuid,
  exigirId,
  naoEncontrado,
  requisicaoInvalida,
  rota,
  textoObrigatorio,
  textoOpcional
} from '../lib/http.js';
import { paraAvaliacao, paraCriterio } from '../lib/mapeadores.js';

/* GET /api/escolas/:escolaId/criterios-avaliacao — critérios ativos, por ordem */
export const criterios = Router({ mergeParams: true });

const editores = exigirPerfil('administrador', 'professor');

criterios.get('/', rota(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM criterios_avaliacao WHERE escola_id = $1 AND ativo ORDER BY ordem, nome',
    [req.escolaId]
  );
  res.json(rows.map(paraCriterio));
}));

/* POST .../criterios-avaliacao { nome, descricao } — entra no fim da lista */
criterios.post('/', editores, rota(async (req, res) => {
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome do critério.');

  const { rows } = await pool.query(
    `INSERT INTO criterios_avaliacao (escola_id, nome, descricao, ordem)
     VALUES ($1, $2, $3,
       (SELECT count(*) + 1 FROM criterios_avaliacao WHERE escola_id = $1 AND ativo))
     RETURNING *`,
    [req.escolaId, nome, textoOpcional(req.body?.descricao)]
  );

  res.status(201).json(paraCriterio(rows[0]));
}));

/* PUT .../criterios-avaliacao/:id { nome, descricao } */
criterios.put('/:id', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Critério');
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome do critério.');

  const { rows } = await pool.query(
    `UPDATE criterios_avaliacao SET nome = $1, descricao = $2
      WHERE id = $3 AND escola_id = $4
      RETURNING *`,
    [nome, textoOpcional(req.body?.descricao), id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Critério');
  res.json(paraCriterio(rows[0]));
}));

/* PATCH .../criterios-avaliacao/reordenar { ids } — renumera ordem como 1, 2, 3... */
criterios.patch('/reordenar', editores, rota(async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.length) {
    throw requisicaoInvalida('Informe a lista de ids na nova ordem.');
  }

  await transacao(async (client) => {
    const { rows } = await client.query(
      'SELECT id FROM criterios_avaliacao WHERE escola_id = $1 AND ativo ORDER BY ordem, nome',
      [req.escolaId]
    );
    const ativos = rows.map((r) => r.id);

    if (ids.length !== ativos.length || ids.some((id) => !ativos.includes(id))) {
      throw requisicaoInvalida('A lista precisa conter exatamente os critérios ativos da escola.');
    }

    for (let i = 0; i < ids.length; i += 1) {
      await client.query(
        'UPDATE criterios_avaliacao SET ordem = $1 WHERE id = $2 AND escola_id = $3',
        [i + 1, ids[i], req.escolaId]
      );
    }
  });

  res.status(204).end();
}));

/* PATCH .../criterios-avaliacao/:id/ativo { ativo } — desativa ou reativa; ao reativar, volta ao fim */
criterios.patch('/:id/ativo', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Critério');
  const ativo = booleano(req.body?.ativo, 'ativo');

  const { rows } = await pool.query(
    `UPDATE criterios_avaliacao c
        SET ativo = $1,
            ordem = CASE WHEN $1 AND NOT c.ativo
                         THEN (SELECT count(*) + 1 FROM criterios_avaliacao x WHERE x.escola_id = c.escola_id AND x.ativo)
                         ELSE c.ordem END
      WHERE c.id = $2 AND c.escola_id = $3
      RETURNING *`,
    [ativo, id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Critério');
  res.json(paraCriterio(rows[0]));
}));

/* Avaliações de desempenho. Montado em /api/escolas/:escolaId/avaliacoes */
const router = Router({ mergeParams: true });

async function comNotas(db, avaliacoes) {
  if (!avaliacoes.length) return [];

  const { rows: notas } = await db.query(
    `SELECT n.* FROM avaliacao_notas n
       JOIN criterios_avaliacao c ON c.id = n.criterio_id
      WHERE n.avaliacao_id = ANY($1)
      ORDER BY c.ordem`,
    [avaliacoes.map((a) => a.id)]
  );

  return avaliacoes.map((a) => paraAvaliacao(a, notas.filter((n) => n.avaliacao_id === a.id)));
}

/*
 * GET /api/escolas/:escolaId/avaliacoes?alunoId=
 * Data crescente (para o gráfico de evolução). O perfil aluno recebe só as próprias.
 */
router.get('/', rota(async (req, res) => {
  const alunoId = alunoDaConsulta(req);
  if (alunoId && !ehUuid(alunoId)) return res.json([]);

  const { rows } = await pool.query(
    `SELECT * FROM avaliacoes
      WHERE escola_id = $1 AND ($2::uuid IS NULL OR aluno_id = $2)
      ORDER BY data, criado_em`,
    [req.escolaId, alunoId]
  );

  res.json(await comNotas(pool, rows));
}));

/*
 * PENDENTE (issue de registro de avaliação):
 *   POST /api/escolas/:escolaId/avaliacoes { alunoId, data, observacoes, notas: [{ criterioId, nota }] }
 * Uma nota de 1 a 5 para cada critério ativo da escola; avaliador = usuário do token;
 * gravar avaliacoes e avaliacao_notas na mesma transação. Use comNotas() para a resposta.
 */

export default router;
