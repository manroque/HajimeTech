/** Chamada: presença e ausência por turma e data. */
import { CalendarCheck, Check, CheckCheck, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Aviso, Botao, CabecalhoPagina, CampoSelecao, CampoTexto, Carregando, Cartao, EstadoVazio, FaixaBadge, MensagemErro } from '../components/ui';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { frequenciaService, turmasService } from '../services';
import { formatarDataExtensa, hojeISO } from '../utils/formatacao';
import { deISO } from '../mocks/utils';
import s from './FrequenciaPage.module.css';

export function FrequenciaPage() {
  const escola = useEscolaAtual();
  const toast = useToast();
  const [turmaId, setTurmaId] = useState('');
  const [data, setData] = useState(hojeISO());
  const [marcacoes, setMarcacoes] = useState<Record<string, boolean | null>>({});
  const [salvando, setSalvando] = useState(false);

  const { dados: turmas } = useCarregar(() => turmasService.listar(escola.id), [escola.id]);
  useEffect(() => {
    if (turmas?.length && !turmas.some((t) => t.id === turmaId)) setTurmaId(turmas[0].id);
  }, [turmas, turmaId]);

  const { dados: chamada, carregando, erro, recarregar } = useCarregar(
    async () => (turmaId ? frequenciaService.chamada(escola.id, turmaId, data) : []),
    [escola.id, turmaId, data],
  );

  useEffect(() => {
    setMarcacoes(Object.fromEntries((chamada ?? []).map((l) => [l.alunoId, l.presente])));
  }, [chamada]);

  const turma = turmas?.find((t) => t.id === turmaId);
  const diaDaSemana = deISO(data).getDay();
  const diaDeAula = !turma || turma.horarios.some((h) => h.diaSemana === diaDaSemana);
  const jaRegistrada = chamada?.some((l) => l.presente !== null);
  const valores = Object.values(marcacoes);
  const presentes = valores.filter((v) => v === true).length;
  const ausentes = valores.filter((v) => v === false).length;
  const pendentes = valores.filter((v) => v === null).length;

  async function salvar() {
    const registros = Object.entries(marcacoes)
      .filter((e): e is [string, boolean] => e[1] !== null)
      .map(([alunoId, presente]) => ({ alunoId, presente }));
    if (!registros.length) return toast('Marque a presença de pelo menos um aluno.', 'erro');
    setSalvando(true);
    try {
      await frequenciaService.registrar(escola.id, turmaId, data, registros);
      toast(`Chamada salva: ${presentes} presente(s), ${ausentes} ausente(s).`);
      void recarregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  const marcarTodos = (valor: boolean) => setMarcacoes((m) => Object.fromEntries(Object.keys(m).map((k) => [k, valor])));

  return (
    <>
      <CabecalhoPagina titulo="Frequência" descricao="Escolha a turma e a data, marque quem veio treinar e salve a chamada." />

      <Cartao>
        <div className={s.filtros}>
          <CampoSelecao rotulo="Turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </CampoSelecao>
          <CampoTexto rotulo="Data da aula" type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value || hojeISO())} />
        </div>
        <p className={s.dataExtensa}>{formatarDataExtensa(data)}</p>
        {!diaDeAula && <Aviso>A turma {turma?.nome} normalmente não tem aula neste dia da semana. Você ainda pode registrar a chamada, se houve aula extra.</Aviso>}
        {jaRegistrada && <p className="texto-fraco" style={{ marginTop: 8 }}>A chamada desta data já foi registrada. Você pode corrigir e salvar de novo.</p>}
      </Cartao>

      <div style={{ height: 16 }} />

      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {carregando && !chamada && <Carregando />}
      {chamada && !chamada.length && (
        <EstadoVazio icone={<CalendarCheck />} titulo="Nenhum aluno ativo nesta turma" descricao="Associe alunos à turma na tela de Alunos." />
      )}

      {chamada && chamada.length > 0 && (
        <Cartao
          titulo={`Chamada · ${turma?.nome ?? ''}`}
          descricao={`${presentes} presente(s) · ${ausentes} ausente(s)${pendentes ? ` · ${pendentes} sem marcação` : ''}`}
          acoes={
            <div className="linha nao-imprimir">
              <Botao variante="secundario" tamanho="sm" icone={<CheckCheck size={16} />} onClick={() => marcarTodos(true)}>Todos presentes</Botao>
            </div>
          }
        >
          <ul className={s.lista}>
            {chamada.map((l) => {
              const v = marcacoes[l.alunoId];
              return (
                <li key={l.alunoId} className={v === true ? s.linhaPresente : v === false ? s.linhaAusente : ''}>
                  <span className={s.nome}>
                    <strong>{l.nome}</strong>
                    <FaixaBadge faixaId={l.faixaId} />
                  </span>
                  <div className={s.opcoes} role="radiogroup" aria-label={`Presença de ${l.nome}`}>
                    <button
                      role="radio"
                      aria-checked={v === true}
                      className={`${s.opcao} ${v === true ? s.presente : ''}`}
                      onClick={() => setMarcacoes((m) => ({ ...m, [l.alunoId]: true }))}
                    >
                      <Check size={18} aria-hidden /> Presente
                    </button>
                    <button
                      role="radio"
                      aria-checked={v === false}
                      className={`${s.opcao} ${v === false ? s.ausente : ''}`}
                      onClick={() => setMarcacoes((m) => ({ ...m, [l.alunoId]: false }))}
                    >
                      <X size={18} aria-hidden /> Faltou
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={s.rodape}>
            <Botao variante="destaque" icone={<Save size={18} />} carregando={salvando} onClick={salvar}>
              Salvar chamada
            </Botao>
          </div>
        </Cartao>
      )}
    </>
  );
}
