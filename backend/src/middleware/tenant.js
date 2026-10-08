import { exigirPerfil } from './auth.js';

/*
 * Escopo de escola das rotas legadas. Usar depois de `autenticar`.
 * A escola vem do token (nunca de cabeçalhos enviados pelo cliente).
 */
export function tenant(req, res, next) {
  if (!req.usuario?.escolaId) {
    // Administrador global não tem escola no token; as rotas legadas ainda
    // não recebem `escolaId` na URL.
    return res.status(400).json({
      erro: 'Selecione uma escola.'
    });
  }

  req.academiaId = req.usuario.escolaId;

  next();
}

export const canWrite = exigirPerfil('administrador', 'professor');
