/**
 * Perfil completo do aluno: dados, progresso no currículo, jornada de faixas,
 * frequência, graduações, técnicas, avaliações e premiações.
 * Usado pelos professores (/alunos/:id) e pelo próprio aluno (/minha-evolucao).
 */
import { CalendarCheck, ClipboardList, GraduationCap, Phone, Target, Trophy, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useCarregar } from '../hooks/useCarregar';
import {
  alunosService,
  avaliacoesService,
  curriculoService,
  frequenciaService,
  graduacoesService,
  mediaAvaliacao,
  premiacoesService,
  tecnicasAlunoService,
  turmasService,
} from '../services';
import type { NivelTecnica } from '../types';
import {
  FAIXAS,
  NIVEIS_TECNICA,
  faixaPorId,
  formatarData,
  hojeISO,
  hojeLocal,
  paraISO,
  idade,
  proximaFaixa,
  tempoRelativo,
} from '../utils/formatacao';
import { CartaoGrafico, GraficoBarrasHorizontais, GraficoEvolucaoNotas } from './charts/Graficos';
import { IconePremiacao } from './IconePremiacao';
import { Abas, Aviso, BarraProgresso, BotaoLink, Carregando, Cartao, EstadoVazio, Etiqueta, FaixaBadge, MensagemErro } from './ui';
import s from './PerfilAluno.module.css';

type Aba = 'frequencia' | 'graduacoes' | 'tecnicas' | 'avaliacoes' | 'premiacoes';

