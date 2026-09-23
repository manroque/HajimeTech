/**
 * Indicadores do dashboard e dos relatórios.
 *
 * INTEGRAÇÃO BACKEND: GET /api/escolas/:escolaId/dashboard?periodoDias=30&turmaId=
 * Todo o cálculo abaixo deve ir para o servidor (consultas SQL agregadas);
 * o front apenas exibe o objeto `Dashboard`.
 */
import { deISO, hojeLocal, paraISO } from '../mocks/utils';
import type { Dashboard, FiltroDashboard, IndicadorComparado } from '../types';
import { db, simular } from './mockDb';

function comparar(atual: number, anterior: number): IndicadorComparado {
  return { atual, anterior, variacao: anterior > 0 ? ((atual - anterior) / anterior) * 100 : null };
}

function somarDias(iso: string, dias: number): string {
  const d = deISO(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

/** Segunda-feira da semana de uma data. */
function inicioDaSemana(iso: string): string {
  const d = deISO(iso);
  const deslocamento = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - deslocamento);
  return paraISO(d);
}

export const dashboardService = {
  obter(escolaId: string, filtro: FiltroDashboard): Promise<Dashboard> {
    return simular(() => {
      const banco = db();
      const hoje = paraISO(hojeLocal());
      const inicio = somarDias(hoje, -filtro.periodoDias);
      const inicioAnterior = somarDias(hoje, -2 * filtro.periodoDias);
      const noPeriodo = (d: string) => d > inicio && d <= hoje;
      const noAnterior = (d: string) => d > inicioAnterior && d <= inicio;

      const turmas = banco.turmas.filter((t) => t.escolaId === escolaId && t.ativo);
      const alunosEscola = banco.alunos.filter((a) => a.escolaId === escolaId);
      const alunosFiltro = alunosEscola.filter((a) => !filtro.turmaId || a.turmaId === filtro.turmaId);
      const ativos = alunosFiltro.filter((a) => a.ativo);
      const idsFiltro = new Set(alunosFiltro.map((a) => a.id));
      const nomeAluno = (id: string) => alunosEscola.find((a) => a.id === id)?.nome ?? 'Aluno';

      const freq = banco.frequencias.filter(
        (f) => f.escolaId === escolaId && (!filtro.turmaId || f.turmaId === filtro.turmaId),
      );
      const freqAtual = freq.filter((f) => noPeriodo(f.data));
      const freqAnterior = freq.filter((f) => noAnterior(f.data));
      const presencasAtual = freqAtual.filter((f) => f.presente).length;
      const presencasAnterior = freqAnterior.filter((f) => f.presente).length;
      const taxa = (presentes: number, total: number) => (total ? Math.round((presentes / total) * 100) : 0);

      const graduacoes = banco.graduacoes.filter((g) => g.escolaId === escolaId && idsFiltro.has(g.alunoId));

      // Evolução semanal da frequência, só com semanas COMPLETAS (segunda a domingo),
      // para a semana em andamento não parecer uma queda no gráfico.
      const semanas = new Map<string, { presencas: number; faltas: number }>();
      const primeiraSegunda = somarDias(inicioDaSemana(inicio), 7);
      for (let d = primeiraSegunda; somarDias(d, 6) < hoje; d = somarDias(d, 7)) {
        semanas.set(d, { presencas: 0, faltas: 0 });
      }
      for (const f of freq) {
        const s = semanas.get(inicioDaSemana(f.data));
        if (s) f.presente ? s.presencas++ : s.faltas++;
      }

      // Alunos que mais treinaram
      const contagem = new Map<string, number>();
      freqAtual.filter((f) => f.presente).forEach((f) => contagem.set(f.alunoId, (contagem.get(f.alunoId) ?? 0) + 1));

      return {
        alunosAtivos: comparar(ativos.length, ativos.filter((a) => a.dataIngresso <= inicio).length),
        presencas: comparar(presencasAtual, presencasAnterior),
        taxaPresenca: comparar(taxa(presencasAtual, freqAtual.length), taxa(presencasAnterior, freqAnterior.length)),
        graduacoes: comparar(
          graduacoes.filter((g) => noPeriodo(g.data)).length,
          graduacoes.filter((g) => noAnterior(g.data)).length,
        ),
        porFaixa: banco.faixas.map((f) => ({
          faixaId: f.id,
          nome: f.nome,
          cor: f.cor,
          total: ativos.filter((a) => a.faixaId === f.id).length,
        })),
        porTurma: turmas.map((t) => ({
          turmaId: t.id,
          nome: t.nome,
          total: alunosEscola.filter((a) => a.ativo && a.turmaId === t.id).length,
        })),
        evolucaoFrequencia: [...semanas.entries()].map(([semana, v]) => ({ semana, ...v })),
        graduacoesRecentes: graduacoes
          .filter((g) => noPeriodo(g.data))
          .sort((a, b) => b.data.localeCompare(a.data))
          .slice(0, 6)
          .map((g) => ({ ...g, alunoNome: nomeAluno(g.alunoId) })),
        premiacoesRecentes: banco.premiacoesAluno
          .filter((p) => p.escolaId === escolaId && idsFiltro.has(p.alunoId) && noPeriodo(p.data))
          .sort((a, b) => b.data.localeCompare(a.data))
          .slice(0, 6)
          .map((p) => {
            const premiacao = banco.premiacoes.find((x) => x.id === p.premiacaoId);
            return { ...p, alunoNome: nomeAluno(p.alunoId), premiacaoNome: premiacao?.nome ?? '', tipo: premiacao?.tipo ?? 'outro' };
          }),
        maisAssiduos: [...contagem.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([alunoId, presencas]) => {
            const aluno = alunosEscola.find((a) => a.id === alunoId)!;
            return { alunoId, nome: aluno.nome, faixaId: aluno.faixaId, presencas };
          }),
      };
    }, 300);
  },
};
