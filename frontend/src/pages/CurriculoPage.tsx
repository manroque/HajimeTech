/**
 * Currículo técnico por faixa: categorias e técnicas, com ordem.
 *
 * - Edição (criar, editar, reordenar, desativar) SOMENTE para administradores
 *   e professores. Alunos veem o currículo em modo leitura.
 * - Técnicas são desativadas, nunca apagadas.
 * - Marrom e Preta: "Conteúdo ainda não definido pela academia".
 */
import { ArrowDown, ArrowUp, BookOpen, Eye, EyeOff, Lock, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Aviso, Botao, CabecalhoPagina, CampoArea, CampoTexto, Carregando, Cartao, Confirmacao, EstadoVazio, Etiqueta, MensagemErro, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useEscolaAtual } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { curriculoService } from '../services';
import type { CategoriaComTecnicas, FaixaId, Tecnica } from '../types';
import { FAIXAS, faixaPorId } from '../utils/formatacao';
import s from './CurriculoPage.module.css';

type Formulario =
  | { tipo: 'categoria'; id: string | null; nome: string; descricao: string }
  | { tipo: 'tecnica'; id: string | null; categoriaId: string; nome: string; descricao: string };

export function CurriculoPage() {
  const escola = useEscolaAtual();
  const { pode } = useAuth();
  const toast = useToast();
  const podeEditar = pode('editarCurriculo');

  const [faixaId, setFaixaId] = useState<FaixaId>('branca');
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [form, setForm] = useState<Formulario | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [excluir, setExcluir] = useState<CategoriaComTecnicas | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const faixa = faixaPorId(faixaId);
  const { dados: categorias, carregando, erro, recarregar } = useCarregar(
    () => curriculoService.listarPorFaixa(escola.id, faixaId, podeEditar && mostrarInativas),
    [escola.id, faixaId, mostrarInativas, podeEditar],
  );

  /** Executa uma ação de edição, mostra o erro (ex.: 403) e recarrega. */
  async function executar(acao: () => Promise<unknown>, sucesso?: string) {
    setOcupado(true);
    try {
      await acao();
      if (sucesso) toast(sucesso);
      await recarregar();
      return true;
    } catch (e) {
      toast((e as Error).message, 'erro');
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function salvarFormulario() {
    if (!form) return;
    if (!form.nome.trim()) return setErroForm('Informe o nome.');
    const dados = { nome: form.nome.trim(), descricao: form.descricao.trim() };
    const ok = await executar(() => {
      if (form.tipo === 'categoria') {
        return form.id ? curriculoService.atualizarCategoria(escola.id, form.id, dados) : curriculoService.criarCategoria(escola.id, { ...dados, faixaId });
      }
      return form.id ? curriculoService.atualizarTecnica(escola.id, form.id, dados) : curriculoService.criarTecnica(escola.id, { ...dados, categoriaId: form.categoriaId });
    }, form.id ? 'Alterações salvas.' : form.tipo === 'categoria' ? 'Categoria criada.' : 'Técnica adicionada.');
    if (ok) setForm(null);
  }

  function abrir(novo: Formulario) {
    setErroForm('');
    setForm(novo);
  }

  const totalTecnicas = categorias?.reduce((t, c) => t + c.tecnicas.filter((x) => x.ativo).length, 0) ?? 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Currículo"
        descricao="O que o aluno precisa aprender em cada faixa, organizado por categorias. O aluno avança para a próxima faixa após cumprir estes conhecimentos."
      />

      {/* Seletor de faixa */}
      <nav className={s.faixas} aria-label="Escolha a faixa">
        {FAIXAS.map((f) => (
          <button
            key={f.id}
            className={`${s.faixaBotao} ${f.id === faixaId ? s.faixaAtiva : ''}`}
            aria-pressed={f.id === faixaId}
            onClick={() => setFaixaId(f.id)}
          >
            <span className={s.fita} style={{ background: f.cor }} aria-hidden />
            {f.nome}
            {!f.conteudoDefinido && <span className="visualmente-oculto"> (conteúdo não definido)</span>}
          </button>
        ))}
      </nav>

      {!podeEditar && (
        <div style={{ marginBottom: 16 }}>
          <Aviso>
            <Lock size={14} style={{ display: 'inline', verticalAlign: '-2px' }} aria-hidden /> Você está vendo o currículo em modo leitura. Somente
            administradores e professores podem criar, editar, reordenar ou desativar itens.
          </Aviso>
        </div>
      )}

      {!faixa.conteudoDefinido ? (
        <Cartao>
          <EstadoVazio
            icone={<BookOpen />}
            titulo="Conteúdo ainda não definido pela academia"
            descricao={`As técnicas da faixa ${faixa.nome} ainda não foram definidas. Assim que a academia definir, elas poderão ser cadastradas aqui.`}
          />
        </Cartao>
      ) : (
        <>
          <div className={s.barra}>
            <p className="texto-suave">
              <strong>Faixa {faixa.nome}</strong> · {categorias?.length ?? 0} categoria(s) · {totalTecnicas} técnica(s) ativa(s)
            </p>
            {podeEditar && (
              <div className="linha">
                <Botao
                  variante="fantasma"
                  tamanho="sm"
                  icone={mostrarInativas ? <EyeOff size={16} /> : <Eye size={16} />}
                  onClick={() => setMostrarInativas((v) => !v)}
                  aria-pressed={mostrarInativas}
                >
                  {mostrarInativas ? 'Ocultar desativadas' : 'Mostrar desativadas'}
                </Botao>
                <Botao icone={<Plus size={18} />} onClick={() => abrir({ tipo: 'categoria', id: null, nome: '', descricao: '' })}>
                  Nova categoria
                </Botao>
              </div>
            )}
          </div>

          {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
          {carregando && !categorias && <Carregando />}
          {categorias && !categorias.length && (
            <Cartao>
              <EstadoVazio icone={<BookOpen />} titulo="Nenhuma categoria nesta faixa" descricao={podeEditar ? 'Crie a primeira categoria (ex.: Ukemi, Nage-waza).' : undefined} />
            </Cartao>
          )}

          <ol className={s.categorias} aria-busy={ocupado}>
            {categorias?.map((c, ci) => (
              <li key={c.id} className={s.categoria}>
                <header className={s.categoriaTopo}>
                  <span className={s.ordem} aria-label={`Categoria ${ci + 1}`}>{ci + 1}</span>
                  <div className={s.categoriaTexto}>
                    <h2>{c.nome}</h2>
                    {c.descricao && <p>{c.descricao}</p>}
                  </div>
                  {podeEditar && (
                    <div className={s.acoes}>
                      <Botao variante="fantasma" somenteIcone icone={<ArrowUp size={18} />} aria-label={`Subir categoria ${c.nome}`} title="Subir" disabled={ci === 0 || ocupado} onClick={() => executar(() => curriculoService.moverCategoria(escola.id, c.id, 'cima'))} />
                      <Botao variante="fantasma" somenteIcone icone={<ArrowDown size={18} />} aria-label={`Descer categoria ${c.nome}`} title="Descer" disabled={ci === categorias.length - 1 || ocupado} onClick={() => executar(() => curriculoService.moverCategoria(escola.id, c.id, 'baixo'))} />
                      <Botao variante="fantasma" somenteIcone icone={<Pencil size={18} />} aria-label={`Editar categoria ${c.nome}`} title="Editar" onClick={() => abrir({ tipo: 'categoria', id: c.id, nome: c.nome, descricao: c.descricao })} />
                      <Botao variante="fantasma" somenteIcone icone={<Trash2 size={18} />} aria-label={`Excluir categoria ${c.nome}`} title="Excluir" onClick={() => setExcluir(c)} />
                    </div>
                  )}
                </header>

                {c.tecnicas.length ? (
                  <ol className={s.tecnicas}>
                    {c.tecnicas.map((t, ti) => (
                      <LinhaTecnica
                        key={t.id}
                        tecnica={t}
                        posicao={ti + 1}
                        primeira={ti === 0}
                        ultima={ti === c.tecnicas.length - 1}
                        podeEditar={podeEditar}
                        ocupado={ocupado}
                        onMover={(d) => executar(() => curriculoService.moverTecnica(escola.id, t.id, d))}
                        onEditar={() => abrir({ tipo: 'tecnica', id: t.id, categoriaId: c.id, nome: t.nome, descricao: t.descricao })}
                        onAtivo={(ativo) =>
                          executar(
                            () => curriculoService.definirTecnicaAtiva(escola.id, t.id, ativo),
                            ativo ? `“${t.nome}” reativada.` : `“${t.nome}” desativada. Ela continua no histórico dos alunos.`,
                          )
                        }
                      />
                    ))}
                  </ol>
                ) : (
                  <p className={s.semTecnicas}>Nenhuma técnica nesta categoria.</p>
                )}

                {podeEditar && (
                  <div className={s.rodapeCategoria}>
                    <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />} onClick={() => abrir({ tipo: 'tecnica', id: null, categoriaId: c.id, nome: '', descricao: '' })}>
                      Adicionar técnica
                    </Botao>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      <Modal
        aberto={!!form}
        titulo={form ? `${form.id ? 'Editar' : 'Nova'} ${form.tipo === 'categoria' ? 'categoria' : 'técnica'}` : ''}
        onFechar={() => setForm(null)}
        onEnviar={salvarFormulario}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setForm(null)}>Cancelar</Botao>
            <Botao type="submit" carregando={ocupado}>Salvar</Botao>
          </>
        }
      >
        {form && (
          <>
            <p className="texto-fraco">Faixa {faixa.nome} · {escola.nome}</p>
            <CampoTexto
              rotulo={form.tipo === 'categoria' ? 'Nome da categoria' : 'Nome da técnica'}
              placeholder={form.tipo === 'categoria' ? 'Ex.: Nage-waza (projeções)' : 'Ex.: O-soto-gari'}
              obrigatorio
              autoFocus
              erro={erroForm}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <CampoArea
              rotulo="Descrição"
              dica="Uma explicação curta em português ajuda alunos e responsáveis."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </>
        )}
      </Modal>

      <Confirmacao
        aberto={!!excluir}
        titulo="Excluir categoria?"
        mensagem={
          <>
            A categoria <strong>{excluir?.nome}</strong> e suas {excluir?.tecnicas.length ?? 0} técnica(s) deixarão de aparecer no currículo. Nada é
            apagado do histórico: as técnicas já registradas para os alunos continuam guardadas.
          </>
        }
        rotuloConfirmar="Excluir categoria"
        carregando={ocupado}
        onCancelar={() => setExcluir(null)}
        onConfirmar={async () => {
          const alvo = excluir!;
          if (await executar(() => curriculoService.excluirCategoria(escola.id, alvo.id), `Categoria “${alvo.nome}” excluída.`)) setExcluir(null);
        }}
      />
    </>
  );
}

interface LinhaTecnicaProps {
  tecnica: Tecnica;
  posicao: number;
  primeira: boolean;
  ultima: boolean;
  podeEditar: boolean;
  ocupado: boolean;
  onMover: (direcao: 'cima' | 'baixo') => void;
  onEditar: () => void;
  onAtivo: (ativo: boolean) => void;
}

function LinhaTecnica({ tecnica: t, posicao, primeira, ultima, podeEditar, ocupado, onMover, onEditar, onAtivo }: LinhaTecnicaProps) {
  return (
    <li className={`${s.tecnica} ${t.ativo ? '' : s.desativada}`}>
      <span className={s.posicao}>{posicao}</span>
      <div className={s.tecnicaTexto}>
        <strong>{t.nome}</strong>
        {t.descricao && <span>{t.descricao}</span>}
      </div>
      {!t.ativo && <Etiqueta>Desativada</Etiqueta>}
      {podeEditar && (
        <div className={s.acoes}>
          {t.ativo ? (
            <>
              <Botao variante="fantasma" somenteIcone icone={<ArrowUp size={16} />} aria-label={`Subir ${t.nome}`} title="Subir" disabled={primeira || ocupado} onClick={() => onMover('cima')} />
              <Botao variante="fantasma" somenteIcone icone={<ArrowDown size={16} />} aria-label={`Descer ${t.nome}`} title="Descer" disabled={ultima || ocupado} onClick={() => onMover('baixo')} />
              <Botao variante="fantasma" somenteIcone icone={<Pencil size={16} />} aria-label={`Editar ${t.nome}`} title="Editar" onClick={onEditar} />
              <Botao variante="fantasma" somenteIcone icone={<EyeOff size={16} />} aria-label={`Desativar ${t.nome}`} title="Desativar" onClick={() => onAtivo(false)} />
            </>
          ) : (
            <Botao variante="secundario" tamanho="sm" icone={<RotateCcw size={14} />} onClick={() => onAtivo(true)}>
              Reativar
            </Botao>
          )}
        </div>
      )}
    </li>
  );
}