const TOM_NIVEL: Record<NivelTecnica, 'neutro' | 'alerta' | 'sucesso'> = {
  iniciante: 'neutro',
  em_desenvolvimento: 'alerta',
  domina: 'sucesso',
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function PerfilAluno({ alunoId, somenteLeitura = false }: { alunoId: string; somenteLeitura?: boolean }) {
  const escola = useEscolaAtual();
  const [aba, setAba] = useState<Aba>('frequencia');

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [aluno, turmas, frequencias, graduacoes, registros, tecnicas, progresso, avaliacoes, criterios, concedidas, premiacoes] =
      await Promise.all([
        alunosService.obter(escola.id, alunoId),
        turmasService.listar(escola.id, true),
        frequenciaService.doAluno(escola.id, alunoId),
        graduacoesService.listar(escola.id, alunoId),
        tecnicasAlunoService.listar(escola.id, alunoId),
        curriculoService.listarTecnicas(escola.id),
        tecnicasAlunoService.progresso(escola.id, alunoId),
        avaliacoesService.listar(escola.id, alunoId),
        avaliacoesService.listarCriterios(escola.id),
        premiacoesService.listarConcedidas(escola.id, alunoId),
        premiacoesService.listar(escola.id, true),
      ]);
    return { aluno, turmas, frequencias, graduacoes, registros, tecnicas, progresso, avaliacoes, criterios, concedidas, premiacoes };
  }, [escola.id, alunoId]);

  if (erro) return <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />;
  if (!dados) return carregando ? <Carregando texto="Carregando perfil..." /> : null;

  const { aluno, turmas, frequencias, graduacoes, registros, tecnicas, progresso, avaliacoes, criterios, concedidas, premiacoes } = dados;
  const turma = turmas.find((t) => t.id === aluno.turmaId);
  const faixa = faixaPorId(aluno.faixaId);
  const proxima = proximaFaixa(aluno.faixaId);

  // Frequência: resumo dos últimos 30 e 90 dias + presenças por mês
  const limite = (dias: number) => {
    const d = hojeLocal();
    d.setDate(d.getDate() - dias);
    return paraISO(d);
  };
  const ultimos = (dias: number) => frequencias.filter((f) => f.data > limite(dias));
  const presencas30 = ultimos(30).filter((f) => f.presente).length;
  const chamadas90 = ultimos(90);
  const taxa90 = chamadas90.length ? Math.round((chamadas90.filter((f) => f.presente).length / chamadas90.length) * 100) : 0;
  const porMes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      rotulo: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      valor: frequencias.filter((f) => f.presente && f.data.startsWith(chave)).length,
    };
  });

  // Técnicas registradas, agrupadas por faixa
  const tecnicasPorFaixa = FAIXAS.map((f) => ({
    faixa: f,
    itens: registros
      .map((r) => ({ registro: r, tecnica: tecnicas.find((t) => t.id === r.tecnicaId) }))
      .filter((x) => x.tecnica?.faixaId === f.id),
  })).filter((g) => g.itens.length);

  const dataFaixa = (id: string) => graduacoes.find((g) => g.novaFaixaId === id)?.data;

  return (
    <div className={s.perfil}>
      {/* ------------------------------------------------ Cabeçalho */}
      <Cartao className={s.topo}>
        <div className={s.identidade}>
          <div className={s.avatar} style={{ borderColor: faixa.cor === '#F1F5F9' ? '#94a3b8' : faixa.cor }} aria-hidden>
            {aluno.nome.charAt(0)}
          </div>
          <div className={s.identidadeTexto}>
            <h1>{aluno.nome}</h1>
            <div className="linha">
              <FaixaBadge faixaId={aluno.faixaId} />
              {!aluno.ativo && <Etiqueta>Desativado</Etiqueta>}
              <span className="texto-fraco">
                Turma {turma?.nome ?? '-'} · {aluno.dataNascimento ? `${idade(aluno.dataNascimento)} anos` : 'idade não informada'} · treina{' '}
                desde {formatarData(aluno.dataIngresso)} ({tempoRelativo(aluno.dataIngresso)})
              </span>
            </div>
          </div>
          {!somenteLeitura && aluno.ativo && (
            <div className={s.acoes}>
              <BotaoLink para={`/graduacoes?alunoId=${aluno.id}`} variante="secundario" tamanho="sm" icone={<GraduationCap size={16} />}>Registrar graduação</BotaoLink>
              <BotaoLink para={`/acompanhamento?alunoId=${aluno.id}`} variante="secundario" tamanho="sm" icone={<Target size={16} />}>Técnicas</BotaoLink>
              <BotaoLink para={`/avaliacoes?alunoId=${aluno.id}`} variante="secundario" tamanho="sm" icone={<ClipboardList size={16} />}>Avaliar</BotaoLink>
            </div>
          )}
        </div>
        <dl className={s.dados}>
          <div><dt><Phone size={14} aria-hidden /> Telefone</dt><dd>{aluno.telefone || '-'}</dd></div>
          <div><dt><UserRound size={14} aria-hidden /> Responsável</dt><dd>{aluno.responsavel || '-'}</dd></div>
          <div><dt><CalendarCheck size={14} aria-hidden /> Ingresso</dt><dd>{formatarData(aluno.dataIngresso)}</dd></div>
          <div className={s.obs}><dt>Observações</dt><dd>{aluno.observacoes || '-'}</dd></div>
        </dl>
      </Cartao>

      {/* ------------------------------------------------ Progresso e jornada */}
      <div className={s.resumo}>
        <Cartao titulo="Progresso na faixa atual" descricao="Quanto do currículo da faixa o aluno já domina.">
          {progresso.conteudoDefinido && progresso.total > 0 ? (
            <div className="pilha">
              <BarraProgresso
                valor={progresso.percentual}
                rotulo={`Faixa ${faixa.nome}`}
                detalhe={`Domina ${progresso.domina} de ${progresso.total} técnicas · ${progresso.emDesenvolvimento} em desenvolvimento · ${progresso.iniciante} iniciando`}
              />
              {proxima && (
                <p className="texto-fraco">
                  Próxima faixa: <strong>{proxima.nome}</strong>.{' '}
                  {progresso.percentual >= 100 ? 'Currículo concluído, pronto para o exame.' : `Faltam ${progresso.total - progresso.domina} técnicas.`}
                </p>
              )}
            </div>
          ) : (
            <Aviso>Conteúdo ainda não definido pela academia para a faixa {faixa.nome}.</Aviso>
          )}
        </Cartao>

        <Cartao titulo="Jornada de faixas" descricao="O caminho percorrido até agora.">
          <ol className={s.jornada}>
            {FAIXAS.map((f) => {
              const conquistada = f.ordem <= faixa.ordem;
              const data = f.id === 'branca' ? aluno.dataIngresso : dataFaixa(f.id);
              return (
                <li key={f.id} className={conquistada ? s.conquistada : ''} aria-current={f.id === faixa.id ? 'step' : undefined}>
                  <span className={s.fita} style={{ background: f.cor }} />
                  <span className={s.jornadaNome}>{f.nome}</span>
                  <span className={s.jornadaData}>{conquistada && data ? formatarData(data) : f.id === proxima?.id ? 'próxima' : ''}</span>
                </li>
              );
            })}
          </ol>
        </Cartao>
      </div>

      {/* ------------------------------------------------ Abas */}
      <Cartao>
        <Abas
          rotulo="Informações do aluno"
          ativa={aba}
          onMudar={setAba}
          abas={[
            { id: 'frequencia', rotulo: 'Frequência' },
            { id: 'graduacoes', rotulo: `Graduações (${graduacoes.length})` },
            { id: 'tecnicas', rotulo: `Técnicas (${registros.length})` },
            { id: 'avaliacoes', rotulo: `Avaliações (${avaliacoes.length})` },
            { id: 'premiacoes', rotulo: `Premiações (${concedidas.length})` },
          ]}
        />

        {aba === 'frequencia' && (
          <div className="pilha">
            <div className={s.numeros}>
              <div><strong>{presencas30}</strong><span>treinos nos últimos 30 dias</span></div>
              <div><strong>{taxa90}%</strong><span>de comparecimento nos últimos 3 meses</span></div>
              <div><strong>{frequencias.filter((f) => f.presente).length}</strong><span>treinos desde o ingresso</span></div>
            </div>
            <CartaoGrafico titulo="Treinos por mês" explicacao="Quantas vezes o aluno veio treinar em cada um dos últimos 6 meses.">
              <GraficoBarrasHorizontais dados={porMes} unidade={['treino', 'treinos']} />
            </CartaoGrafico>
            <h3>Últimas chamadas</h3>
            {frequencias.length ? (
              <div className={s.chamadas}>
                {[...frequencias].reverse().slice(0, 12).map((f) => (
                  <span key={f.id} className={f.presente ? s.presente : s.falta} title={f.presente ? 'Presente' : 'Faltou'}>
                    {formatarData(f.data).slice(0, 5)} · {f.presente ? 'Presente' : 'Faltou'}
                  </span>
                ))}
              </div>
            ) : (
              <EstadoVazio titulo="Nenhuma chamada registrada" />
            )}
          </div>
        )}

        {aba === 'graduacoes' &&
          (graduacoes.length ? (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Data</th><th>Faixa anterior</th><th>Nova faixa</th><th>Observações</th></tr></thead>
                <tbody>
                  {graduacoes.map((g) => (
                    <tr key={g.id}>
                      <td>{formatarData(g.data)}</td>
                      <td><FaixaBadge faixaId={g.faixaAnteriorId} /></td>
                      <td><FaixaBadge faixaId={g.novaFaixaId} /></td>
                      <td>{g.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EstadoVazio icone={<GraduationCap />} titulo="Ainda sem graduações" descricao="O aluno está na primeira faixa." />
          ))}

        {aba === 'tecnicas' &&
          (tecnicasPorFaixa.length ? (
            <div className="pilha">
              {tecnicasPorFaixa.reverse().map(({ faixa: f, itens }) => (
                <section key={f.id}>
                  <h3 className={s.subtitulo}><FaixaBadge faixaId={f.id} /></h3>
                  <ul className={s.tecnicas}>
                    {itens.map(({ registro, tecnica }) => (
                      <li key={registro.id}>
                        <span>
                          <strong>{tecnica!.nome}</strong>
                          <small>{tecnica!.categoriaNome}{registro.observacoes && ` · ${registro.observacoes}`}</small>
                        </span>
                        <Etiqueta tom={TOM_NIVEL[registro.nivel]}>{NIVEIS_TECNICA[registro.nivel].rotulo}</Etiqueta>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <EstadoVazio icone={<Target />} titulo="Nenhuma técnica registrada" />
          ))}

        {aba === 'avaliacoes' &&
          (avaliacoes.length ? (
            <div className="pilha">
              <CartaoGrafico titulo="Evolução nas avaliações" explicacao="Média das notas (de 1 a 5) em cada avaliação. Linha subindo = aluno evoluindo.">
                <GraficoEvolucaoNotas dados={avaliacoes.map((a) => ({ data: a.data, media: Math.round(mediaAvaliacao(a) * 10) / 10 }))} />
              </CartaoGrafico>
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      {criterios.map((c) => <th key={c.id} className="num">{c.nome}</th>)}
                      <th className="num">Média</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...avaliacoes].reverse().map((a) => (
                      <tr key={a.id}>
                        <td>{formatarData(a.data)}</td>
                        {criterios.map((c) => <td key={c.id} className="num">{a.notas.find((n) => n.criterioId === c.id)?.nota ?? '-'}</td>)}
                        <td className="num"><strong>{mediaAvaliacao(a).toFixed(1)}</strong></td>
                        <td>{a.observacoes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EstadoVazio icone={<ClipboardList />} titulo="Nenhuma avaliação ainda" />
          ))}

        {aba === 'premiacoes' &&
          (concedidas.length ? (
            <ul className={s.premios}>
              {concedidas.map((c) => {
                const premiacao = premiacoes.find((p) => p.id === c.premiacaoId);
                return (
                  <li key={c.id}>
                    <IconePremiacao tipo={premiacao?.tipo ?? 'outro'} tamanho={44} />
                    <span>
                      <strong>{premiacao?.nome}</strong>
                      <small>{c.descricao} · {formatarData(c.data)}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EstadoVazio icone={<Trophy />} titulo="Nenhuma premiação ainda" descricao="Continue treinando, o próximo destaque pode ser seu." />
          ))}
      </Cartao>
      <p className="texto-fraco">Dados atualizados em {formatarData(hojeISO())}.</p>
    </div>
  );
}
