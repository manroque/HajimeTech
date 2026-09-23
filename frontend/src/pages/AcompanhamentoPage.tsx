/**
 * Acompanhamento técnico: para cada aluno, o nível em cada técnica do
 * currículo (Iniciante, Em desenvolvimento, Domina) e observações.
 */
import { MessageSquare, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Aviso, BarraProgresso, CabecalhoPagina, CampoSelecao, Carregando, Cartao, EstadoVazio, FaixaBadge, MensagemErro, Segmentado } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, curriculoService, tecnicasAlunoService } from '../services';
import type { FaixaId, NivelTecnica, TecnicaAluno } from '../types';
import { FAIXAS, NIVEIS_TECNICA, faixaPorId } from '../utils/formatacao';
import s from './AcompanhamentoPage.module.css';
import p from './paginas.module.css';

type ValorNivel = NivelTecnica | 'nenhum';

const OPCOES: { valor: ValorNivel; rotulo: string }[] = [
  { valor: 'nenhum', rotulo: 'Não iniciou' },
  { valor: 'iniciante', rotulo: NIVEIS_TECNICA.iniciante.rotulo },
  { valor: 'em_desenvolvimento', rotulo: NIVEIS_TECNICA.em_desenvolvimento.rotulo },
  { valor: 'domina', rotulo: NIVEIS_TECNICA.domina.rotulo },
];

export function AcompanhamentoPage() {
  const escola = useEscolaAtual();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const alunoId = params.get('alunoId') ?? '';
  const [faixaId, setFaixaId] = useState<FaixaId | ''>('');
  const [observando, setObservando] = useState<string | null>(null);

  const { dados: alunos } = useCarregar(() => alunosService.listar(escola.id), [escola.id]);
  const aluno = alunos?.find((a) => a.id === alunoId);

  useEffect(() => {
    if (aluno) setFaixaId(aluno.faixaId);
  }, [aluno]);

  const { dados, carregando, erro, recarregar, setDados } = useCarregar(async () => {
    if (!alunoId || !faixaId) return null;
    const [categorias, registros, progresso] = await Promise.all([
      curriculoService.listarPorFaixa(escola.id, faixaId),
      tecnicasAlunoService.listar(escola.id, alunoId),
      tecnicasAlunoService.progresso(escola.id, alunoId),
    ]);
    return { categorias, registros, progresso };
  }, [escola.id, alunoId, faixaId]);

  async function salvar(tecnicaId: string, nivel: NivelTecnica, observacoes: string) {
    try {
      const registro = await tecnicasAlunoService.salvar(escola.id, alunoId, tecnicaId, nivel, observacoes);
      const progresso = await tecnicasAlunoService.progresso(escola.id, alunoId);
      setDados((d) => d && { ...d, progresso, registros: [...d.registros.filter((r) => r.tecnicaId !== tecnicaId), registro] });
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  }

  const registroDe = (tecnicaId: string): TecnicaAluno | undefined => dados?.registros.find((r) => r.tecnicaId === tecnicaId);
  const faixa = faixaId ? faixaPorId(faixaId) : null;

  return (
    <>
      <CabecalhoPagina
        titulo="Acompanhamento técnico"
        descricao="Registre em que nível cada aluno está em cada técnica do currículo. As mudanças são salvas na hora."
      />

      <Cartao>
        <div className={p.formGrade}>
          <CampoSelecao rotulo="Aluno" value={alunoId} onChange={(e) => setParams(e.target.value ? { alunoId: e.target.value } : {}, { replace: true })}>
            <option value="">Selecione o aluno...</option>
            {alunos?.map((a) => <option key={a.id} value={a.id}>{a.nome} - Faixa {faixaPorId(a.faixaId).nome}</option>)}
          </CampoSelecao>
          <CampoSelecao rotulo="Currículo da faixa" value={faixaId} disabled={!aluno} onChange={(e) => setFaixaId(e.target.value as FaixaId)}>
            {FAIXAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}{aluno?.faixaId === f.id ? ' (faixa atual)' : ''}
              </option>
            ))}
          </CampoSelecao>
        </div>
        {aluno && dados?.progresso.conteudoDefinido && dados.progresso.total > 0 && (
          <div style={{ marginTop: 16 }}>
            <BarraProgresso
              valor={dados.progresso.percentual}
              rotulo={`Progresso na faixa atual (${faixaPorId(aluno.faixaId).nome})`}
              detalhe={`Domina ${dados.progresso.domina} de ${dados.progresso.total} técnicas.`}
            />
          </div>
        )}
      </Cartao>

      <div style={{ height: 16 }} />

      {!alunoId && <EstadoVazio icone={<Target />} titulo="Escolha um aluno" descricao="Selecione um aluno acima para ver e atualizar as técnicas." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {alunoId && carregando && !dados && <Carregando />}

      {aluno && dados && faixa && (
        <>
          {!faixa.conteudoDefinido ? (
            <Aviso>Conteúdo ainda não definido pela academia para a faixa {faixa.nome}.</Aviso>
          ) : !dados.categorias.length ? (
            <EstadoVazio titulo="Esta faixa ainda não tem técnicas no currículo" descricao="Cadastre técnicas na tela Currículo." />
          ) : (
            <div className="pilha">
              {dados.categorias.map((c) => (
                <Cartao key={c.id} titulo={c.nome} descricao={c.descricao}>
                  {c.tecnicas.length ? (
                    <ul className={s.lista}>
                      {c.tecnicas.map((t) => {
                        const registro = registroDe(t.id);
                        return (
                          <li key={t.id} className={s.item}>
                            <div className={s.tecnica}>
                              <strong>{t.nome}</strong>
                              <span>{t.descricao}</span>
                            </div>
                            <Segmentado<ValorNivel>
                              rotulo={`Nível de ${aluno.nome} em ${t.nome}`}
                              opcoes={OPCOES}
                              valor={registro?.nivel ?? 'nenhum'}
                              onMudar={(v) => v !== 'nenhum' && salvar(t.id, v, registro?.observacoes ?? '')}
                            />
                            <button
                              className={s.obsBotao}
                              onClick={() => setObservando(observando === t.id ? null : t.id)}
                              aria-expanded={observando === t.id}
                              disabled={!registro}
                              title={registro ? 'Observações' : 'Defina um nível para adicionar observações'}
                            >
                              <MessageSquare size={16} aria-hidden /> {registro?.observacoes ? 'Ver obs.' : 'Obs.'}
                            </button>
                            {observando === t.id && registro && (
                              <textarea
                                className={`campo-input ${s.obs}`}
                                aria-label={`Observações sobre ${t.nome}`}
                                defaultValue={registro.observacoes}
                                placeholder="Ex.: melhorar o desequilíbrio antes da entrada."
                                onBlur={(e) => e.target.value !== registro.observacoes && salvar(t.id, registro.nivel, e.target.value).then(() => toast('Observação salva.'))}
                                autoFocus
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="texto-fraco">Categoria sem técnicas ativas.</p>
                  )}
                </Cartao>
              ))}
              <p className="texto-fraco">
                Veja o resumo completo no <Link to={`/alunos/${aluno.id}`}>perfil de {aluno.nome}</Link>. Faixa atual: <FaixaBadge faixaId={aluno.faixaId} />
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
