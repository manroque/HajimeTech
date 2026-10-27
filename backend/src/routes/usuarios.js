import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { pool } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import {
  booleano,
  ehUuid,
  exigirId,
  flagQuery,
  naoEncontrado,
  requisicaoInvalida,
  rota,
  semPermissao,
  textoObrigatorio
} from '../lib/http.js';
import { paraUsuario } from '../lib/mapeadores.js';

/*
 * Usuários (professores e acessos de alunos) de uma escola.
 * Montado em /api/escolas/:escolaId/usuarios
 *
 * Regras:
 *  Só administradores e professores enxergam.
 *  Administrador cria professores em qualquer escola; professor, só acessos
 *  de alunos da própria escola.
 *  Um acesso de aluno aponta para um aluno ativo da mesma escola.
 *  A senha é guardada em hash (bcryptjs) e nunca devolvida (paraUsuario).
 */
const router = Router({ mergeParams: true });
const gestores = exigirPerfil('administrador', 'professor');

/* Aluno ativo da mesma escola (usado ao criar um acesso de aluno). */
async function validarAluno(escolaId, alunoId) {
  const { rows } = await pool.query(
    'SELECT id FROM alunos WHERE id = $1 AND escola_id = $2 AND ativo',
    [ehUuid(alunoId) ? alunoId : null, escolaId]
  );
  if (!rows[0]) throw requisicaoInvalida('O aluno informado não pertence a esta escola ou está inativo.');
  return alunoId;
}

/* GET /api/escolas/:escolaId/usuarios?incluirInativas=false */
router.get('/', gestores, rota(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM usuarios
      WHERE escola_id = $1 AND perfil IN ('professor', 'aluno') AND ($2 OR ativo)
      ORDER BY perfil, nome`,
    [req.escolaId, flagQuery(req.query.incluirInativas)]
  );

  res.json(rows.map(paraUsuario));
}));

/* POST /api/escolas/:escolaId/usuarios { nome, email, perfil, alunoId, senha } */
router.post('/', gestores, rota(async (req, res) => {
  const perfil = req.body?.perfil;
  const nome = textoObrigatorio(req.body?.nome, 'Informe o nome.');
  const email = textoObrigatorio(req.body?.email, 'Informe o e-mail.');
  const senha = textoObrigatorio(req.body?.senha, 'Informe a senha.');

  if (perfil !== 'professor' && perfil !== 'aluno') {
    throw requisicaoInvalida('Informe um perfil válido: professor ou aluno.');
  }

  // Professor só pode ser criado pelo administrador.
  if (perfil === 'professor' && req.usuario.perfil !== 'administrador') {
    throw semPermissao();
  }

  const alunoId = perfil === 'aluno' ? await validarAluno(req.escolaId, req.body?.alunoId) : null;
  const senhaHash = await bcrypt.hash(senha, 10);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (escola_id, nome, email, senha_hash, perfil, aluno_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.escolaId, nome, email, senhaHash, perfil, alunoId]
  );

  res.status(201).json(paraUsuario(rows[0]));
}));

/* PATCH /api/escolas/:escolaId/usuarios/:id/ativo { ativo } — desativa ou reativa o acesso */
router.patch('/:id/ativo', gestores, rota(async (req, res) => {
  const id = exigirId(req.params.id, 'Usuário');
  const ativo = booleano(req.body?.ativo, 'ativo');

  const { rows } = await pool.query(
    `UPDATE usuarios SET ativo = $1
      WHERE id = $2 AND escola_id = $3 AND perfil <> 'administrador'
      RETURNING *`,
    [ativo, id, req.escolaId]
  );

  if (!rows[0]) throw naoEncontrado('Usuário');
  res.json(paraUsuario(rows[0]));
}));

export default router;
