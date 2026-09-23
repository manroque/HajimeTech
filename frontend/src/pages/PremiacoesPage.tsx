/** Premiações: tipos de premiação da escola e concessões aos alunos. */
import { Award, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconePremiacao } from '../components/IconePremiacao';
import { Botao, CabecalhoPagina, CampoArea, CampoSelecao, CampoTexto, Carregando, Cartao, Confirmacao, EstadoVazio, Etiqueta, MensagemErro, Modal } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, premiacoesService, type ConcessaoInput, type PremiacaoInput } from '../services';
import type { PremiacaoAluno, TipoPremiacao } from '../types';
import { TIPOS_PREMIACAO, formatarData, hojeISO } from '../utils/formatacao';
import p from './paginas.module.css';

export function PremiacoesPage() {
  const escola = useEscolaAtual();
  const toast = useToast();

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [premiacoes, concedidas, alunos] = await Promise.all([
      premiacoesService.listar(escola.id, true),
      premiacoesService.listarConcedidas(escola.id),
      alunosService.listar(escola.id, { incluirInativos: true }),
    ]);
    return { premiacoes, concedidas, alunos };
  }, [escola.id]);

  const [tipo, setTipo] = useState<{ id: string | null; dados: PremiacaoInput } | null>(null);
  const [concessao, setConcessao] = useState<ConcessaoInput | null>(null);
  const [remover, setRemover] = useState<PremiacaoAluno | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function executar(acao: () => Promise<unknown>, mensagem: string) {
    setSalvando(true);
    try {
      await acao();
      toast(mensagem);
      await recarregar();
      return true;
    } catch (e) {
      toast((e as Error).message, 'erro');
      return false;
    } finally {
      setSalvando(false);
    }
  }

  const ativas = dados?.premiacoes.filter((x) => x.ativo) ?? [];
  const premiacao = (id: string) => dados?.premiacoes.find((x) => x.id === id);
  const aluno = (id: string) => dados?.alunos.find((a) => a.id === id);

  return (
    <>
      <CabecalhoPagina
        titulo="Premiações"
        descricao="Reconheça os alunos: destaque do mês, maior frequência, campeonatos e evolução. As premiações aparecem no perfil do aluno e no painel."
        acoes={
          <Botao
            variante="destaque"
            icone={<Award size={18} />}
            disabled={!ativas.length}
            onClick={() => setConcessao({ premiacaoId: ativas[0]?.id ?? '', alunoId: '', data: hojeISO(), descricao: '' })}
          >
            Conceder premiação
          </Botao>
        }
      />

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !dados && <Carregando />}

      {dados && (
        <div className="pilha">
          <Cartao titulo="Premiações concedidas" descricao="Da mais recente para a mais antiga.">
            {dados.concedidas.length ? (
              <ul className={p.lista}>
                {dados.concedidas.map((c) => {
                  const pr = premiacao(c.premiacaoId);
                  return (
                    <li key={c.id}>
                      <IconePremiacao tipo={pr?.tipo ?? 'outro'} />
                      <span className={p.listaTexto}>
                        <strong>
                          <Link to={`/alunos/${c.alunoId}`} className={p.nomeLink}>{aluno(c.alunoId)?.nome ?? 'Aluno'}</Link> · {pr?.nome}
                        </strong>
                        <span>{c.descricao || '-'} · {formatarData(c.data)}</span>
                      </span>
                      <Botao variante="fantasma" somenteIcone icone={<Trash2 size={18} />} aria-label="Remover premiação concedida" title="Remover (lançada por engano)" onClick={() => setRemover(c)} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EstadoVazio icone={<Award />} titulo="Nenhuma premiação concedida ainda" />
            )}
          </Cartao>

          <Cartao
            titulo="Tipos de premiação"
            descricao="Os reconhecimentos que a escola oferece."
            acoes={
              <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />} onClick={() => setTipo({ id: null, dados: { nome: '', descricao: '', tipo: 'outro' } })}>
                Novo tipo
              </Botao>
            }
          >
            <div className={p.gradeCartoes}>
              {dados.premiacoes.map((pr) => (
                <div key={pr.id} className={`${p.cartaoEscola} ${pr.ativo ? '' : p.inativo}`} style={{ border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-md)', padding: 14 }}>
                  <div className="linha">
                    <IconePremiacao tipo={pr.tipo} tamanho={36} />
                    <strong style={{ flex: 1 }}>{pr.nome}</strong>
                    {!pr.ativo && <Etiqueta>Inativa</Etiqueta>}
                  </div>
                  <p className="texto-fraco">{pr.descricao}</p>
                  <div className="linha">
                    <Etiqueta tom="info">{TIPOS_PREMIACAO[pr.tipo]}</Etiqueta>
                    <span className="texto-fraco">{dados.concedidas.filter((c) => c.premiacaoId === pr.id).length} concedida(s)</span>
                  </div>
                  <div className={p.rodapeCartao}>
                    <Botao variante="fantasma" tamanho="sm" icone={<Pencil size={14} />} onClick={() => setTipo({ id: pr.id, dados: { nome: pr.nome, descricao: pr.descricao, tipo: pr.tipo } })}>Editar</Botao>
                    <Botao
                      variante="fantasma"
                      tamanho="sm"
                      icone={<Power size={14} />}
                      onClick={() => executar(() => premiacoesService.definirAtivo(escola.id, pr.id, !pr.ativo), pr.ativo ? 'Premiação desativada.' : 'Premiação reativada.')}
                    >
                      {pr.ativo ? 'Desativar' : 'Reativar'}
                    </Botao>
                  </div>
                </div>
              ))}
            </div>
          </Cartao>
        </div>
      )}

      <Modal
        aberto={!!concessao}
        titulo="Conceder premiação"
        onFechar={() => setConcessao(null)}
        onEnviar={async () => {
          if (!concessao?.alunoId) return toast('Escolha o aluno.', 'erro');
          if (await executar(() => premiacoesService.conceder(escola.id, concessao), 'Premiação concedida.')) setConcessao(null);
        }}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setConcessao(null)}>Cancelar</Botao>
            <Botao type="submit" variante="destaque" carregando={salvando}>Conceder</Botao>
          </>
        }
      >
        {concessao && dados && (
          <>
            <CampoSelecao rotulo="Premiação" obrigatorio value={concessao.premiacaoId} onChange={(e) => setConcessao({ ...concessao, premiacaoId: e.target.value })}>
              {ativas.map((pr) => <option key={pr.id} value={pr.id}>{pr.nome}</option>)}
            </CampoSelecao>
            <CampoSelecao rotulo="Aluno" obrigatorio value={concessao.alunoId} onChange={(e) => setConcessao({ ...concessao, alunoId: e.target.value })}>
              <option value="">Selecione...</option>
              {dados.alunos.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </CampoSelecao>
            <CampoTexto rotulo="Data" type="date" max={hojeISO()} value={concessao.data} onChange={(e) => setConcessao({ ...concessao, data: e.target.value })} />
            <CampoArea rotulo="Descrição" placeholder="Ex.: Ouro na Copa Regional (sub-13)." value={concessao.descricao} onChange={(e) => setConcessao({ ...concessao, descricao: e.target.value })} />
          </>
        )}
      </Modal>

      <Modal
        aberto={!!tipo}
        titulo={tipo?.id ? 'Editar tipo de premiação' : 'Novo tipo de premiação'}
        onFechar={() => setTipo(null)}
        onEnviar={async () => {
          if (!tipo) return;
          if (!tipo.dados.nome.trim()) return toast('Informe o nome.', 'erro');
          const ok = await executar(
            () => (tipo.id ? premiacoesService.atualizar(escola.id, tipo.id, tipo.dados) : premiacoesService.criar(escola.id, tipo.dados)),
            tipo.id ? 'Premiação atualizada.' : 'Tipo de premiação criado.',
          );
          if (ok) setTipo(null);
        }}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setTipo(null)}>Cancelar</Botao>
            <Botao type="submit" carregando={salvando}>Salvar</Botao>
          </>
        }
      >
        {tipo && (
          <>
            <CampoTexto rotulo="Nome" obrigatorio autoFocus value={tipo.dados.nome} onChange={(e) => setTipo({ ...tipo, dados: { ...tipo.dados, nome: e.target.value } })} />
            <CampoSelecao rotulo="Categoria" value={tipo.dados.tipo} onChange={(e) => setTipo({ ...tipo, dados: { ...tipo.dados, tipo: e.target.value as TipoPremiacao } })}>
              {Object.entries(TIPOS_PREMIACAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </CampoSelecao>
            <CampoArea rotulo="Descrição" value={tipo.dados.descricao} onChange={(e) => setTipo({ ...tipo, dados: { ...tipo.dados, descricao: e.target.value } })} />
          </>
        )}
      </Modal>

      <Confirmacao
        aberto={!!remover}
        titulo="Remover premiação concedida?"
        mensagem="Use esta opção apenas se a premiação foi lançada por engano. O tipo de premiação continua existindo."
        rotuloConfirmar="Remover"
        carregando={salvando}
        onCancelar={() => setRemover(null)}
        onConfirmar={async () => {
          if (await executar(() => premiacoesService.removerConcessao(escola.id, remover!.id), 'Premiação removida.')) setRemover(null);
        }}
      />
    </>
  );
}
