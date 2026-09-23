/** Registro de graduações (troca de faixa) e histórico. */
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Aviso, Botao, CabecalhoPagina, CampoArea, CampoSelecao, CampoTexto, Carregando, Cartao, EstadoVazio, FaixaBadge, MensagemErro } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, graduacoesService, tecnicasAlunoService } from '../services';
import type { FaixaId } from '../types';
import { FAIXAS, faixaPorId, formatarData, hojeISO, proximaFaixa } from '../utils/formatacao';
import p from './paginas.module.css';

export function GraduacoesPage() {
  const escola = useEscolaAtual();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const alunoId = params.get('alunoId') ?? '';

  const [novaFaixaId, setNovaFaixaId] = useState<FaixaId | ''>('');
  const [data, setData] = useState(hojeISO());
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [filtroHistorico, setFiltroHistorico] = useState('');

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [alunos, graduacoes] = await Promise.all([alunosService.listar(escola.id, { incluirInativos: true }), graduacoesService.listar(escola.id)]);
    return { alunos, graduacoes };
  }, [escola.id]);

  const aluno = dados?.alunos.find((a) => a.id === alunoId);
  const { dados: progresso } = useCarregar(
    async () => (alunoId ? tecnicasAlunoService.progresso(escola.id, alunoId) : null),
    [escola.id, alunoId, dados],
  );

  // Sugere a próxima faixa da progressão.
  useEffect(() => {
    setNovaFaixaId(aluno ? proximaFaixa(aluno.faixaId)?.id ?? '' : '');
  }, [aluno]);

  const opcoesFaixa = useMemo(() => (aluno ? FAIXAS.filter((f) => f.ordem > faixaPorId(aluno.faixaId).ordem) : []), [aluno]);
  const nomeAluno = (id: string) => dados?.alunos.find((a) => a.id === id)?.nome ?? '-';
  const historico = dados?.graduacoes.filter((g) => !filtroHistorico || g.alunoId === filtroHistorico) ?? [];

  async function registrar() {
    if (!aluno || !novaFaixaId) return;
    setSalvando(true);
    try {
      await graduacoesService.registrar(escola.id, { alunoId: aluno.id, novaFaixaId, data, observacoes });
      toast(`Parabéns! ${aluno.nome} agora é faixa ${faixaPorId(novaFaixaId).nome}.`);
      setObservacoes('');
      setFiltroHistorico(aluno.id);
      // Limpa a seleção para evitar registrar a mesma graduação duas vezes.
      setParams({}, { replace: true });
      await recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Graduações" descricao="Registre a troca de faixa. A faixa atual do aluno é atualizada automaticamente." />

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !dados && <Carregando />}

      {dados && (
        <div className="pilha">
          <Cartao titulo="Registrar graduação">
            <form
              className={p.formGrade}
              onSubmit={(e) => {
                e.preventDefault();
                void registrar();
              }}
            >
              <CampoSelecao
                rotulo="Aluno"
                obrigatorio
                value={alunoId}
                onChange={(e) => setParams(e.target.value ? { alunoId: e.target.value } : {}, { replace: true })}
              >
                <option value="">Selecione o aluno...</option>
                {dados.alunos.filter((a) => a.ativo).map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} - Faixa {faixaPorId(a.faixaId).nome}</option>
                ))}
              </CampoSelecao>
              <CampoTexto rotulo="Data da graduação" type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} obrigatorio />

              {aluno && (
                <>
                  <div className={p.inteiro}>
                    <div className="linha" style={{ gap: 12 }}>
                      <span className="texto-fraco">Faixa anterior</span>
                      <FaixaBadge faixaId={aluno.faixaId} />
                      <ArrowRight size={18} aria-hidden />
                      {novaFaixaId ? <FaixaBadge faixaId={novaFaixaId} /> : <span className="texto-fraco">-</span>}
                    </div>
                  </div>
                  {opcoesFaixa.length ? (
                    <CampoSelecao rotulo="Nova faixa" obrigatorio value={novaFaixaId} onChange={(e) => setNovaFaixaId(e.target.value as FaixaId)}>
                      {opcoesFaixa.map((f) => <option key={f.id} value={f.id}>Faixa {f.nome}</option>)}
                    </CampoSelecao>
                  ) : (
                    <Aviso>{aluno.nome} já está na faixa mais alta da progressão.</Aviso>
                  )}
                  <div>
                    {progresso?.conteudoDefinido && progresso.total > 0 && (
                      <Aviso>
                        Currículo da faixa {faixaPorId(aluno.faixaId).nome}: domina <strong>{progresso.domina} de {progresso.total}</strong> técnicas ({progresso.percentual}%).
                        {progresso.percentual < 100 && ' Confira se os conhecimentos definidos pela academia foram cumpridos.'}
                      </Aviso>
                    )}
                  </div>
                  <div className={p.inteiro}>
                    <CampoArea rotulo="Observações" placeholder="Ex.: exame realizado com banca de 3 professores." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                  </div>
                </>
              )}
              <div className={p.inteiro}>
                <Botao type="submit" variante="destaque" icone={<GraduationCap size={18} />} carregando={salvando} disabled={!aluno || !novaFaixaId}>
                  Registrar graduação
                </Botao>
              </div>
            </form>
          </Cartao>

          <Cartao
            titulo="Histórico de graduações"
            descricao="Todas as trocas de faixa registradas na escola, da mais recente para a mais antiga."
            acoes={
              <select className="campo-input" aria-label="Filtrar histórico por aluno" value={filtroHistorico} onChange={(e) => setFiltroHistorico(e.target.value)} style={{ maxWidth: 240 }}>
                <option value="">Todos os alunos</option>
                {dados.alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            }
          >
            {historico.length ? (
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead><tr><th>Data</th><th>Aluno</th><th>Faixa anterior</th><th>Nova faixa</th><th>Observações</th></tr></thead>
                  <tbody>
                    {historico.map((g) => (
                      <tr key={g.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatarData(g.data)}</td>
                        <td><Link to={`/alunos/${g.alunoId}`} className={p.nomeLink}>{nomeAluno(g.alunoId)}</Link></td>
                        <td><FaixaBadge faixaId={g.faixaAnteriorId} /></td>
                        <td><FaixaBadge faixaId={g.novaFaixaId} /></td>
                        <td>{g.observacoes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EstadoVazio icone={<GraduationCap />} titulo="Nenhuma graduação registrada" />
            )}
          </Cartao>
        </div>
      )}
    </>
  );
}
