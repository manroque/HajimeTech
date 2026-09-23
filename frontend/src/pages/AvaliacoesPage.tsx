/** Avaliação de desempenho: notas de 1 a 5 por critério, observações e histórico com gráfico. */
import { ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CartaoGrafico, GraficoEvolucaoNotas } from '../components/charts/Graficos';
import { Botao, CabecalhoPagina, CampoArea, CampoSelecao, CampoTexto, Carregando, Cartao, EstadoVazio, FaixaBadge, MensagemErro, Modal } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, avaliacoesService, mediaAvaliacao } from '../services';
import { formatarData, hojeISO } from '../utils/formatacao';
import s from './AvaliacoesPage.module.css';
import p from './paginas.module.css';

/** Conceito em palavras para cada nota, o que facilita para quem não é da área. */
export const CONCEITOS: Record<number, string> = {
  1: 'Precisa de atenção',
  2: 'Em adaptação',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

export function AvaliacoesPage() {
  const escola = useEscolaAtual();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const alunoId = params.get('alunoId') ?? '';

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [alunos, criterios, avaliacoes] = await Promise.all([
      alunosService.listar(escola.id),
      avaliacoesService.listarCriterios(escola.id),
      avaliacoesService.listar(escola.id),
    ]);
    return { alunos, criterios, avaliacoes };
  }, [escola.id]);

  const [nova, setNova] = useState<{ data: string; observacoes: string; notas: Record<string, number> } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const aluno = dados?.alunos.find((a) => a.id === alunoId);
  const doAluno = dados?.avaliacoes.filter((a) => a.alunoId === alunoId) ?? [];
  const recentes = [...(dados?.avaliacoes ?? [])].reverse().slice(0, 15);
  const nomeAluno = (id: string) => dados?.alunos.find((a) => a.id === id)?.nome ?? 'Aluno desativado';

  function abrirNova() {
    if (!dados) return;
    setNova({ data: hojeISO(), observacoes: '', notas: Object.fromEntries(dados.criterios.map((c) => [c.id, 3])) });
  }

  async function salvar() {
    if (!nova || !aluno) return;
    setSalvando(true);
    try {
      await avaliacoesService.criar(escola.id, {
        alunoId: aluno.id,
        data: nova.data,
        observacoes: nova.observacoes,
        notas: Object.entries(nova.notas).map(([criterioId, nota]) => ({ criterioId, nota })),
      });
      toast('Avaliação registrada.');
      setNova(null);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Avaliações de desempenho"
        descricao="Avalie cada aluno nos critérios da academia com notas de 1 a 5 e acompanhe a evolução ao longo do tempo."
      />

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !dados && <Carregando />}

      {dados && (
        <div className="pilha">
          <Cartao>
            <div className={p.formGrade}>
              <CampoSelecao rotulo="Aluno" value={alunoId} onChange={(e) => setParams(e.target.value ? { alunoId: e.target.value } : {}, { replace: true })}>
                <option value="">Todos (avaliações recentes)</option>
                {dados.alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </CampoSelecao>
              <div style={{ alignSelf: 'end' }}>
                <Botao icone={<Plus size={18} />} disabled={!aluno} onClick={abrirNova} title={aluno ? undefined : 'Selecione um aluno'}>
                  Nova avaliação
                </Botao>
              </div>
            </div>
            <p className="texto-fraco" style={{ marginTop: 12 }}>
              Critérios da escola: {dados.criterios.map((c) => c.nome).join(', ')}. Escala: {Object.entries(CONCEITOS).map(([n, c]) => `${n} = ${c}`).join(' · ')}.
            </p>
          </Cartao>

          {aluno ? (
            doAluno.length ? (
              <>
                <CartaoGrafico
                  titulo={`Evolução de ${aluno.nome}`}
                  explicacao="Média das notas em cada avaliação (de 1 a 5). Linha subindo = aluno evoluindo."
                  acoes={<FaixaBadge faixaId={aluno.faixaId} />}
                >
                  <GraficoEvolucaoNotas dados={doAluno.map((a) => ({ data: a.data, media: Math.round(mediaAvaliacao(a) * 10) / 10 }))} />
                </CartaoGrafico>
                <TabelaAvaliacoes avaliacoes={[...doAluno].reverse()} criterios={dados.criterios} />
              </>
            ) : (
              <EstadoVazio icone={<ClipboardList />} titulo={`${aluno.nome} ainda não foi avaliado(a)`} acao={<Botao onClick={abrirNova}>Fazer a primeira avaliação</Botao>} />
            )
          ) : (
            <Cartao titulo="Avaliações recentes" descricao="As 15 últimas avaliações da escola.">
              {recentes.length ? (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr><th>Data</th><th>Aluno</th><th className="num">Média</th><th>Conceito</th><th>Observações</th></tr></thead>
                    <tbody>
                      {recentes.map((a) => {
                        const media = mediaAvaliacao(a);
                        return (
                          <tr key={a.id}>
                            <td>{formatarData(a.data)}</td>
                            <td><Link to={`?alunoId=${a.alunoId}`} className={p.nomeLink}>{nomeAluno(a.alunoId)}</Link></td>
                            <td className="num"><strong>{media.toFixed(1)}</strong></td>
                            <td>{CONCEITOS[Math.round(media)]}</td>
                            <td>{a.observacoes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EstadoVazio titulo="Nenhuma avaliação registrada" />
              )}
            </Cartao>
          )}
        </div>
      )}

      <Modal
        aberto={!!nova}
        titulo={`Nova avaliação · ${aluno?.nome ?? ''}`}
        onFechar={() => setNova(null)}
        onEnviar={salvar}
        largo
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setNova(null)}>Cancelar</Botao>
            <Botao type="submit" carregando={salvando}>Salvar avaliação</Botao>
          </>
        }
      >
        {nova && dados && (
          <>
            <div style={{ maxWidth: 240 }}>
              <CampoTexto rotulo="Data" type="date" max={hojeISO()} value={nova.data} onChange={(e) => setNova({ ...nova, data: e.target.value })} />
            </div>
            {dados.criterios.map((c) => (
              <fieldset key={c.id} className={s.criterio}>
                <legend>
                  <strong>{c.nome}</strong> <span className="texto-fraco">({c.descricao})</span>
                </legend>
                <div className={s.notas}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className={`${s.nota} ${nova.notas[c.id] === n ? s.notaAtiva : ''}`}>
                      <input
                        type="radio"
                        name={`nota-${c.id}`}
                        value={n}
                        checked={nova.notas[c.id] === n}
                        onChange={() => setNova({ ...nova, notas: { ...nova.notas, [c.id]: n } })}
                        className="visualmente-oculto"
                      />
                      <b>{n}</b>
                      <small>{CONCEITOS[n]}</small>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <CampoArea rotulo="Observações do professor" value={nova.observacoes} onChange={(e) => setNova({ ...nova, observacoes: e.target.value })} />
          </>
        )}
      </Modal>
    </>
  );
}

function TabelaAvaliacoes({
  avaliacoes,
  criterios,
}: {
  avaliacoes: import('../types').Avaliacao[];
  criterios: import('../types').CriterioAvaliacao[];
}) {
  return (
    <Cartao titulo="Histórico de avaliações">
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
            {avaliacoes.map((a) => (
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
    </Cartao>
  );
}
