import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'segredo-de-teste';

const query = jest.fn();

jest.unstable_mockModule('../src/db/index.js', () => ({
  pool: { query },
  ACADEMIA_DEMO: '00000000-0000-0000-0000-000000000001'
}));

const { default: app } = await import('../src/app.js');

const hash = bcrypt.hashSync('hajime123', 4);

const ana = {
  id: '00000002-0000-4000-8000-000000000002',
  escola_id: '00000001-0000-4000-8000-000000000001',
  nome: 'Sensei Ana Paula Ribeiro',
  email: 'ana@hajime.local',
  senha_hash: hash,
  perfil: 'professor',
  aluno_id: null,
  ativo: true
};

beforeEach(() => query.mockReset());

describe('POST /api/auth/login', () => {
  test('devolve token e usuário em camelCase', async () => {
    query.mockResolvedValueOnce({ rows: [ana] });

    const r = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ANA@hajime.local ', senha: 'hajime123' });

    expect(r.statusCode).toBe(200);
    expect(r.body.usuario).toEqual({
      id: ana.id,
      escolaId: ana.escola_id,
      nome: ana.nome,
      email: ana.email,
      perfil: 'professor',
      alunoId: null,
      ativo: true
    });
    expect(r.body.usuario.senhaHash).toBeUndefined();

    const dados = jwt.verify(r.body.token, 'segredo-de-teste');
    expect(dados.sub).toBe(ana.id);
    expect(dados.perfil).toBe('professor');
    expect(dados.escolaId).toBe(ana.escola_id);
    expect(dados.exp).toBeGreaterThan(dados.iat);
  });

  test('senha errada → 401', async () => {
    query.mockResolvedValueOnce({ rows: [ana] });

    const r = await request(app)
      .post('/api/auth/login')
      .send({ email: ana.email, senha: 'errada' });

    expect(r.statusCode).toBe(401);
    expect(r.body.erro).toBe('E-mail ou senha incorretos.');
  });

  test('e-mail inexistente → 401 com a mesma mensagem', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const r = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@x.local', senha: 'hajime123' });

    expect(r.statusCode).toBe(401);
    expect(r.body.erro).toBe('E-mail ou senha incorretos.');
  });

  test('usuário inativo → 401', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...ana, ativo: false }] });

    const r = await request(app)
      .post('/api/auth/login')
      .send({ email: ana.email, senha: 'hajime123' });

    expect(r.statusCode).toBe(401);
  });

  test('usuário sem senha cadastrada → 401', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...ana, senha_hash: null }] });

    const r = await request(app)
      .post('/api/auth/login')
      .send({ email: ana.email, senha: 'hajime123' });

    expect(r.statusCode).toBe(401);
  });

  test('campos faltando → 400', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: ana.email });

    expect(r.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('GET /api/auth/me', () => {
  const token = () =>
    jwt.sign({ perfil: 'professor', escolaId: ana.escola_id, alunoId: null }, 'segredo-de-teste', {
      subject: ana.id,
      expiresIn: '1h'
    });

  test('sem token → 401', async () => {
    const r = await request(app).get('/api/auth/me');

    expect(r.statusCode).toBe(401);
  });

  test('token inválido → 401', async () => {
    const r = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');

    expect(r.statusCode).toBe(401);
  });

  test('token expirado → 401', async () => {
    const expirado = jwt.sign({ perfil: 'professor' }, 'segredo-de-teste', {
      subject: ana.id,
      expiresIn: -10
    });

    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expirado}`);

    expect(r.statusCode).toBe(401);
  });

  test('token válido → usuário atual', async () => {
    query.mockResolvedValueOnce({ rows: [ana] });

    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token()}`);

    expect(r.statusCode).toBe(200);
    expect(r.body.email).toBe(ana.email);
    expect(query.mock.calls[0][1]).toEqual([ana.id]);
  });

  test('usuário desativado depois do login → 401', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...ana, ativo: false }] });

    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token()}`);

    expect(r.statusCode).toBe(401);
  });
});

describe('rotas protegidas', () => {
  const tokenDe = (perfil, extra = {}) =>
    jwt.sign(
      { perfil, escolaId: ana.escola_id, alunoId: null, ...extra },
      'segredo-de-teste',
      { subject: ana.id, expiresIn: '1h' }
    );

  test('sem token → 401', async () => {
    const r = await request(app).get('/api/alunos');

    expect(r.statusCode).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('token inválido → 401', async () => {
    const r = await request(app).get('/api/alunos').set('Authorization', 'Bearer abc.def.ghi');

    expect(r.statusCode).toBe(401);
  });

  test('token expirado → 401', async () => {
    const expirado = jwt.sign({ perfil: 'professor', escolaId: ana.escola_id }, 'segredo-de-teste', {
      subject: ana.id,
      expiresIn: -10
    });

    const r = await request(app).get('/api/alunos').set('Authorization', `Bearer ${expirado}`);

    expect(r.statusCode).toBe(401);
  });

  test('cabeçalhos legados sem token não dão acesso → 401', async () => {
    const r = await request(app)
      .post('/api/turmas')
      .set('x-user-role', 'admin')
      .set('x-academia-id', ana.escola_id)
      .send({ nome: 'Kids', horario: '18h' });

    expect(r.statusCode).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('aluno não pode escrever → 403', async () => {
    const r = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${tokenDe('aluno', { alunoId: 'a1' })}`)
      .send({ nome: 'Fulano' });

    expect(r.statusCode).toBe(403);
    expect(r.body.erro).toBe('Você não tem permissão para realizar esta ação.');
    expect(query).not.toHaveBeenCalled();
  });

  test('professor passa e a escola vem do token, não do cabeçalho', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 't1' }] });

    const r = await request(app)
      .post('/api/turmas')
      .set('Authorization', `Bearer ${tokenDe('professor')}`)
      .set('x-academia-id', 'outra-escola')
      .send({ nome: 'Kids', horario: '18h' });

    expect(r.statusCode).toBe(201);
    expect(query.mock.calls[0][1][0]).toBe(ana.escola_id);
  });

  test('administrador global sem escola → 400', async () => {
    const r = await request(app)
      .get('/api/alunos')
      .set('Authorization', `Bearer ${tokenDe('administrador', { escolaId: null })}`);

    expect(r.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});
