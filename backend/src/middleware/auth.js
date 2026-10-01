import jwt from 'jsonwebtoken';

export const MSG_SEM_PERMISSAO = 'Você não tem permissão para realizar esta ação.';

export function segredoJwt() {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error('JWT_SECRET não configurado no .env');
  }

  return segredo;
}

/*
 * Exige o cabeçalho `Authorization: Bearer <token>`.
 * Em caso de sucesso, disponibiliza `req.usuario` com os dados do token.
 */
export function autenticar(req, res, next) {
  const [tipo, token] = (req.header('authorization') || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      erro: 'Faça login para continuar.'
    });
  }

  try {
    const dados = jwt.verify(token, segredoJwt());

    req.usuario = {
      id: dados.sub,
      perfil: dados.perfil,
      escolaId: dados.escolaId ?? null,
      alunoId: dados.alunoId ?? null
    };

    next();
  } catch {
    res.status(401).json({
      erro: 'Sessão expirada ou inválida. Entre novamente.'
    });
  }
}

/*
 * Restringe a rota aos perfis informados. Usar depois de `autenticar`.
 */
export function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({
        erro: MSG_SEM_PERMISSAO
      });
    }

    next();
  };
}
