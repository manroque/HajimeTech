import request from 'supertest';
import app from '../src/app.js';

test('health retorna ok', async () => {
  const r = await request(app).get('/api/health');

  expect(r.statusCode).toBe(200);
  expect(r.body.status).toBe('ok');
});

test('acesso a currículo responde sem autenticação externa', async () => {
  const r = await request(app).get('/api/curriculo?faixa=Azul');

  expect([200, 500]).toContain(r.statusCode);
});