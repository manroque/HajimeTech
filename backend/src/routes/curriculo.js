import { Router } from 'express';

import { pool, transacao } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import {
  booleano,
  ehUuid,
  exigirId,
  flagQuery,
  naoEncontrado,
  regraViolada,
  requisicaoInvalida,
  rota,
  textoObrigatorio,
  textoOpcional
} from '../lib/http.js';
import { paraCategoria, paraTecnica } from '../lib/mapeadores.js';

/*
 * Currículo por faixa: categorias e técnicas.
 * Montado em /api/escolas/:escolaId/curriculo
 *
 * Regras:
 *  Somente administradores e professores editam.
 *  Técnicas e categorias nunca são apagadas, apenas desativadas.
 *  Marrom e Preta não têm conteúdo definido: criar itens nelas responde 422.
 */
const router = Router({ mergeParams: true });
const editores = exigirPerfil('administrador', 'professor');

async function obterFaixa(db, faixaId) {
  const { rows } = await db.query('SELECT * FROM faixas WHERE id = $1', [faixaId ?? null]);
  if (!rows[0]) throw requisicaoInvalida('Faixa inválida.');
  return rows[0];
}

function exigirConteudoDefinido(faixa) {
  if (!faixa.conteudo_definido) {
    throw regraViolada(`O conteúdo da faixa ${faixa.nome} ainda não foi definido pela academia.`);
  }
}

async function obterCategoriaAtiva(db, escolaId, id) {
  const { rows } = await db.query(
    'SELECT * FROM categorias_curriculo WHERE id = $1 AND escola_id = $2 AND ativo',
    [ehUuid(id) ? id : null, escolaId]
  );
  if (!rows[0]) throw naoEncontrado('Categoria');
  return rows[0];
}

/* Renumera as categorias ativas de uma faixa (1, 2, 3...) mantendo a ordem atual. */
async function renumerarCategorias(client, escolaId, faixaId) {
  await client.query(
    `UPDATE categorias_curriculo c
        SET ordem = n.nova
       FROM (SELECT id, row_number() OVER (ORDER BY ordem, nome) AS nova
               FROM categorias_curriculo
              WHERE escola_id = $1 AND faixa_id = $2 AND ativo) n
      WHERE c.id = n.id AND c.ordem <> n.nova`,
    [escolaId, faixaId]
  );
}

/*
 * GET /api/escolas/:escolaId/curriculo?faixaId=azul&incluirInativas=false
 * Categorias ativas da faixa, cada uma com suas técnicas.
 * Técnicas desativadas só aparecem para quem pode editar e pediu `incluirInativas`.
 */
router.get('/', rota(async (req, res) => {
  const faixa = await obterFaixa(pool, req.query.faixaId);
  const incluirInativas = flagQuery(req.query.incluirInativas) && req.usuario.perfil !== 'aluno';

  const { rows: categorias } = await pool.query(
    `SELECT * FROM categorias_curriculo
      WHERE escola_id = $1 AND faixa_id = $2 AND ativo
      ORDER BY ordem, nome`,
    [req.escolaId, faixa.id]
  );

  const { rows: tecnicas } = await pool.query(
    `SELECT * FROM tecnicas
      WHERE categoria_id = ANY($1) AND ($2 OR ativo)
      ORDER BY ativo DESC, ordem, nome`,
    [categorias.map((c) => c.id), incluirInativas]
  );

  res.json(categorias.map((c) => ({
    ...paraCategoria(c),
    tecnicas: tecnicas.filter((t) => t.categoria_id === c.id).map(paraTecnica)
  })));
}));

/* ------------------------------------------------------------------ Categorias */

/* POST .../curriculo/categorias { faixaId, nome, descricao } — entra no fim da faixa */
router.post('/categorias', editores, rota(async (req, res) => {
  const faixa = await obterFaixa(pool, req.body?.faixaId);
  exigirConteudoDefinido(faixa);
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome da categoria.');

  const { rows } = await pool.query(
    `INSERT INTO categorias_curriculo (escola_id, faixa_id, nome, descricao, ordem)
     VALUES ($1, $2, $3, $4,
       (SELECT count(*) + 1 FROM categorias_curriculo WHERE escola_id = $1 AND faixa_id = $2 AND ativo))
     RETURNING *`,
    [req.escolaId, faixa.id, nome, textoOpcional(req.body?.descricao)]
  );

  res.status(201).json(paraCategoria(rows[0]));
}));

