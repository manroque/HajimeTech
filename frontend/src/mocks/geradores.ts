/**
 * Geração determinística dos dados "de movimento": graduações, frequência,
 * acompanhamento técnico, avaliações e premiações.
 *
 * As datas são relativas a hoje (ex.: "12 dias atrás"), para que o dashboard
 * sempre tenha dados recentes. O seed.sql usa `CURRENT_DATE - n` pelo mesmo motivo.
 */
import type {
  Aluno,
  Avaliacao,
  CategoriaCurriculo,
  CriterioAvaliacao,
  Frequencia,
  Graduacao,
  Premiacao,
  PremiacaoAluno,
  Tecnica,
  TecnicaAluno,
  Turma,
} from '../types';
import { ESCOLAS } from './cadastros';
import { FAIXAS } from './faixas';
import { CRIADO_EM, TABELA, criarSorteio, deISO, diasAtras, hojeLocal, paraISO, uid } from './utils';

const ordemDaFaixa = (id: string) => FAIXAS.find((f) => f.id === id)!.ordem;

/* ---------------------------------------------------------------- Graduações */

/** Cria o histórico de graduações e ajusta a data de ingresso de cada aluno. */
export function gerarGraduacoes(alunos: Aluno[]): { alunos: Aluno[]; graduacoes: Graduacao[] } {
  const sorteio = criarSorteio(2024);
  const graduacoes: Graduacao[] = [];

  const alunosAjustados = alunos.map((aluno, i) => {
    const ordemAtual = ordemDaFaixa(aluno.faixaId);
    // Alguns alunos graduaram recentemente, para aparecerem no dashboard.
    let offset = i % 5 === 0 ? 4 + Math.floor(sorteio() * 24) : 35 + Math.floor(sorteio() * 280);
    const datas: { de: number; para: number; offset: number }[] = [];

    for (let ordem = ordemAtual; ordem > 1; ordem--) {
      datas.push({ de: ordem - 1, para: ordem, offset });
      offset += 150 + Math.floor(sorteio() * 120);
    }
    const ingresso = datas.length ? offset + Math.floor(sorteio() * 60) : 20 + Math.floor(sorteio() * 200);

    for (const g of datas.reverse()) {
      graduacoes.push({
        id: '',
        escolaId: aluno.escolaId,
        alunoId: aluno.id,
        faixaAnteriorId: FAIXAS[g.de - 1].id,
        novaFaixaId: FAIXAS[g.para - 1].id,
        data: diasAtras(g.offset),
        observacoes: g.para === ordemAtual ? 'Exame de faixa aprovado.' : '',
        criadoEm: CRIADO_EM,
      });
    }
    return { ...aluno, dataIngresso: diasAtras(ingresso) };
  });

  graduacoes.sort((a, b) => a.data.localeCompare(b.data));
  graduacoes.forEach((g, i) => (g.id = uid(TABELA.graduacoes, i + 1)));
  return { alunos: alunosAjustados, graduacoes };
}

/* ---------------------------------------------------------------- Frequência */

/** Presenças e faltas nos dias de aula de cada turma, no último ano. */
export function gerarFrequencias(alunos: Aluno[], turmas: Turma[]): Frequencia[] {
  const sorteio = criarSorteio(7);
  const frequencias: Frequencia[] = [];
  const hoje = hojeLocal();

  alunos
    .filter((a) => a.ativo && a.turmaId)
    .forEach((aluno) => {
      const turma = turmas.find((t) => t.id === aluno.turmaId)!;
      const dias = new Set(turma.horarios.map((h) => h.diaSemana));
      const assiduidade = 0.5 + sorteio() * 0.4;
      const ingresso = deISO(aluno.dataIngresso);

      for (let n = 365; n >= 1; n--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - n);
        if (data < ingresso || !dias.has(data.getDay() as never)) continue;

        // Leve tendência de alta recente e queda nas férias de janeiro.
        let chance = assiduidade + 0.12 * (1 - n / 365);
        if (data.getMonth() === 0) chance -= 0.25;

        frequencias.push({
          id: uid(TABELA.frequencias, frequencias.length + 1),
          escolaId: aluno.escolaId,
          alunoId: aluno.id,
          turmaId: turma.id,
          data: paraISO(data),
          presente: sorteio() < chance,
        });
      }
    });

  return frequencias;
}

