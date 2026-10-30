/*
 * Testes de integração: rodam contra um PostgreSQL de verdade, com as migrations
 * do Prisma e o database/seed.sql aplicados.
 *
 * Como rodar (dentro de backend/):
 *   TEST_DATABASE_URL=postgresql://hajimetech:hajimetech@localhost:5433/hajimetech npm test
 *
 * Sem TEST_DATABASE_URL os testes são pulados. Eles alteram dados (criam alunos,
 * graduações etc.), então use um banco de desenvolvimento ou de teste.
 */
import { randomUUID } from 'node:crypto';

import request from 'supertest';

const URL_BANCO = process.env.TEST_DATABASE_URL;
const descrever = URL_BANCO ? describe : describe.skip;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';
if (URL_BANCO) process.env.DATABASE_URL = URL_BANCO;

const { default: app } = await import('../src/app.js');
const { pool } = await import('../src/db/index.js');

// Dados do seed (os mesmos IDs dos mocks do front)
const HAJIME = '00000001-0000-4000-8000-000000000001';
const KIZUNA = '00000001-0000-4000-8000-000000000002';
const TURMA_INFANTIL = '00000003-0000-4000-8000-000000000001';
const ALUNO_LUCAS = '00000005-0000-4000-8000-000000000001';
const ALUNO_SOFIA = '00000005-0000-4000-8000-000000000002';
const SENHA = 'hajime123';

const tokens = {};

async function entrar(email) {
  const r = await request(app).post('/api/auth/login').send({ email, senha: SENHA });
  expect(r.statusCode).toBe(200);
  return r.body.token;
}

const como = (perfil) => ({ Authorization: `Bearer ${tokens[perfil]}` });
const h = `/api/escolas/${HAJIME}`;

