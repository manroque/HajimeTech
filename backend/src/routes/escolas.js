import { Router } from 'express';

import { pool } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { acessoEscola, alunoSomenteLeitura } from '../middleware/escola.js';
import { flagQuery, rota } from '../lib/http.js';
import { paraEscola, paraUsuario } from '../lib/mapeadores.js';

import alunos from './alunos.js';
import avaliacoes, { criterios } from './avaliacoes.js';
import curriculo, { tecnicas } from './curriculo.js';
import dashboard from './dashboard.js';
import frequencias from './frequencias.js';
import graduacoes from './graduacoes.js';
import premiacoes, { premiacoesAluno } from './premiacoes.js';
import turmas from './turmas.js';
import usuarios from './usuarios.js';

const router = Router();

const gestores = exigirPerfil('administrador', 'professor');

/*
 * GET /api/escolas?incluirInativas=false
 * Administrador recebe todas; professor e aluno, apenas a própria escola.
 */
router.get('/', rota(async (req, res) => {
  const incluirInativas = flagQuery(req.query.incluirInativas);
  const { perfil, escolaId } = req.usuario;
  const apenasPropria = perfil !== 'administrador';

  const { rows } = await pool.query(
    `SELECT * FROM escolas
      WHERE ($1 OR ativo)
        AND (NOT $2 OR id = $3)
      ORDER BY nome`,
    [incluirInativas, apenasPropria, escolaId]
  );

  res.json(rows.map(paraEscola));
}));

/*
 * GET /api/escolas/resumo
 * Alunos ativos e turmas ativas de cada escola visível ao usuário.
 */
router.get('/resumo', gestores, rota(async (req, res) => {
  const { perfil, escolaId } = req.usuario;

  const { rows } = await pool.query(
    `SELECT e.id,
            (SELECT count(*) FROM alunos a WHERE a.escola_id = e.id AND a.ativo)::int AS alunos,
            (SELECT count(*) FROM turmas t WHERE t.escola_id = e.id AND t.ativo)::int AS turmas
       FROM escolas e
      WHERE NOT $1 OR e.id = $2`,
    [perfil !== 'administrador', escolaId]
  );

  res.json(Object.fromEntries(rows.map((r) => [r.id, { alunos: r.alunos, turmas: r.turmas }])));
}));

/*
 * PENDENTE (issue de cadastro de escolas):
 *   POST /api/escolas, PUT /api/escolas/:id e PATCH /api/escolas/:id/ativo,
 *   somente para o administrador. A tela Escolas já chama essas rotas.
 */

/* ------------------------------------------------------------------ Dados de uma escola */

const daEscola = Router({ mergeParams: true });

daEscola.use(alunoSomenteLeitura);

/* GET /api/escolas/:escolaId/professores */
daEscola.get('/professores', gestores, rota(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM usuarios
      WHERE escola_id = $1 AND perfil = 'professor' AND ativo
      ORDER BY nome`,
    [req.escolaId]
  );

  res.json(rows.map(paraUsuario));
}));

// A chamada fica em /turmas/:turmaId/frequencias; precisa vir antes do router de turmas.
daEscola.use('/turmas/:turmaId/frequencias', frequencias);
daEscola.use('/turmas', turmas);
daEscola.use('/usuarios', usuarios);
daEscola.use('/alunos', alunos);
daEscola.use('/graduacoes', graduacoes);
daEscola.use('/curriculo', curriculo);
daEscola.use('/tecnicas', tecnicas);
daEscola.use('/criterios-avaliacao', criterios);
daEscola.use('/avaliacoes', avaliacoes);
daEscola.use('/premiacoes-aluno', premiacoesAluno);
daEscola.use('/premiacoes', premiacoes);
daEscola.use('/dashboard', dashboard);

router.use('/:escolaId', acessoEscola, daEscola);

export default router;