/* ---------------------------------------------------------------- Acompanhamento técnico */

export function gerarTecnicasAluno(
  alunos: Aluno[],
  categorias: CategoriaCurriculo[],
  tecnicas: Tecnica[],
): TecnicaAluno[] {
  const sorteio = criarSorteio(99);
  const registros: TecnicaAluno[] = [];

  for (const aluno of alunos.filter((a) => a.ativo)) {
    const ordemAtual = ordemDaFaixa(aluno.faixaId);
    const progresso = sorteio();

    for (const faixa of FAIXAS.filter((f) => f.ordem <= ordemAtual && f.conteudoDefinido)) {
      const tecnicasDaFaixa = categorias
        .filter((c) => c.escolaId === aluno.escolaId && c.faixaId === faixa.id)
        .sort((a, b) => a.ordem - b.ordem)
        .flatMap((c) =>
          tecnicas.filter((t) => t.categoriaId === c.id && t.ativo).sort((a, b) => a.ordem - b.ordem),
        );

      tecnicasDaFaixa.forEach((tecnica, j) => {
        let nivel: TecnicaAluno['nivel'] | null = 'domina';
        if (faixa.ordem === ordemAtual) {
          const posicao = j / tecnicasDaFaixa.length;
          if (posicao < progresso * 0.6) nivel = 'domina';
          else if (posicao < progresso) nivel = 'em_desenvolvimento';
          else nivel = sorteio() < 0.5 ? 'iniciante' : null;
        }
        if (!nivel) return;
        registros.push({
          id: uid(TABELA.tecnicasAluno, registros.length + 1),
          escolaId: aluno.escolaId,
          alunoId: aluno.id,
          tecnicaId: tecnica.id,
          nivel,
          observacoes: nivel === 'em_desenvolvimento' && sorteio() < 0.3 ? 'Precisa ajustar o desequilíbrio (kuzushi).' : '',
          atualizadoEm: CRIADO_EM,
        });
      });
    }
  }
  return registros;
}

/* ---------------------------------------------------------------- Avaliações */

export function gerarCriterios(): CriterioAvaliacao[] {
  const modelo = [
    ['Técnica', 'Execução correta dos movimentos da faixa.'],
    ['Disciplina', 'Respeito às regras, aos colegas e ao professor.'],
    ['Frequência', 'Comparecimento e pontualidade nos treinos.'],
    ['Evolução', 'Quanto o aluno melhorou desde a última avaliação.'],
  ];
  return ESCOLAS.flatMap((escola, e) =>
    modelo.map(([nome, descricao], i) => ({
      id: uid(TABELA.criterios, e * modelo.length + i + 1),
      escolaId: escola.id,
      nome,
      descricao,
      ordem: i + 1,
      ativo: true,
    })),
  );
}

export function gerarAvaliacoes(alunos: Aluno[], turmas: Turma[], criterios: CriterioAvaliacao[]): Avaliacao[] {
  const sorteio = criarSorteio(314);
  const avaliacoes: Avaliacao[] = [];
  const hoje = hojeLocal().getTime();
  const comentarios = [
    'Boa evolução nas quedas.',
    'Precisa manter a regularidade nos treinos.',
    'Muito dedicado, ajuda os colegas.',
    'Melhorou bastante a postura e a pegada.',
    '',
  ];

  for (const aluno of alunos.filter((a) => a.ativo)) {
    const diasDeCasa = Math.round((hoje - deISO(aluno.dataIngresso).getTime()) / 86_400_000);
    const quantidade = Math.min(4, Math.floor(diasDeCasa / 75));
    const turma = turmas.find((t) => t.id === aluno.turmaId);
    const criteriosEscola = criterios.filter((c) => c.escolaId === aluno.escolaId);
    const base = 2 + sorteio();

    for (let k = quantidade - 1; k >= 0; k--) {
      const passo = quantidade - 1 - k; // 0 = mais antiga
      avaliacoes.push({
        id: '',
        escolaId: aluno.escolaId,
        alunoId: aluno.id,
        avaliadorId: turma?.professorId ?? null,
        data: diasAtras(15 + k * 75),
        observacoes: comentarios[Math.floor(sorteio() * comentarios.length)],
        notas: criteriosEscola.map((c) => ({
          criterioId: c.id,
          nota: Math.max(1, Math.min(5, Math.round(base + passo * 0.6 + (sorteio() - 0.5) * 1.2))),
        })),
        criadoEm: CRIADO_EM,
      });
    }
  }
  avaliacoes.sort((a, b) => a.data.localeCompare(b.data));
  avaliacoes.forEach((a, i) => (a.id = uid(TABELA.avaliacoes, i + 1)));
  return avaliacoes;
}

