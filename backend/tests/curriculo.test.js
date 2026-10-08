import request from 'supertest';
import app from '../src/app.js';

test('health retorna ok', async () => {
  const r = await request(app).get('/api/health');

  expect(r.statusCode).toBe(200);
  expect(r.body.status).toBe('ok');
});

test('currículo sem token → 401', async () => {
  const r = await request(app).get('/api/curriculo?faixa=Azul');

  expect(r.statusCode).toBe(401);
});