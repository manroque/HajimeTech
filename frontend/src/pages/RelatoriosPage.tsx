/**
 * Relatórios: os indicadores do painel em formato de tabela, prontos para imprimir
 * (ou salvar em PDF pelo navegador).
 */
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { GraficoBarrasHorizontais } from '../components/charts/Graficos';
import { Logo } from '../components/Logo';
import { Botao, CabecalhoPagina, CampoSelecao, Carregando, Cartao, MensagemErro } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useCarregar } from '../hooks/useCarregar';
import { dashboardService, turmasService } from '../services';
import type { IndicadorComparado } from '../types';
import { faixaPorId, formatarData, hojeISO, numero } from '../utils/formatacao';
import { PERIODOS } from './DashboardPage';
import s from './RelatoriosPage.module.css';

function variacao(i: IndicadorComparado) {
  if (i.variacao === null) return '-';
  const v = Math.round(i.variacao);
  return `${v > 0 ? '+' : ''}${v}%`;
}

const pct = (parte: number, total: number) => (total ? `${Math.round((parte / total) * 100)}%` : '-');

export function RelatoriosPage() {
  const escola = useEscolaAtual();
  const [periodoDias, setPeriodoDias] = useState(30);
  const [turmaId, setTurmaId] = useState('');
  const periodo = PERIODOS.find((x) => x.valor === periodoDias)!;

  const { dados: turmas } = useCarregar(() => turmasService.listar(escola.id), [escola.id]);
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => dashboardService.obter(escola.id, { periodoDias, turmaId: turmaId || null }),
    [escola.id, periodoDias, turmaId],
  );

  const turmaNome = turmas?.find((t) => t.id === turmaId)?.nome ?? 'Todas as turmas';
  const totalFaixa = dados?.porFaixa.reduce((t, f) => t + f.total, 0) ?? 0;
  const totalTurma = dados?.porTurma.reduce((t, f) => t + f.total, 0) ?? 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Relatórios"
        descricao="Os números da academia em tabelas, para imprimir, salvar em PDF ou apresentar em reuniões."
        acoes={<Botao icone={<Printer size={18} />} onClick={() => window.print()} disabled={!dados}>Imprimir relatório</Botao>}
      />

      <Cartao className="nao-imprimir">
        <div className={s.filtros}>
          <CampoSelecao rotulo="Período" value={periodoDias} onChange={(e) => setPeriodoDias(Number(e.target.value))}>
            {PERIODOS.map((x) => <option key={x.valor} value={x.valor}>{x.rotulo}</option>)}
          </CampoSelecao>
          <CampoSelecao rotulo="Turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </CampoSelecao>
        </div>
      </Cartao>

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !dados && <Carregando />}

      {dados && (
        <article className={s.relatorio}>
          <header className={s.cabecalhoImpressao}>
            <Logo tamanho="sm" />
            <div>
              <h2>Relatório da academia · {escola.nome}</h2>
              <p>
                {periodo.rotulo} · {turmaNome} · emitido em {formatarData(hojeISO())}
              </p>
            </div>
          </header>

          <section className={s.secao}>
            <h3>1. Indicadores principais</h3>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Indicador</th><th className="num">Período atual</th><th className="num">{periodo.anterior[0].toUpperCase() + periodo.anterior.slice(1)}</th><th className="num">Variação</th></tr></thead>
                <tbody>
                  <tr><td>Alunos ativos</td><td className="num">{numero(dados.alunosAtivos.atual)}</td><td className="num">{numero(dados.alunosAtivos.anterior)}</td><td className="num">{variacao(dados.alunosAtivos)}</td></tr>
                  <tr><td>Presenças</td><td className="num">{numero(dados.presencas.atual)}</td><td className="num">{numero(dados.presencas.anterior)}</td><td className="num">{variacao(dados.presencas)}</td></tr>
                  <tr><td>Comparecimento</td><td className="num">{dados.taxaPresenca.atual}%</td><td className="num">{dados.taxaPresenca.anterior}%</td><td className="num">{variacao(dados.taxaPresenca)}</td></tr>
                  <tr><td>Graduações</td><td className="num">{dados.graduacoes.atual}</td><td className="num">{dados.graduacoes.anterior}</td><td className="num">{variacao(dados.graduacoes)}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className={s.duasColunas}>
            <section className={s.secao}>
              <h3>2. Distribuição de alunos por faixa</h3>
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead><tr><th>Faixa</th><th className="num">Alunos</th><th className="num">%</th></tr></thead>
                  <tbody>
                    {dados.porFaixa.map((f) => (
                      <tr key={f.faixaId}>
                        <td><span className={s.amostra} style={{ background: f.cor }} aria-hidden /> {f.nome}</td>
                        <td className="num">{f.total}</td>
                        <td className="num">{pct(f.total, totalFaixa)}</td>
                      </tr>
                    ))}
                    <tr className={s.total}><td>Total</td><td className="num">{totalFaixa}</td><td className="num">100%</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className={s.secao}>
              <h3>3. Distribuição de alunos por turma</h3>
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead><tr><th>Turma</th><th className="num">Alunos</th><th className="num">%</th></tr></thead>
                  <tbody>
                    {dados.porTurma.map((t) => (
                      <tr key={t.turmaId}><td>{t.nome}</td><td className="num">{t.total}</td><td className="num">{pct(t.total, totalTurma)}</td></tr>
                    ))}
                    <tr className={s.total}><td>Total</td><td className="num">{totalTurma}</td><td className="num">100%</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12 }}>
                <GraficoBarrasHorizontais dados={dados.porTurma.map((t) => ({ rotulo: t.nome, valor: t.total }))} unidade={['aluno', 'alunos']} />
              </div>
            </section>
          </div>

          <section className={s.secao}>
            <h3>4. Frequência semanal</h3>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Semana de</th><th className="num">Presenças</th><th className="num">Faltas</th><th className="num">Comparecimento</th></tr></thead>
                <tbody>
                  {dados.evolucaoFrequencia.map((w) => (
                    <tr key={w.semana}>
                      <td>{formatarData(w.semana)}</td>
                      <td className="num">{w.presencas}</td>
                      <td className="num">{w.faltas}</td>
                      <td className="num">{pct(w.presencas, w.presencas + w.faltas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className={s.duasColunas}>
            <section className={s.secao}>
              <h3>5. Graduações no período</h3>
              {dados.graduacoesRecentes.length ? (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr><th>Data</th><th>Aluno</th><th>De → Para</th></tr></thead>
                    <tbody>
                      {dados.graduacoesRecentes.map((g) => (
                        <tr key={g.id}><td>{formatarData(g.data)}</td><td>{g.alunoNome}</td><td>{faixaPorId(g.faixaAnteriorId).nome} → {faixaPorId(g.novaFaixaId).nome}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="texto-fraco">Nenhuma graduação no período.</p>}
            </section>

            <section className={s.secao}>
              <h3>6. Destaques e premiações</h3>
              {dados.premiacoesRecentes.length ? (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr><th>Data</th><th>Aluno</th><th>Premiação</th></tr></thead>
                    <tbody>
                      {dados.premiacoesRecentes.map((pr) => (
                        <tr key={pr.id}><td>{formatarData(pr.data)}</td><td>{pr.alunoNome}</td><td>{pr.premiacaoNome}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="texto-fraco">Nenhuma premiação no período.</p>}
            </section>
          </div>

          <section className={s.secao}>
            <h3>7. Alunos mais assíduos</h3>
            <ol className={s.assiduos}>
              {dados.maisAssiduos.map((a) => <li key={a.alunoId}>{a.nome} (faixa {faixaPorId(a.faixaId).nome}): {a.presencas} presenças</li>)}
            </ol>
          </section>

          <footer className={s.rodape}>HajimeTech · Relatório gerado automaticamente a partir dos registros da escola.</footer>
        </article>
      )}
    </>
  );
}
