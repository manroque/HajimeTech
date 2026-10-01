import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { pool } from '../db/index.js';
import { autenticar, segredoJwt } from '../middleware/auth.js';

const router = Router();

const MSG_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

const COLUNAS_USUARIO = `
  id, escola_id, nome, email, senha_hash, perfil, aluno_id, ativo
`;

/* Linha do banco (snake_case) → tipo `Usuario` do front (camelCase). */
function paraUsuario(row) {
  return {
    id: row.id,
    escolaId: row.escola_id,
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    alunoId: row.aluno_id,
    ativo: row.ativo
  };
}

function gerarToken(usuario) {
  return jwt.sign(
    {
      perfil: usuario.perfil,
      escolaId: usuario.escolaId,
      alunoId: usuario.alunoId
    },
    segredoJwt(),
    {
      subject: usuario.id,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  );
}

/*
 * POST /api/auth/login
 *
 * Recebe { email, senha } e devolve { token, usuario }.
 * A mensagem de erro é a mesma para e-mail inexistente, senha errada
 * ou usuário inativo, para não revelar quais e-mails existem.
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Informe o e-mail e a senha.'
      });
    }

    const { rows } = await pool.query(
      `SELECT ${COLUNAS_USUARIO} FROM usuarios WHERE lower(email) = lower($1)`,
      [email]
    );

    const row = rows[0];
    const senhaConfere =
      row?.senha_hash ? await bcrypt.compare(senha, row.senha_hash) : false;

    if (!row || !row.ativo || !senhaConfere) {
      return res.status(401).json({
        erro: MSG_LOGIN_INVALIDO
      });
    }

    const usuario = paraUsuario(row);

    res.json({
      token: gerarToken(usuario),
      usuario
    });
  } catch (err) {
    next(err);
  }
});

/*
 * GET /api/auth/me
 *
 * Devolve o usuário do token, relido do banco (confirma que continua ativo).
 */
router.get('/me', autenticar, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUNAS_USUARIO} FROM usuarios WHERE id = $1`,
      [req.usuario.id]
    );

    if (!rows[0]?.ativo) {
      return res.status(401).json({
        erro: 'Sessão expirada ou inválida. Entre novamente.'
      });
    }

    res.json(paraUsuario(rows[0]));
  } catch (err) {
    next(err);
  }
});

export default router;