/*
 * PENDENTE (issue de reordenação do currículo):
 *   PATCH .../curriculo/categorias/reordenar { ids }
 *   PATCH .../curriculo/tecnicas/reordenar { categoriaId, ids }
 * Regras na seção 6 do backend/README.md (regra 6).
 */

/* PUT .../curriculo/categorias/:id { nome, descricao } */
router.put('/categorias/:id', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Categoria');
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome da categoria.');

  const { rows } = await pool.query(
    `UPDATE categorias_curriculo SET nome = $1, descricao = $2
      WHERE id = $3 AND escola_id = $4 AND ativo
      RETURNING *`,
    [nome, textoOpcional(req.body?.descricao), id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Categoria');
  res.json(paraCategoria(rows[0]));
}));

/*
 * DELETE .../curriculo/categorias/:id
 * Desativa a categoria e suas técnicas (o histórico dos alunos é mantido)
 * e renumera as categorias restantes da faixa.
 */
router.delete('/categorias/:id', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Categoria');

  await transacao(async (client) => {
    const categoria = await obterCategoriaAtiva(client, req.escolaId, id);
    await client.query('UPDATE categorias_curriculo SET ativo = false WHERE id = $1', [id]);
    await client.query('UPDATE tecnicas SET ativo = false WHERE categoria_id = $1 AND ativo', [id]);
    await renumerarCategorias(client, req.escolaId, categoria.faixa_id);
  });

  res.status(204).end();
}));

/* ------------------------------------------------------------------ Técnicas */

/* POST .../curriculo/tecnicas { categoriaId, nome, descricao } — entra no fim da categoria */
router.post('/tecnicas', editores, rota(async (req, res) => {
  const categoria = await obterCategoriaAtiva(pool, req.escolaId, req.body?.categoriaId);
  exigirConteudoDefinido(await obterFaixa(pool, categoria.faixa_id));
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome da técnica.');

  const { rows } = await pool.query(
    `INSERT INTO tecnicas (escola_id, categoria_id, nome, descricao, ordem)
     VALUES ($1, $2, $3, $4,
       (SELECT count(*) + 1 FROM tecnicas WHERE categoria_id = $2 AND ativo))
     RETURNING *`,
    [req.escolaId, categoria.id, nome, textoOpcional(req.body?.descricao)]
  );

  res.status(201).json(paraTecnica(rows[0]));
}));

/* PUT .../curriculo/tecnicas/:id { nome, descricao } */
router.put('/tecnicas/:id', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Técnica');
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome da técnica.');

  const { rows } = await pool.query(
    `UPDATE tecnicas SET nome = $1, descricao = $2
      WHERE id = $3 AND escola_id = $4
      RETURNING *`,
    [nome, textoOpcional(req.body?.descricao), id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Técnica');
  res.json(paraTecnica(rows[0]));
}));

/*
 * PATCH .../curriculo/tecnicas/:id/ativo { ativo }
 * Desativa ou reativa. Nunca apaga. Ao reativar, a técnica volta para o fim da categoria.
 */
router.patch('/tecnicas/:id/ativo', editores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Técnica');
  const ativo = booleano(req.body?.ativo, 'ativo');

  const { rows } = await pool.query(
    `UPDATE tecnicas t
        SET ativo = $1,
            ordem = CASE WHEN $1 AND NOT t.ativo
                         THEN (SELECT count(*) + 1 FROM tecnicas x WHERE x.categoria_id = t.categoria_id AND x.ativo)
                         ELSE t.ordem END
      WHERE t.id = $2 AND t.escola_id = $3
      RETURNING *`,
    [ativo, id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Técnica');
  res.json(paraTecnica(rows[0]));
}));

export default router;

/* ------------------------------------------------------------------ Lista geral de técnicas */

/*
 * GET /api/escolas/:escolaId/tecnicas
 * Técnicas ativas de categorias ativas, com a faixa e o nome da categoria.
 */
export const tecnicas = Router({ mergeParams: true });

tecnicas.get('/', rota(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, c.faixa_id, c.nome AS categoria_nome
       FROM tecnicas t
       JOIN categorias_curriculo c ON c.id = t.categoria_id AND c.ativo
      WHERE t.escola_id = $1 AND t.ativo
      ORDER BY c.faixa_id, c.ordem, t.ordem`,
    [req.escolaId]
  );

  res.json(rows.map((r) => {
    const { faixa_id: faixaId, categoria_nome: categoriaNome, ...tecnica } = r;
    return { ...paraTecnica(tecnica), faixaId, categoriaNome };
  }));
}));
