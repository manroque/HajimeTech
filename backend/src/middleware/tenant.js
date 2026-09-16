import { ACADEMIA_DEMO } from '../db/index.js';

export function tenant(req, res, next) {
  req.academiaId =
    req.header('x-academia-id') || ACADEMIA_DEMO;

  req.userRole =
    req.header('x-user-role') || 'admin';

  next();
}

export function canWrite(req, res, next) {
  if (!['admin', 'professor'].includes(req.userRole)) {
    return res.status(403).json({
      error: 'Acesso negado'
    });
  }

  next();
}