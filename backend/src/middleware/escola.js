import { pool } from '../db/index.js';
import { ehUuid, naoEncontrado, rota, semPermissao } from '../lib/http.js';

/*
 * Escopo das rotas /api/escolas/:escolaId/...
 * Usar depois de `autenticar`.
 *
 * Professor e aluno só acessam a escola do próprio token (403).
 * O administrador acessa qualquer escola existente (404 se não existir).
 */
export const acessoEscola = rota(async (req, res, next) => {
  const { escolaId } = req.params;
  const { perfil, escolaId: escolaDoToken } = req.usuario;

  if (!ehUuid(escolaId)) throw naoEncontrado('Escola');
  if (perfil !== 'administrador' && escolaId !== escolaDoToken) throw semPermissao();

  const { rows } = await pool.query('SELECT id FROM escolas WHERE id = $1', [escolaId]);
  if (!rows[0]) throw naoEncontrado('Escola');

  req.escolaId = escolaId;
  next();
});

/* O perfil aluno é somente leitura: qualquer escrita é recusada. */
export function alunoSomenteLeitura(req, res, next) {
  if (req.usuario.perfil === 'aluno' && req.method !== 'GET') return next(semPermissao());
  next();
}

/*
 * Para dados de um aluno específico: o perfil aluno só enxerga os próprios.
 * Lança 403 se o aluno do token for outro.
 */
export function garantirProprioAluno(req, alunoId) {
  if (req.usuario.perfil === 'aluno' && alunoId !== req.usuario.alunoId) throw semPermissao();
}

/*
 * Nas listagens com `?alunoId=`, o perfil aluno sempre recebe só os próprios
 * dados, independentemente do que foi pedido.
 */
export function alunoDaConsulta(req) {
  if (req.usuario.perfil === 'aluno') return req.usuario.alunoId;
  const { alunoId } = req.query;
  return typeof alunoId === 'string' && alunoId ? alunoId : null;
}
