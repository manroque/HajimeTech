import request from 'supertest';
import app from '../src/app.js';

test('health retorna ok', async () => {
  const r = await request(app).get('/api/health');

  expect(r.statusCode).toBe(200);
  expect(r.body.status).toBe('ok');
});

test('currículo sem token → 401', async () => {
  const r = await request(app).get('/api/escolas/00000001-0000-4000-8000-000000000001/curriculo?faixaId=azul');

  expect(r.statusCode).toBe(401);
});
