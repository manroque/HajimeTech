import express from 'express';
import cors from 'cors';

import { tenant } from './middleware/tenant.js';

import alunos from './routes/alunos.js';
import turmas from './routes/turmas.js';
import frequencias from './routes/frequencias.js';
import graduacoes from './routes/graduacoes.js';
import tecnico from './routes/tecnico.js';
import curriculo from './routes/curriculo.js';
import dashboard from './routes/dashboard.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    projeto: 'HajimeTech'
  });
});

app.use('/api', tenant);

app.use('/api/alunos', alunos);
app.use('/api/turmas', turmas);
app.use('/api/frequencias', frequencias);
app.use('/api/graduacoes', graduacoes);
app.use('/api/tecnico', tecnico);
app.use('/api/curriculo', curriculo);
app.use('/api/dashboard', dashboard);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'Erro interno',
    detail:
      process.env.NODE_ENV === 'development'
        ? err.message
        : undefined
  });
});

export default app;