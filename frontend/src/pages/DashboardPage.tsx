/**
 * Painel (dashboard) da escola.
 * Objetivo: ser entendido por qualquer pessoa. Cada número e gráfico tem
 * um título simples e uma frase explicando o que mostra.
 */
import { CalendarCheck, GraduationCap, Percent, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartaoIndicador } from '../components/charts/CartaoIndicador';
import { CartaoGrafico, GraficoBarrasHorizontais, GraficoFrequencia } from '../components/charts/Graficos';
import { IconePremiacao } from '../components/IconePremiacao';
import { CabecalhoPagina, Carregando, EstadoVazio, FaixaBadge, MensagemErro, Segmentado } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useCarregar } from '../hooks/useCarregar';
import { dashboardService, turmasService } from '../services';
import { faixaPorId, formatarData, tempoRelativo } from '../utils/formatacao';
import s from './DashboardPage.module.css';
import p from './paginas.module.css';

export const PERIODOS = [
  { valor: 30, rotulo: 'Últimos 30 dias', anterior: 'mês anterior', curto: '30 dias' },
  { valor: 90, rotulo: 'Últimos 3 meses', anterior: 'trimestre anterior', curto: '3 meses' },
  { valor: 180, rotulo: 'Últimos 6 meses', anterior: 'semestre anterior', curto: '6 meses' },
];

