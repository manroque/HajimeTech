import { Router } from 'express';

import { pool } from '../db/index.js';
import { exigirPerfil } from '../middleware/auth.js';
import { hojeISO, inicioDaSemana, somarDias } from '../lib/datas.js';
import { ehUuid, requisicaoInvalida, rota } from '../lib/http.js';
import { paraGraduacao, paraPremiacaoAluno } from '../lib/mapeadores.js';

/*
 * GET /api/escolas/:escolaId/dashboard?periodoDias=30&turmaId=
 * Indicadores do painel e dos relatórios (tipo `Dashboard` do front).
 *
 * Período atual = (hoje menos periodoDias, hoje]; período anterior = mesmo
 * tamanho imediatamente antes. Regras detalhadas em backend/README.md, seção 7.12.
 */
const router = Router({ mergeParams: true });

function comparar(atual, anterior) {
  return { atual, anterior, variacao: anterior > 0 ? ((atual - anterior) / anterior) * 100 : null };
}

const taxa = (presentes, total) => (total ? Math.round((presentes / total) * 100) : 0);

router.get('/', exigirPerfil('administrador', 'professor'), rota(async (req, res) => {
  const periodoDias = req.query.periodoDias === undefined ? 30 : Number(req.query.periodoDias);
  if (!Number.isInteger(periodoDias) || periodoDias < 1 || periodoDias > 366) {
    throw requisicaoInvalida('O período deve ter entre 1 e 366 dias.');
  }

  const turmaId = req.query.turmaId || null;
  if (turmaId && !ehUuid(turmaId)) throw requisicaoInvalida('Turma inválida.');

  const hoje = hojeISO();
  const inicio = somarDias(hoje, -periodoDias);
  const inicioAnterior = somarDias(hoje, -2 * periodoDias);
  const noPeriodo = (d) => d > inicio && d <= hoje;
  const noAnterior = (d) => d > inicioAnterior && d <= inicio;
  const e = req.escolaId;

  const [faixas, turmas, alunos, frequencias, graduacoes, premiacoes] = await Promise.all([
    pool.query('SELECT id, nome, cor FROM faixas ORDER BY ordem'),
    pool.query('SELECT id, nome FROM turmas WHERE escola_id = $1 AND ativo ORDER BY idade_minima, nome', [e]),
    pool.query('SELECT id, nome, faixa_id, turma_id, ativo, data_ingresso FROM alunos WHERE escola_id = $1', [e]),
    pool.query(
      `SELECT aluno_id, turma_id, data, presente FROM frequencias
        WHERE escola_id = $1 AND data > $2::date AND data <= $3::date
          AND ($4::uuid IS NULL OR turma_id = $4)`,
      [e, inicioAnterior, hoje, turmaId]
    ),
    pool.query(
      'SELECT * FROM graduacoes WHERE escola_id = $1 AND data > $2::date AND data <= $3::date',
      [e, inicioAnterior, hoje]
    ),
    pool.query(
      `SELECT pa.*, p.nome AS premiacao_nome, p.tipo
         FROM premiacoes_aluno pa JOIN premiacoes p ON p.id = pa.premiacao_id
        WHERE pa.escola_id = $1 AND pa.data > $2::date AND pa.data <= $3::date`,
      [e, inicio, hoje]
    )
  ]);

  const alunosEscola = alunos.rows;
  const alunosFiltro = alunosEscola.filter((a) => !turmaId || a.turma_id === turmaId);
  const ativos = alunosFiltro.filter((a) => a.ativo);
  const idsFiltro = new Set(alunosFiltro.map((a) => a.id));
  const nomeAluno = (id) => alunosEscola.find((a) => a.id === id)?.nome ?? 'Aluno';

  const freqAtual = frequencias.rows.filter((f) => noPeriodo(f.data));
  const freqAnterior = frequencias.rows.filter((f) => noAnterior(f.data));
  const presencasAtual = freqAtual.filter((f) => f.presente).length;
  const presencasAnterior = freqAnterior.filter((f) => f.presente).length;
  const gradsFiltro = graduacoes.rows.filter((g) => idsFiltro.has(g.aluno_id));

  // Evolução semanal: só semanas completas (segunda a domingo) dentro do período.
  const semanas = new Map();
  for (let d = somarDias(inicioDaSemana(inicio), 7); somarDias(d, 6) < hoje; d = somarDias(d, 7)) {
    semanas.set(d, { presencas: 0, faltas: 0 });
  }
  for (const f of frequencias.rows) {
    const s = semanas.get(inicioDaSemana(f.data));
    if (s) f.presente ? s.presencas++ : s.faltas++;
  }

  // Alunos que mais treinaram no período
  const contagem = new Map();
  for (const f of freqAtual) {
    if (f.presente) contagem.set(f.aluno_id, (contagem.get(f.aluno_id) ?? 0) + 1);
  }

  res.json({
    alunosAtivos: comparar(ativos.length, ativos.filter((a) => a.data_ingresso <= inicio).length),
    presencas: comparar(presencasAtual, presencasAnterior),
    taxaPresenca: comparar(taxa(presencasAtual, freqAtual.length), taxa(presencasAnterior, freqAnterior.length)),
    graduacoes: comparar(
      gradsFiltro.filter((g) => noPeriodo(g.data)).length,
      gradsFiltro.filter((g) => noAnterior(g.data)).length
    ),
    porFaixa: faixas.rows.map((f) => ({
      faixaId: f.id,
      nome: f.nome,
      cor: f.cor,
      total: ativos.filter((a) => a.faixa_id === f.id).length
    })),
    porTurma: turmas.rows.map((t) => ({
      turmaId: t.id,
      nome: t.nome,
      total: alunosEscola.filter((a) => a.ativo && a.turma_id === t.id).length
    })),
    evolucaoFrequencia: [...semanas.entries()].map(([semana, v]) => ({ semana, ...v })),
    graduacoesRecentes: gradsFiltro
      .filter((g) => noPeriodo(g.data))
      .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em - a.criado_em)
      .slice(0, 6)
      .map((g) => ({ ...paraGraduacao(g), alunoNome: nomeAluno(g.aluno_id) })),
    premiacoesRecentes: premiacoes.rows
      .filter((p) => idsFiltro.has(p.aluno_id))
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 6)
      .map(({ premiacao_nome: premiacaoNome, tipo, ...p }) => ({
        ...paraPremiacaoAluno(p),
        alunoNome: nomeAluno(p.aluno_id),
        premiacaoNome,
        tipo
      })),
    maisAssiduos: [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([alunoId, presencas]) => {
        const aluno = alunosEscola.find((a) => a.id === alunoId);
        return { alunoId, nome: aluno?.nome ?? 'Aluno', faixaId: aluno?.faixa_id, presencas };
      })
  });
}));

export default router;
