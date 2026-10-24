import express from 'express';
import cors from 'cors';

import { autenticar } from './middleware/auth.js';
import { ErroHttp } from './lib/http.js';

import auth from './routes/auth.js';
import escolas from './routes/escolas.js';
import faixas from './routes/faixas.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    projeto: 'HajimeTech'
  });
});

// Login e sessão (públicos; o restante da API exige token)
app.use('/api/auth', auth);

app.use('/api', autenticar);

app.use('/api/faixas', faixas);

// Escolas e todos os dados de uma escola: /api/escolas/:escolaId/...
app.use('/api/escolas', escolas);

app.use('/api', (req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada.'
  });
});

/*
 * Tratamento de erros. Toda resposta de erro tem o formato { erro }.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ erro: err.message });
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' });
  }

  // Gatilho do banco que bloqueia currículo nas faixas sem conteúdo definido
  if (err.code === 'P0001') {
    return res.status(422).json({ erro: err.message });
  }

  // Violação de unicidade (ex.: e-mail repetido)
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Já existe um registro com estes dados.' });
  }

  // Valor em formato inválido para o banco (ex.: data impossível)
  if (err.code === '22P02' || err.code === '22007' || err.code === '22008') {
    return res.status(400).json({ erro: 'Há dados em formato inválido.' });
  }

  console.error(err);

  res.status(500).json({
    erro: 'Erro interno. Tente novamente.',
    detail:
      process.env.NODE_ENV === 'development'
        ? err.message
        : undefined
  });
});

export default app;
