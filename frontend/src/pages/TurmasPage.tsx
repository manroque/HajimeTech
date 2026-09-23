/** Cadastro de turmas, com horários e faixa etária. */
import { Clock, Pencil, Plus, Power, Trash2, UserRound, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Botao, CabecalhoPagina, CampoSelecao, CampoTexto, Carregando, Cartao, EstadoVazio, Etiqueta, MensagemErro, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { alunosService, turmasService, usuariosService, type TurmaInput } from '../services';
import type { DiaSemana, Turma } from '../types';
import { DIAS_SEMANA, faixaEtaria } from '../utils/formatacao';
import s from './paginas.module.css';

const VAZIA: TurmaInput = { nome: '', idadeMinima: 6, idadeMaxima: 12, professorId: null, horarios: [{ diaSemana: 1, horaInicio: '18:00', horaFim: '19:00' }] };

export function TurmasPage() {
  const escola = useEscolaAtual();
  const { pode } = useAuth();
  const toast = useToast();
  const podeEditar = pode('gerenciarTurmas');

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [turmas, alunos, professores] = await Promise.all([
      turmasService.listar(escola.id, true),
      alunosService.listar(escola.id),
      usuariosService.listarProfessores(escola.id),
    ]);
    return { turmas, alunos, professores };
  }, [escola.id]);

  const [edicao, setEdicao] = useState<{ id: string | null; dados: TurmaInput } | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!edicao) return;
    const d = edicao.dados;
    if (!d.nome.trim()) return toast('Informe o nome da turma.', 'erro');
    if (d.idadeMaxima != null && d.idadeMaxima < d.idadeMinima) return toast('A idade máxima deve ser maior que a mínima.', 'erro');
    if (d.horarios.some((h) => h.horaFim <= h.horaInicio)) return toast('Em cada horário, o fim deve ser depois do início.', 'erro');
    setSalvando(true);
    try {
      if (edicao.id) await turmasService.atualizar(escola.id, edicao.id, d);
      else await turmasService.criar(escola.id, d);
      toast(edicao.id ? 'Turma atualizada.' : 'Turma criada.');
      setEdicao(null);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function alternar(turma: Turma) {
    try {
      await turmasService.definirAtivo(escola.id, turma.id, !turma.ativo);
      toast(turma.ativo ? 'Turma desativada.' : 'Turma reativada.');
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  }

  const alterar = (parcial: Partial<TurmaInput>) => setEdicao((a) => a && { ...a, dados: { ...a.dados, ...parcial } });
  const alterarHorario = (i: number, parcial: Partial<TurmaInput['horarios'][number]>) =>
    edicao && alterar({ horarios: edicao.dados.horarios.map((h, j) => (i === j ? { ...h, ...parcial } : h)) });

  return (
    <>
      <CabecalhoPagina
        titulo="Turmas"
        descricao="Organize os alunos por turma, com dias, horários e faixa etária."
        acoes={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => setEdicao({ id: null, dados: VAZIA })}>Nova turma</Botao>}
      />

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !dados && <Carregando />}
      {dados && !dados.turmas.length && <EstadoVazio icone={<UsersRound />} titulo="Nenhuma turma cadastrada" />}

      <div className={s.gradeCartoes}>
        {dados?.turmas.map((t) => {
          const total = dados.alunos.filter((a) => a.turmaId === t.id).length;
          const professor = dados.professores.find((p) => p.id === t.professorId);
          return (
            <Cartao key={t.id} as="article" className={`${s.cartaoEscola} ${t.ativo ? '' : s.inativo}`}>
              <div className="linha" style={{ justifyContent: 'space-between' }}>
                <h2>{t.nome}</h2>
                {t.ativo ? <Etiqueta tom="info">{faixaEtaria(t)}</Etiqueta> : <Etiqueta>Inativa</Etiqueta>}
              </div>
              <ul className={s.lista}>
                {[...t.horarios].sort((a, b) => a.diaSemana - b.diaSemana).map((h) => (
                  <li key={h.id} style={{ padding: '6px 0' }}>
                    <Clock size={16} aria-hidden className="texto-fraco" />
                    <span style={{ flex: 1 }}>{DIAS_SEMANA[h.diaSemana].longo}</span>
                    <strong style={{ fontSize: 'var(--texto-sm)' }}>{h.horaInicio} às {h.horaFim}</strong>
                  </li>
                ))}
              </ul>
              <div className="texto-fraco linha"><UserRound size={14} aria-hidden /> {professor?.nome ?? 'Sem professor definido'}</div>
              <div className={s.metricas}>
                <div className={s.metrica}><strong>{total}</strong><span>alunos ativos</span></div>
              </div>
              {podeEditar && (
                <div className={s.rodapeCartao}>
                  <Botao variante="secundario" tamanho="sm" icone={<Pencil size={16} />} onClick={() => setEdicao({ id: t.id, dados: { ...t } })}>
                    Editar
                  </Botao>
                  <Botao variante="fantasma" tamanho="sm" icone={<Power size={16} />} onClick={() => alternar(t)}>
                    {t.ativo ? 'Desativar' : 'Reativar'}
                  </Botao>
                </div>
              )}
            </Cartao>
          );
        })}
      </div>

      <Modal
        aberto={!!edicao}
        titulo={edicao?.id ? 'Editar turma' : 'Nova turma'}
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
          <>
            <div className={s.formGrade}>
              <CampoTexto rotulo="Nome da turma" obrigatorio autoFocus placeholder="Ex.: Infantil" value={edicao.dados.nome} onChange={(e) => alterar({ nome: e.target.value })} />
              <CampoSelecao rotulo="Professor responsável" value={edicao.dados.professorId ?? ''} onChange={(e) => alterar({ professorId: e.target.value || null })}>
                <option value="">Sem professor</option>
                {dados?.professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </CampoSelecao>
              <CampoTexto rotulo="Idade mínima" type="number" min={0} max={99} value={edicao.dados.idadeMinima} onChange={(e) => alterar({ idadeMinima: Number(e.target.value) })} />
              <CampoTexto
                rotulo="Idade máxima"
                type="number"
                min={0}
                max={99}
                dica="Deixe em branco para “sem limite”."
                value={edicao.dados.idadeMaxima ?? ''}
                onChange={(e) => alterar({ idadeMaxima: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="pilha">
              <legend style={{ fontWeight: 600, marginBottom: 8 }}>Horários</legend>
              {edicao.dados.horarios.map((h, i) => (
                <div key={i} className="linha" style={{ alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <CampoSelecao rotulo="Dia" value={h.diaSemana} onChange={(e) => alterarHorario(i, { diaSemana: Number(e.target.value) as DiaSemana })}>
                      {Object.entries(DIAS_SEMANA).map(([v, d]) => <option key={v} value={v}>{d.longo}</option>)}
                    </CampoSelecao>
                  </div>
                  <div style={{ flex: '1 1 110px' }}>
                    <CampoTexto rotulo="Início" type="time" value={h.horaInicio} onChange={(e) => alterarHorario(i, { horaInicio: e.target.value })} />
                  </div>
                  <div style={{ flex: '1 1 110px' }}>
                    <CampoTexto rotulo="Fim" type="time" value={h.horaFim} onChange={(e) => alterarHorario(i, { horaFim: e.target.value })} />
                  </div>
                  <Botao
                    variante="fantasma"
                    somenteIcone
                    icone={<Trash2 size={18} />}
                    aria-label="Remover horário"
                    disabled={edicao.dados.horarios.length === 1}
                    onClick={() => alterar({ horarios: edicao.dados.horarios.filter((_, j) => j !== i) })}
                  />
                </div>
              ))}
              <div>
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  icone={<Plus size={16} />}
                  onClick={() => alterar({ horarios: [...edicao.dados.horarios, { diaSemana: 3, horaInicio: '18:00', horaFim: '19:00' }] })}
                >
                  Adicionar horário
                </Botao>
              </div>
            </fieldset>
          </>
        )}
      </Modal>
    </>
  );
}
