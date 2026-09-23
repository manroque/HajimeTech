/** Lista, cadastro, edição e desativação (soft delete) de alunos. */
import { Pencil, Plus, RotateCcw, UserMinus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Botao,
  CabecalhoPagina,
  CampoArea,
  CampoBusca,
  CampoSelecao,
  CampoTexto,
  Carregando,
  Confirmacao,
  EstadoVazio,
  Etiqueta,
  FaixaBadge,
  MensagemErro,
  Modal,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, turmasService } from '../services';
import type { Aluno, AlunoInput, FaixaId } from '../types';
import { FAIXAS, hojeISO, idade } from '../utils/formatacao';
import s from './paginas.module.css';

const VAZIO: AlunoInput = {
  nome: '',
  dataNascimento: '',
  turmaId: null,
  faixaId: 'branca',
  telefone: '',
  responsavel: '',
  observacoes: '',
  dataIngresso: hojeISO(),
};

export function AlunosPage() {
  const escola = useEscolaAtual();
  const { pode } = useAuth();
  const toast = useToast();
  const podeEditar = pode('gerenciarAlunos');

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [faixaId, setFaixaId] = useState('');
  const [incluirInativos, setIncluirInativos] = useState(false);

  // Espera o usuário parar de digitar antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 250);
    return () => clearTimeout(t);
  }, [busca]);

  const { dados: turmas } = useCarregar(() => turmasService.listar(escola.id), [escola.id]);
  const { dados: alunos, carregando, erro, recarregar } = useCarregar(
    () =>
      alunosService.listar(escola.id, {
        busca: buscaAplicada,
        turmaId: turmaId || null,
        faixaId: (faixaId || null) as FaixaId | null,
        incluirInativos,
      }),
    [escola.id, buscaAplicada, turmaId, faixaId, incluirInativos],
  );

  const [edicao, setEdicao] = useState<{ id: string | null; dados: AlunoInput } | null>(null);
  const [erroNome, setErroNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [desativar, setDesativar] = useState<Aluno | null>(null);

  const nomeTurma = (id: string | null) => turmas?.find((t) => t.id === id)?.nome ?? 'Sem turma';

  async function salvar() {
    if (!edicao) return;
    if (!edicao.dados.nome.trim()) return setErroNome('Informe o nome do aluno.');
    setSalvando(true);
    try {
      if (edicao.id) {
        const { faixaId: _faixa, ...dados } = edicao.dados;
        await alunosService.atualizar(escola.id, edicao.id, dados);
      } else {
        await alunosService.criar(escola.id, edicao.dados);
      }
      toast(edicao.id ? 'Dados do aluno atualizados.' : 'Aluno cadastrado com sucesso.');
      setEdicao(null);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesativacao() {
    if (!desativar) return;
    setSalvando(true);
    try {
      await alunosService.definirAtivo(escola.id, desativar.id, false);
      toast(`${desativar.nome} foi desativado(a). O histórico foi mantido.`);
      setDesativar(null);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function reativar(aluno: Aluno) {
    try {
      await alunosService.definirAtivo(escola.id, aluno.id, true);
      toast(`${aluno.nome} foi reativado(a).`);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  }

  function abrir(aluno?: Aluno) {
    setErroNome('');
    setEdicao(aluno ? { id: aluno.id, dados: { ...aluno } } : { id: null, dados: { ...VAZIO, turmaId: turmaId || null } });
  }

  const alterar = <K extends keyof AlunoInput>(chave: K, valor: AlunoInput[K]) =>
    setEdicao((atual) => atual && { ...atual, dados: { ...atual.dados, [chave]: valor } });

  return (
    <>
      <CabecalhoPagina
        titulo="Alunos"
        descricao="Cadastre e acompanhe os alunos da escola. Clique no nome para ver o perfil completo."
        acoes={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => abrir()}>Novo aluno</Botao>}
      />

      <div className={s.barraFiltros}>
        <CampoBusca rotulo="Buscar aluno pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className="campo-input" aria-label="Filtrar por turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Todas as turmas</option>
          {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select className="campo-input" aria-label="Filtrar por faixa" value={faixaId} onChange={(e) => setFaixaId(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Todas as faixas</option>
          {FAIXAS.map((f) => <option key={f.id} value={f.id}>Faixa {f.nome}</option>)}
        </select>
        <label className="linha" style={{ minWidth: 0, fontSize: 'var(--texto-sm)', fontWeight: 500 }}>
          <input type="checkbox" checked={incluirInativos} onChange={(e) => setIncluirInativos(e.target.checked)} />
          Mostrar desativados
        </label>
      </div>

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !alunos && <Carregando />}

      {alunos && !alunos.length && (
        <EstadoVazio
          icone={<Users />}
          titulo={busca || turmaId || faixaId ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          descricao={busca || turmaId || faixaId ? 'Tente mudar a busca ou os filtros.' : 'Comece cadastrando o primeiro aluno.'}
        />
      )}

      {alunos && alunos.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <caption className="visualmente-oculto">Lista de alunos</caption>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Faixa</th>
                <th>Turma</th>
                <th className="num">Idade</th>
                <th>Telefone</th>
                <th>Situação</th>
                {podeEditar && <th><span className="visualmente-oculto">Ações</span></th>}
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id} className={a.ativo ? '' : s.inativo}>
                  <td><Link to={`/alunos/${a.id}`} className={s.nomeLink}>{a.nome}</Link></td>
                  <td><FaixaBadge faixaId={a.faixaId} /></td>
                  <td>{nomeTurma(a.turmaId)}</td>
                  <td className="num">{a.dataNascimento ? `${idade(a.dataNascimento)} anos` : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.telefone || '-'}</td>
                  <td>{a.ativo ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta>Desativado</Etiqueta>}</td>
                  {podeEditar && (
                    <td>
                      <div className={s.acoesLinha}>
                        <Botao variante="fantasma" somenteIcone icone={<Pencil size={18} />} aria-label={`Editar ${a.nome}`} title="Editar" onClick={() => abrir(a)} />
                        {a.ativo ? (
                          <Botao variante="fantasma" somenteIcone icone={<UserMinus size={18} />} aria-label={`Excluir ${a.nome}`} title="Excluir (desativar)" onClick={() => setDesativar(a)} />
                        ) : (
                          <Botao variante="fantasma" somenteIcone icone={<RotateCcw size={18} />} aria-label={`Reativar ${a.nome}`} title="Reativar" onClick={() => reativar(a)} />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {alunos && alunos.length > 0 && <p className="texto-fraco" style={{ marginTop: 8 }}>{alunos.length} aluno(s) listado(s)</p>}

      <Modal
        aberto={!!edicao}
        titulo={edicao?.id ? 'Editar aluno' : 'Novo aluno'}
        onFechar={() => setEdicao(null)}
        onEnviar={salvar}
        largo
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEdicao(null)}>Cancelar</Botao>
            <Botao type="submit" carregando={salvando}>Salvar</Botao>
          </>
        }
      >
        {edicao && (
          <div className={s.formGrade}>
            <div className={s.inteiro}>
              <CampoTexto rotulo="Nome completo" obrigatorio autoFocus erro={erroNome} value={edicao.dados.nome} onChange={(e) => alterar('nome', e.target.value)} />
            </div>
            <CampoTexto rotulo="Data de nascimento" type="date" max={hojeISO()} value={edicao.dados.dataNascimento} onChange={(e) => alterar('dataNascimento', e.target.value)} />
            <CampoTexto rotulo="Telefone" type="tel" placeholder="(21) 90000-0000" value={edicao.dados.telefone} onChange={(e) => alterar('telefone', e.target.value)} />
            <CampoSelecao rotulo="Turma" value={edicao.dados.turmaId ?? ''} onChange={(e) => alterar('turmaId', e.target.value || null)}>
              <option value="">Sem turma</option>
              {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </CampoSelecao>
            {edicao.id ? (
              <CampoTexto
                rotulo="Faixa atual"
                value={`Faixa ${FAIXAS.find((f) => f.id === edicao.dados.faixaId)?.nome}`}
                disabled
                dica="Para mudar a faixa, registre uma graduação."
              />
            ) : (
              <CampoSelecao rotulo="Faixa atual" value={edicao.dados.faixaId} onChange={(e) => alterar('faixaId', e.target.value as FaixaId)}>
                {FAIXAS.map((f) => <option key={f.id} value={f.id}>Faixa {f.nome}</option>)}
              </CampoSelecao>
            )}
            <CampoTexto rotulo="Responsável" dica="Obrigatório para menores de idade." value={edicao.dados.responsavel} onChange={(e) => alterar('responsavel', e.target.value)} />
            <CampoTexto rotulo="Data de ingresso" type="date" value={edicao.dados.dataIngresso} onChange={(e) => alterar('dataIngresso', e.target.value)} />
            <div className={s.inteiro}>
              <CampoArea rotulo="Observações" placeholder="Ex.: alergias, restrições médicas, objetivos..." value={edicao.dados.observacoes} onChange={(e) => alterar('observacoes', e.target.value)} />
            </div>
            <p className="texto-fraco">Escola: {escola.nome}</p>
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={!!desativar}
        titulo="Excluir aluno?"
        mensagem={
          <>
            <strong>{desativar?.nome}</strong> deixará de aparecer nas listas, mas <strong>nada será apagado</strong>: frequência,
            graduações e avaliações continuam guardadas. Você pode reativar o cadastro depois em “Mostrar desativados”.
          </>
        }
        rotuloConfirmar="Excluir (desativar)"
        onConfirmar={confirmarDesativacao}
        onCancelar={() => setDesativar(null)}
        carregando={salvando}
      />
    </>
  );
}