descrever('API com banco de verdade', () => {
  beforeAll(async () => {
    tokens.admin = await entrar('admin@hajimetech.local');
    tokens.professor = await entrar('ana@hajime.local');
    tokens.aluno = await entrar('lucas@aluno.local');
  });

  afterAll(() => pool.end());

  describe('faixas e escolas', () => {
    test('8 faixas, com Marrom e Preta sem conteúdo definido', async () => {
      const r = await request(app).get('/api/faixas').set(como('professor'));

      expect(r.statusCode).toBe(200);
      expect(r.body.map((f) => f.id)).toEqual(['branca', 'azul', 'amarela', 'laranja', 'verde', 'roxa', 'marrom', 'preta']);
      expect(r.body.filter((f) => !f.conteudoDefinido).map((f) => f.id)).toEqual(['marrom', 'preta']);
    });

    test('administrador vê todas as escolas; professor, só a sua', async () => {
      const admin = await request(app).get('/api/escolas').set(como('admin'));
      const prof = await request(app).get('/api/escolas').set(como('professor'));

      expect(admin.body.map((e) => e.id).sort()).toEqual([HAJIME, KIZUNA]);
      expect(prof.body.map((e) => e.id)).toEqual([HAJIME]);
    });

  });

  describe('isolamento entre escolas', () => {
    test('professor não lê alunos de outra escola', async () => {
      const r = await request(app).get(`/api/escolas/${KIZUNA}/alunos`).set(como('professor'));
      expect(r.statusCode).toBe(403);
    });

    test('aluno de outra escola responde 404, mesmo para o administrador', async () => {
      const yuki = '00000005-0000-4000-8000-000000000024';
      const r = await request(app).get(`${h}/alunos/${yuki}`).set(como('admin'));
      expect(r.statusCode).toBe(404);
    });
  });

  describe('alunos', () => {
    test('lista só da escola, e a busca ignora acentos', async () => {
      const todos = await request(app).get(`${h}/alunos`).set(como('professor'));
      expect(todos.body.length).toBeGreaterThan(0);
      expect(todos.body.every((a) => a.escolaId === HAJIME && a.ativo)).toBe(true);

      const busca = await request(app).get(`${h}/alunos?busca=helena`).set(como('professor'));
      expect(busca.body.map((a) => a.nome)).toEqual(['Helena Costa']);
    });

    test('cadastro, exclusão lógica e reativação', async () => {
      const novo = await request(app)
        .post(`${h}/alunos`)
        .set(como('professor'))
        .send({ nome: 'Aluno de Teste', turmaId: TURMA_INFANTIL, faixaId: 'branca', dataNascimento: '2015-05-10' });
      expect(novo.statusCode).toBe(201);

      const excluido = await request(app).delete(`${h}/alunos/${novo.body.id}`).set(como('professor'));
      expect(excluido.statusCode).toBe(200);
      expect(excluido.body.ativo).toBe(false);

      const ativos = await request(app).get(`${h}/alunos`).set(como('professor'));
      expect(ativos.body.some((a) => a.id === novo.body.id)).toBe(false);

      const comInativos = await request(app).get(`${h}/alunos?incluirInativos=true`).set(como('professor'));
      expect(comInativos.body.some((a) => a.id === novo.body.id)).toBe(true);

      const reativado = await request(app).patch(`${h}/alunos/${novo.body.id}/reativar`).set(como('professor'));
      expect(reativado.body.ativo).toBe(true);
    });

    test('nome obrigatório → 400', async () => {
      const r = await request(app).post(`${h}/alunos`).set(como('professor')).send({ nome: '  ' });
      expect(r.statusCode).toBe(400);
      expect(r.body.erro).toBe('Informe o nome do aluno.');
    });
  });

  describe('perfil aluno (somente leitura dos próprios dados)', () => {
    test('lê o próprio cadastro e o progresso', async () => {
      const aluno = await request(app).get(`${h}/alunos/${ALUNO_LUCAS}`).set(como('aluno'));
      expect(aluno.statusCode).toBe(200);

      const progresso = await request(app).get(`${h}/alunos/${ALUNO_LUCAS}/progresso`).set(como('aluno'));
      expect(progresso.statusCode).toBe(200);
      expect(progresso.body.faixaId).toBe(aluno.body.faixaId);
    });

    test('não lê dados de outro aluno', async () => {
      const r = await request(app).get(`${h}/alunos/${ALUNO_SOFIA}`).set(como('aluno'));
      expect(r.statusCode).toBe(403);
    });

    test('listagens sempre devolvem só os próprios dados', async () => {
      const r = await request(app).get(`${h}/graduacoes?alunoId=${ALUNO_SOFIA}`).set(como('aluno'));
      expect(r.statusCode).toBe(200);
      expect(r.body.every((g) => g.alunoId === ALUNO_LUCAS)).toBe(true);
    });

    test('não escreve nada e não vê o painel', async () => {
      const escrita = await request(app).post(`${h}/turmas`).set(como('aluno')).send({});
      const painel = await request(app).get(`${h}/dashboard`).set(como('aluno'));

      expect(escrita.statusCode).toBe(403);
      expect(painel.statusCode).toBe(403);
    });
  });

  describe('turmas', () => {
    test('valida horários e devolve horas no formato HH:MM', async () => {
      const invalida = await request(app)
        .post(`${h}/turmas`)
        .set(como('professor'))
        .send({ nome: 'Noturna', idadeMinima: 18, idadeMaxima: null, horarios: [{ diaSemana: 2, horaInicio: '21:00', horaFim: '20:00' }] });
      expect(invalida.statusCode).toBe(400);

      const valida = await request(app)
        .post(`${h}/turmas`)
        .set(como('professor'))
        .send({ nome: 'Noturna', idadeMinima: 18, idadeMaxima: null, horarios: [{ diaSemana: 2, horaInicio: '21:00', horaFim: '22:00' }] });
      expect(valida.statusCode).toBe(201);
      expect(valida.body.horarios[0]).toMatchObject({ diaSemana: 2, horaInicio: '21:00', horaFim: '22:00' });
    });
  });

  describe('currículo', () => {
    test('Marrom não aceita categorias → 422', async () => {
      const r = await request(app)
        .post(`${h}/curriculo/categorias`)
        .set(como('professor'))
        .send({ faixaId: 'marrom', nome: 'Inventada' });

      expect(r.statusCode).toBe(422);
      expect(r.body.erro).toMatch(/Marrom ainda não foi definido/);
    });

    test('técnica desativada some da lista, mas não é apagada', async () => {
      const curriculo = await request(app).get(`${h}/curriculo?faixaId=azul`).set(como('professor'));
      const tecnica = curriculo.body[0].tecnicas[0];

      const r = await request(app)
        .patch(`${h}/curriculo/tecnicas/${tecnica.id}/ativo`)
        .set(como('professor'))
        .send({ ativo: false });
      expect(r.body.ativo).toBe(false);

      const ativas = await request(app).get(`${h}/curriculo?faixaId=azul`).set(como('professor'));
      expect(ativas.body[0].tecnicas.some((t) => t.id === tecnica.id)).toBe(false);

      const todas = await request(app).get(`${h}/curriculo?faixaId=azul&incluirInativas=true`).set(como('professor'));
      expect(todas.body[0].tecnicas.some((t) => t.id === tecnica.id)).toBe(true);
    });
  });

  describe('graduações', () => {
    test('não permite voltar de faixa e atualiza a faixa ao graduar', async () => {
      const aluno = (await request(app).get(`${h}/alunos/${ALUNO_SOFIA}`).set(como('professor'))).body;

      const paraTras = await request(app)
        .post(`${h}/graduacoes`)
        .set(como('professor'))
        .send({ alunoId: ALUNO_SOFIA, novaFaixaId: 'branca', data: '2026-01-10', observacoes: '' });
      expect(paraTras.statusCode).toBe(400);

      const faixas = (await request(app).get('/api/faixas').set(como('professor'))).body;
      const proxima = faixas.find((f) => f.ordem === faixas.find((x) => x.id === aluno.faixaId).ordem + 1);

      const r = await request(app)
        .post(`${h}/graduacoes`)
        .set(como('professor'))
        .send({ alunoId: ALUNO_SOFIA, novaFaixaId: proxima.id, data: '2026-01-10', observacoes: 'Teste' });
      expect(r.statusCode).toBe(201);
      expect(r.body.faixaAnteriorId).toBe(aluno.faixaId);

      const depois = (await request(app).get(`${h}/alunos/${ALUNO_SOFIA}`).set(como('professor'))).body;
      expect(depois.faixaId).toBe(proxima.id);
    });
  });

  describe('frequência', () => {
    test('grava a chamada e corrige sem duplicar', async () => {
      const rota = `${h}/turmas/${TURMA_INFANTIL}/frequencias`;
      const data = '2026-01-15';

      const chamada = await request(app).get(`${rota}?data=${data}`).set(como('professor'));
      expect(chamada.statusCode).toBe(200);
      const alvo = chamada.body[0].alunoId;

      await request(app).put(rota).set(como('professor')).send({ data, registros: [{ alunoId: alvo, presente: true }] });
      const corrigida = await request(app).put(rota).set(como('professor')).send({ data, registros: [{ alunoId: alvo, presente: false }] });
      expect(corrigida.statusCode).toBe(204);

      const depois = await request(app).get(`${rota}?data=${data}`).set(como('professor'));
      expect(depois.body.find((l) => l.alunoId === alvo).presente).toBe(false);
    });
  });

  describe('painel', () => {
    test('devolve todos os indicadores', async () => {
      const r = await request(app).get(`${h}/dashboard?periodoDias=90`).set(como('professor'));

      expect(r.statusCode).toBe(200);
      expect(r.body.porFaixa).toHaveLength(8);
      expect(r.body.alunosAtivos.atual).toBeGreaterThan(0);
      expect(r.body.presencas.atual).toBeGreaterThan(0);
      expect(r.body.evolucaoFrequencia.length).toBeGreaterThan(0);
      expect(r.body.maisAssiduos.length).toBeLessThanOrEqual(5);
    });
  });

  describe('usuários', () => {
    test('administrador cria professor em qualquer escola, sem devolver a senha', async () => {
      const email = `prof-${randomUUID()}@teste.local`;
      const r = await request(app)
        .post(`${h}/usuarios`)
        .set(como('admin'))
        .send({ nome: 'Professor Teste', email, perfil: 'professor', senha: 'senha123' });

      expect(r.statusCode).toBe(201);
      expect(r.body.perfil).toBe('professor');
      expect(r.body.email).toBe(email);
      expect(r.body.senha).toBeUndefined();
      expect(r.body.senhaHash).toBeUndefined();

      const login = await request(app).post('/api/auth/login').send({ email, senha: 'senha123' });
      expect(login.statusCode).toBe(200);
      expect(login.body.usuario.perfil).toBe('professor');
    });

    test('administrador cria professor em outra escola', async () => {
      const email = `prof-${randomUUID()}@teste.local`;
      const r = await request(app)
        .post(`/api/escolas/${KIZUNA}/usuarios`)
        .set(como('admin'))
        .send({ nome: 'Professor Kizuna', email, perfil: 'professor', senha: 'senha123' });

      expect(r.statusCode).toBe(201);
      expect(r.body.escolaId).toBe(KIZUNA);
    });

    test('professor cria acesso de aluno da própria escola', async () => {
      const email = `aluno-${randomUUID()}@teste.local`;
      const r = await request(app)
        .post(`${h}/usuarios`)
        .set(como('professor'))
        .send({ nome: 'Acesso da Sofia', email, perfil: 'aluno', alunoId: ALUNO_SOFIA, senha: 'senha123' });

      expect(r.statusCode).toBe(201);
      expect(r.body.perfil).toBe('aluno');
      expect(r.body.alunoId).toBe(ALUNO_SOFIA);
      expect(r.body.senha).toBeUndefined();

      const login = await request(app).post('/api/auth/login').send({ email, senha: 'senha123' });
      expect(login.statusCode).toBe(200);
      expect(login.body.usuario.alunoId).toBe(ALUNO_SOFIA);
    });

    test('professor não cria professor → 403', async () => {
      const email = `prof-${randomUUID()}@teste.local`;
      const r = await request(app)
        .post(`${h}/usuarios`)
        .set(como('professor'))
        .send({ nome: 'X', email, perfil: 'professor', senha: 'senha123' });

      expect(r.statusCode).toBe(403);
    });

    test('acesso de aluno exige aluno ativo da mesma escola → 400', async () => {
      const yuki = '00000005-0000-4000-8000-000000000024';
      const email = `aluno-${randomUUID()}@teste.local`;
      const r = await request(app)
        .post(`${h}/usuarios`)
        .set(como('professor'))
        .send({ nome: 'X', email, perfil: 'aluno', alunoId: yuki, senha: 'senha123' });

      expect(r.statusCode).toBe(400);
    });

    test('email repetido → 409', async () => {
      const email = `dup-${randomUUID()}@teste.local`;
      await request(app).post(`${h}/usuarios`).set(como('admin')).send({ nome: 'A', email, perfil: 'professor', senha: 'senha123' });
      const r = await request(app).post(`${h}/usuarios`).set(como('admin')).send({ nome: 'B', email, perfil: 'professor', senha: 'senha123' });

      expect(r.statusCode).toBe(409);
    });

    test('lista usuários e desativa/reativa acesso', async () => {
      const email = `ativo-${randomUUID()}@teste.local`;
      const criado = await request(app)
        .post(`${h}/usuarios`)
        .set(como('professor'))
        .send({ nome: 'Acesso Teste', email, perfil: 'aluno', alunoId: ALUNO_SOFIA, senha: 'senha123' });
      expect(criado.statusCode).toBe(201);

      const desativado = await request(app)
        .patch(`${h}/usuarios/${criado.body.id}/ativo`)
        .set(como('professor'))
        .send({ ativo: false });
      expect(desativado.body.ativo).toBe(false);

      const ativos = await request(app).get(`${h}/usuarios`).set(como('professor'));
      expect(ativos.body.some((u) => u.id === criado.body.id)).toBe(false);

      const todos = await request(app).get(`${h}/usuarios?incluirInativas=true`).set(como('professor'));
      expect(todos.body.some((u) => u.id === criado.body.id)).toBe(true);
      expect(todos.body.every((u) => u.senhaHash === undefined)).toBe(true);

      const loginInativo = await request(app).post('/api/auth/login').send({ email, senha: 'senha123' });
      expect(loginInativo.statusCode).toBe(401);

      const reativado = await request(app)
        .patch(`${h}/usuarios/${criado.body.id}/ativo`)
        .set(como('professor'))
        .send({ ativo: true });
      expect(reativado.body.ativo).toBe(true);
    });
  });

  describe('trocar senha', () => {
    test('senha atual incorreta → 400', async () => {
      const r = await request(app)
        .post('/api/auth/trocar-senha')
        .set(como('professor'))
        .send({ senhaAtual: 'errada', novaSenha: 'nova123' });

      expect(r.statusCode).toBe(400);
    });

    test('troca a senha e passa a entrar com a nova', async () => {
      const email = `troca-${randomUUID()}@teste.local`;
      const criado = await request(app)
        .post(`${h}/usuarios`)
        .set(como('admin'))
        .send({ nome: 'Troca de Senha', email, perfil: 'professor', senha: 'senha123' });
      expect(criado.statusCode).toBe(201);

      const login = await request(app).post('/api/auth/login').send({ email, senha: 'senha123' });
      const header = { Authorization: `Bearer ${login.body.token}` };

      const r = await request(app)
        .post('/api/auth/trocar-senha')
        .set(header)
        .send({ senhaAtual: 'senha123', novaSenha: 'nova123' });
      expect(r.statusCode).toBe(204);

      const antiga = await request(app).post('/api/auth/login').send({ email, senha: 'senha123' });
      expect(antiga.statusCode).toBe(401);

      const nova = await request(app).post('/api/auth/login').send({ email, senha: 'nova123' });
      expect(nova.statusCode).toBe(200);
    });
  });

  describe('critérios de avaliação', () => {
    test('cria, edita, desativa e reativa', async () => {
      const criado = await request(app)
        .post(`${h}/criterios-avaliacao`)
        .set(como('professor'))
        .send({ nome: 'Postura', descricao: 'Postura no tatame.' });
      expect(criado.statusCode).toBe(201);

      const editado = await request(app)
        .put(`${h}/criterios-avaliacao/${criado.body.id}`)
        .set(como('professor'))
        .send({ nome: 'Postura e respeito', descricao: '' });
      expect(editado.body.nome).toBe('Postura e respeito');

      const desativado = await request(app)
        .patch(`${h}/criterios-avaliacao/${criado.body.id}/ativo`)
        .set(como('professor'))
        .send({ ativo: false });
      expect(desativado.body.ativo).toBe(false);

      const ativos = await request(app).get(`${h}/criterios-avaliacao`).set(como('professor'));
      expect(ativos.body.some((c) => c.id === criado.body.id)).toBe(false);

      const reativado = await request(app)
        .patch(`${h}/criterios-avaliacao/${criado.body.id}/ativo`)
        .set(como('professor'))
        .send({ ativo: true });
      expect(reativado.body.ativo).toBe(true);
    });

    test('reordena os critérios e valida a lista', async () => {
      const lista = (await request(app).get(`${h}/criterios-avaliacao`).set(como('professor'))).body;
      const invertidos = [...lista.map((c) => c.id)].reverse();

      const invalida = await request(app)
        .patch(`${h}/criterios-avaliacao/reordenar`)
        .set(como('professor'))
        .send({ ids: lista.slice(1).map((c) => c.id) });
      expect(invalida.statusCode).toBe(400);

      const r = await request(app)
        .patch(`${h}/criterios-avaliacao/reordenar`)
        .set(como('professor'))
        .send({ ids: invertidos });
      expect(r.statusCode).toBe(204);

      const depois = (await request(app).get(`${h}/criterios-avaliacao`).set(como('professor'))).body;
      expect(depois.map((c) => c.id)).toEqual(invertidos);
    });

    test('aluno não edita critérios → 403', async () => {
      const r = await request(app)
        .post(`${h}/criterios-avaliacao`)
        .set(como('aluno'))
        .send({ nome: 'X' });

      expect(r.statusCode).toBe(403);
    });
  });
});