/* ---------------------------------------------------------------- Premiações */

export function gerarPremiacoes(): Premiacao[] {
  const modelo: [string, string, Premiacao['tipo']][] = [
    ['Destaque do mês', 'Aluno que mais se destacou no mês em técnica e atitude.', 'destaque_mes'],
    ['Maior frequência', 'Aluno que mais compareceu aos treinos no período.', 'frequencia'],
    ['Medalha em campeonato', 'Conquista de medalha em competição oficial.', 'campeonato'],
    ['Maior evolução técnica', 'Aluno que mais evoluiu no currículo da faixa.', 'evolucao'],
  ];
  return ESCOLAS.flatMap((escola, e) =>
    modelo.map(([nome, descricao, tipo], i) => ({
      id: uid(TABELA.premiacoes, e * modelo.length + i + 1),
      escolaId: escola.id,
      nome,
      descricao,
      tipo,
      ativo: true,
    })),
  );
}

export function gerarPremiacoesAluno(
  alunos: Aluno[],
  premiacoes: Premiacao[],
  frequencias: Frequencia[],
): PremiacaoAluno[] {
  const sorteio = criarSorteio(11);
  const registros: Omit<PremiacaoAluno, 'id'>[] = [];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const campeonatos = ['Copa Regional de Judô', 'Campeonato Estadual', 'Torneio Interescolas', 'Festival Kids de Judô'];
  const medalhas = ['Ouro', 'Prata', 'Bronze'];

  for (const escola of ESCOLAS) {
    const ativos = alunos.filter((a) => a.escolaId === escola.id && a.ativo);
    const premio = (tipo: Premiacao['tipo']) => premiacoes.find((p) => p.escolaId === escola.id && p.tipo === tipo)!;
    const qualquer = () => ativos[Math.floor(sorteio() * ativos.length)];

    // Destaque do mês nos últimos 6 meses
    for (let m = 0; m < 6; m++) {
      const data = diasAtras(m * 30 + 2);
      registros.push({
        escolaId: escola.id, premiacaoId: premio('destaque_mes').id, alunoId: qualquer().id, data,
        descricao: `Destaque de ${meses[deISO(data).getMonth()]}.`,
      });
    }

    // Maior frequência por trimestre, calculada a partir da frequência real
    for (let q = 0; q < 2; q++) {
      const inicio = diasAtras((q + 1) * 90);
      const fim = diasAtras(q * 90);
      const contagem = new Map<string, number>();
      frequencias
        .filter((f) => f.escolaId === escola.id && f.presente && f.data > inicio && f.data <= fim)
        .forEach((f) => contagem.set(f.alunoId, (contagem.get(f.alunoId) ?? 0) + 1));
      const [alunoId, total] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
      if (alunoId) {
        registros.push({
          escolaId: escola.id, premiacaoId: premio('frequencia').id, alunoId, data: diasAtras(q * 90 + 1),
          descricao: `${total} presenças no trimestre.`,
        });
      }
    }

    // Campeonatos
    for (let c = 0; c < 3; c++) {
      registros.push({
        escolaId: escola.id, premiacaoId: premio('campeonato').id, alunoId: qualquer().id,
        data: diasAtras(10 + c * 55 + Math.floor(sorteio() * 20)),
        descricao: `${medalhas[Math.floor(sorteio() * 3)]}: ${campeonatos[Math.floor(sorteio() * campeonatos.length)]}.`,
      });
    }

    // Maior evolução técnica
    registros.push({
      escolaId: escola.id, premiacaoId: premio('evolucao').id, alunoId: qualquer().id, data: diasAtras(40),
      descricao: 'Concluiu todo o currículo da faixa em tempo recorde.',
    });
  }

  return registros
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r, i) => ({ ...r, id: uid(TABELA.premiacoesAluno, i + 1) }));
}
