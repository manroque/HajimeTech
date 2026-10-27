import { Router } from 'express';

import { pool, transacao } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { ehHora, ehUuid, flagQuery, requisicaoInvalida, rota, textoObrigatorio } from '../lib/http.js';
import { paraTurma } from '../lib/mapeadores.js';

const router = Router({ mergeParams: true });
const gestores = exigirPerfil('administrador', 'professor');

/* Busca as turmas informadas já com seus horários, na ordem recebida. */
export async function carregarTurmas(db, rows) {
  if (!rows.length) return [];

  const { rows: horarios } = await db.query(
    `SELECT * FROM horarios_turma
      WHERE turma_id = ANY($1)
      ORDER BY dia_semana, hora_inicio`,
    [rows.map((t) => t.id)]
  );

  return rows.map((t) => paraTurma(t, horarios.filter((h) => h.turma_id === t.id)));
}

function inteiro(valor, mensagem) {
  if (!Number.isInteger(valor) || valor < 0 || valor > 120) throw requisicaoInvalida(mensagem);
  return valor;
}

/* Valida o corpo de criação e edição (TurmaInput). */
async function lerTurma(body, escolaId) {
  const nome = textoObrigatorio(body?.nome, 'Informe o nome da turma.');
  const idadeMinima = inteiro(body?.idadeMinima, 'Informe uma idade mínima válida.');
  const idadeMaxima =
    body?.idadeMaxima === null || body?.idadeMaxima === undefined
      ? null
      : inteiro(body.idadeMaxima, 'Informe uma idade máxima válida.');

  if (idadeMaxima !== null && idadeMaxima < idadeMinima) {
    throw requisicaoInvalida('A idade máxima deve ser maior que a mínima.');
  }

  const professorId = body?.professorId || null;
  if (professorId) {
    const { rows } = await pool.query(
      `SELECT id FROM usuarios
        WHERE id = $1 AND escola_id = $2 AND perfil = 'professor' AND ativo`,
      [ehUuid(professorId) ? professorId : null, escolaId]
    );
    if (!rows[0]) throw requisicaoInvalida('O professor informado não pertence a esta escola.');
  }

  if (!Array.isArray(body?.horarios) || !body.horarios.length) {
    throw requisicaoInvalida('Informe pelo menos um horário.');
  }

  const horarios = body.horarios.map((h) => {
    const valido =
      Number.isInteger(h?.diaSemana) && h.diaSemana >= 0 && h.diaSemana <= 6 &&
      ehHora(h?.horaInicio) && ehHora(h?.horaFim);

    if (!valido) throw requisicaoInvalida('Há um horário com dia ou hora inválidos.');
    if (h.horaFim <= h.horaInicio) throw requisicaoInvalida('Em cada horário, o fim deve ser depois do início.');

    return { diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFim: h.horaFim };
  });

  return { nome, idadeMinima, idadeMaxima, professorId, horarios };
}

async function inserirHorarios(client, turmaId, horarios) {
  for (const h of horarios) {
    await client.query(
      `INSERT INTO horarios_turma (turma_id, dia_semana, hora_inicio, hora_fim)
       VALUES ($1, $2, $3, $4)`,
      [turmaId, h.diaSemana, h.horaInicio, h.horaFim]
    );
  }
}

/* GET /api/escolas/:escolaId/turmas?incluirInativas=false */
router.get('/', rota(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM turmas
      WHERE escola_id = $1 AND ($2 OR ativo)
      ORDER BY idade_minima, nome`,
    [req.escolaId, flagQuery(req.query.incluirInativas)]
  );

  res.json(await carregarTurmas(pool, rows));
}));

/* POST /api/escolas/:escolaId/turmas */
router.post('/', gestores, rota(async (req, res) => {
  const t = await lerTurma(req.body, req.escolaId);

  const turma = await transacao(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO turmas (escola_id, nome, idade_minima, idade_maxima, professor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.escolaId, t.nome, t.idadeMinima, t.idadeMaxima, t.professorId]
    );
    await inserirHorarios(client, rows[0].id, t.horarios);
    return (await carregarTurmas(client, rows))[0];
  });

  res.status(201).json(turma);
}));

/*
 * PENDENTE (issue de edição e desativação de turmas):
 *   PUT /api/escolas/:escolaId/turmas/:id   (substitui todos os horários, em transação)
 *   PATCH /api/escolas/:escolaId/turmas/:id/ativo { ativo }
 * As funções lerTurma, inserirHorarios e carregarTurmas acima podem ser reaproveitadas.
 */

export default router;