export function DashboardPage() {
  const escola = useEscolaAtual();
  const [periodoDias, setPeriodoDias] = useState(30);
  const [turmaId, setTurmaId] = useState<string>('');
  const periodo = PERIODOS.find((x) => x.valor === periodoDias)!;

  const { dados: turmas } = useCarregar(() => turmasService.listar(escola.id), [escola.id]);
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => dashboardService.obter(escola.id, { periodoDias, turmaId: turmaId || null }),
    [escola.id, periodoDias, turmaId],
  );

  const turmaNome = turmas?.find((t) => t.id === turmaId)?.nome;

  return (
    <>
      <CabecalhoPagina
        titulo={`Painel · ${escola.nome}`}
        descricao="Um resumo de como está a academia: quem está treinando, como os alunos estão evoluindo e quem se destacou."
      />

      <div className={s.filtros} role="group" aria-label="Filtros do painel">
        <Segmentado rotulo="Período" opcoes={PERIODOS} valor={periodoDias} onMudar={setPeriodoDias} />
        <label className={s.filtroTurma}>
          <span className="visualmente-oculto">Turma</span>
          <select className="campo-input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">Todas as turmas</option>
            {turmas?.map((t) => (
              <option key={t.id} value={t.id}>Turma {t.nome}</option>
            ))}
          </select>
        </label>
        {carregando && dados && <span className="texto-fraco">Atualizando...</span>}
      </div>

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {!dados && carregando && <Carregando texto="Montando o painel..." />}

      {dados && (
        <div className={s.painel} aria-busy={carregando}>
          <div className={s.indicadores}>
            <CartaoIndicador
              rotulo="Alunos ativos"
              icone={<Users size={20} />}
              indicador={dados.alunosAtivos}
              rotuloPeriodoAnterior={periodo.anterior}
              explicacao={turmaNome ? `Alunos matriculados na turma ${turmaNome}.` : 'Alunos matriculados e treinando hoje.'}
            />
            <CartaoIndicador
              rotulo={`Presenças (${periodo.curto})`}
              icone={<CalendarCheck size={20} />}
              indicador={dados.presencas}
              rotuloPeriodoAnterior={periodo.anterior}
              explicacao="Quantas vezes, somando todos os alunos, alguém veio treinar."
            />
            <CartaoIndicador
              rotulo="Comparecimento"
              icone={<Percent size={20} />}
              indicador={dados.taxaPresenca}
              sufixo="%"
              rotuloPeriodoAnterior={periodo.anterior}
              explicacao="De cada 100 chamadas, quantas foram presença."
            />
            <CartaoIndicador
              rotulo={`Graduações (${periodo.curto})`}
              icone={<GraduationCap size={20} />}
              indicador={dados.graduacoes}
              rotuloPeriodoAnterior={periodo.anterior}
              explicacao="Quantos alunos trocaram de faixa no período."
            />
          </div>

          <div className={s.linhaLarga}>
            <CartaoGrafico
              titulo="Frequência ao longo do tempo"
              explicacao="Quantas vezes os alunos vieram treinar a cada semana. Linha subindo = mais gente no tatame."
              rodape="Passe o mouse (ou toque) sobre a linha para ver presenças, faltas e o comparecimento de cada semana. Só aparecem semanas completas. A semana atual entra no gráfico quando terminar."
            >
              {dados.evolucaoFrequencia.some((x) => x.presencas + x.faltas > 0) ? (
                <GraficoFrequencia dados={dados.evolucaoFrequencia} />
              ) : (
                <EstadoVazio titulo="Ainda não há chamadas registradas neste período" />
              )}
            </CartaoGrafico>

            <CartaoGrafico titulo="Quem mais treinou" explicacao={`Alunos com mais presenças nos ${periodo.rotulo.toLowerCase()}.`}>
              {dados.maisAssiduos.length ? (
                <ol className={s.ranking}>
                  {dados.maisAssiduos.map((a, i) => (
                    <li key={a.alunoId}>
                      <span className={s.posicao}>{i + 1}º</span>
                      <span className={p.listaTexto}>
                        <Link to={`/alunos/${a.alunoId}`} className={p.nomeLink}>{a.nome}</Link>
                        <span>Faixa {faixaPorId(a.faixaId).nome}</span>
                      </span>
                      <strong className={s.valor}>{a.presencas} treinos</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <EstadoVazio titulo="Sem presenças no período" />
              )}
            </CartaoGrafico>
          </div>

          <div className={p.grade2}>
            <CartaoGrafico
              titulo="Alunos por faixa"
              explicacao="Quantos alunos ativos estão em cada faixa, da Branca à Preta. Cada barra tem a cor da faixa."
            >
              <GraficoBarrasHorizontais
                dados={dados.porFaixa.map((f) => ({ rotulo: f.nome, valor: f.total, cor: f.cor }))}
                unidade={['aluno', 'alunos']}
              />
            </CartaoGrafico>

            <CartaoGrafico
              titulo="Alunos por turma"
              explicacao="Como os alunos ativos estão divididos entre as turmas da escola."
              rodape={turmaNome ? 'Este gráfico sempre mostra todas as turmas, para comparação.' : undefined}
            >
              {dados.porTurma.length ? (
                <GraficoBarrasHorizontais dados={dados.porTurma.map((t) => ({ rotulo: t.nome, valor: t.total }))} unidade={['aluno', 'alunos']} />
              ) : (
                <EstadoVazio titulo="Nenhuma turma cadastrada" />
              )}
            </CartaoGrafico>
          </div>

          <div className={p.grade2}>
            <CartaoGrafico titulo="Graduações recentes" explicacao="Alunos que passaram para uma nova faixa. Parabéns a eles!">
              {dados.graduacoesRecentes.length ? (
                <ul className={p.lista}>
                  {dados.graduacoesRecentes.map((g) => (
                    <li key={g.id}>
                      <span className={s.troca} aria-hidden>
                        <span style={{ background: faixaPorId(g.faixaAnteriorId).cor }} />
                        <span style={{ background: faixaPorId(g.novaFaixaId).cor }} />
                      </span>
                      <span className={p.listaTexto}>
                        <Link to={`/alunos/${g.alunoId}`} className={p.nomeLink}>{g.alunoNome}</Link>
                        <span>
                          {faixaPorId(g.faixaAnteriorId).nome} → {faixaPorId(g.novaFaixaId).nome} · {formatarData(g.data)}
                        </span>
                      </span>
                      <FaixaBadge faixaId={g.novaFaixaId} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EstadoVazio icone={<GraduationCap />} titulo="Nenhuma graduação neste período" descricao="Experimente escolher um período maior." />
              )}
            </CartaoGrafico>

            <CartaoGrafico titulo="Destaques e premiações" explicacao="Reconhecimentos dados aos alunos: destaque do mês, frequência, campeonatos e evolução.">
              {dados.premiacoesRecentes.length ? (
                <ul className={p.lista}>
                  {dados.premiacoesRecentes.map((pr) => (
                    <li key={pr.id}>
                      <IconePremiacao tipo={pr.tipo} />
                      <span className={p.listaTexto}>
                        <strong>{pr.premiacaoNome}</strong>
                        <span>
                          <Link to={`/alunos/${pr.alunoId}`} className={p.nomeLink}>{pr.alunoNome}</Link> · {pr.descricao}
                        </span>
                      </span>
                      <span className="texto-fraco">{tempoRelativo(pr.data)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EstadoVazio titulo="Nenhuma premiação neste período" />
              )}
            </CartaoGrafico>
          </div>
        </div>
      )}
    </>
  );
}
