/**
 * Componentes básicos de interface, reutilizados em todas as telas.
 */
import { AlertCircle, Info, Loader2, Search, X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { faixaPorId } from '../../utils/formatacao';
import s from './ui.module.css';

const cx = (...classes) => classes.filter(Boolean).join(' ');

/* ---------------------------------------------------------------- Botão */

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  icone,
  somenteIcone,
  carregando,
  children,
  className,
  disabled,
  type = 'button',
  ...resto
}) {
  return (
    <button
      type={type}
      className={cx(s.botao, s[variante], tamanho === 'sm' && s.sm, somenteIcone && s.icone, className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? <Loader2 size={16} className={s.girar} aria-hidden /> : icone}
      {!somenteIcone && children}
    </button>
  );
}

/** Link com aparência de botão (evita <button> dentro de <a>). */
export function BotaoLink({ para, variante = 'primario', tamanho = 'md', icone, children }) {
  return (
    <Link to={para} className={cx(s.botao, s[variante], tamanho === 'sm' && s.sm)}>
      {icone}
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------- Cartão */

export function Cartao({ titulo, descricao, acoes, children, className, as: Tag = 'section' }) {
  return (
    <Tag className={cx(s.cartao, className)}>
      {(titulo || acoes) && (
        <div className={s.cartaoCabecalho}>
          <div>
            {titulo && <h2 className={s.cartaoTitulo}>{titulo}</h2>}
            {descricao && <p className={s.cartaoDescricao}>{descricao}</p>}
          </div>
          {acoes}
        </div>
      )}
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- Cabeçalho de página */

export function CabecalhoPagina({ titulo, descricao, acoes }) {
  useEffect(() => {
    document.title = `${titulo} · HajimeTech`;
  }, [titulo]);
  return (
    <header className={s.cabecalho}>
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {acoes && <div className={cx(s.cabecalhoAcoes, 'nao-imprimir')}>{acoes}</div>}
    </header>
  );
}

/* ---------------------------------------------------------------- Campos de formulário */

function Campo({ rotulo, dica, erro, obrigatorio, id, children }) {
  return (
    <div className={s.campo}>
      <label htmlFor={id} className={s.rotulo}>
        {rotulo}{' '}
        {obrigatorio && (
          <span className={s.obrigatorio} aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {dica && !erro && (
        <span id={`${id}-dica`} className={s.dica}>
          {dica}
        </span>
      )}
      {erro && (
        <span id={`${id}-erro`} className={s.erroCampo}>
          {erro}
        </span>
      )}
    </div>
  );
}

function ariaCampo(id, dica, erro) {
  return {
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': erro ? `${id}-erro` : dica ? `${id}-dica` : undefined,
  };
}

export function CampoTexto({ rotulo, dica, erro, obrigatorio, ...resto }) {
  const id = useId();
  return (
    <Campo id={id} rotulo={rotulo} dica={dica} erro={erro} obrigatorio={obrigatorio}>
      <input id={id} className="campo-input" required={obrigatorio} {...ariaCampo(id, dica, erro)} {...resto} />
    </Campo>
  );
}

export function CampoSelecao({ rotulo, dica, erro, obrigatorio, children, ...resto }) {
  const id = useId();
  return (
    <Campo id={id} rotulo={rotulo} dica={dica} erro={erro} obrigatorio={obrigatorio}>
      <select id={id} className="campo-input" required={obrigatorio} {...ariaCampo(id, dica, erro)} {...resto}>
        {children}
      </select>
    </Campo>
  );
}

export function CampoArea({ rotulo, dica, erro, obrigatorio, ...resto }) {
  const id = useId();
  return (
    <Campo id={id} rotulo={rotulo} dica={dica} erro={erro} obrigatorio={obrigatorio}>
      <textarea id={id} className="campo-input" required={obrigatorio} {...ariaCampo(id, dica, erro)} {...resto} />
    </Campo>
  );
}

export function CampoBusca({ rotulo, ...resto }) {
  return (
    <div className={s.busca}>
      <Search size={18} aria-hidden />
      <input type="search" className="campo-input" aria-label={rotulo} placeholder={rotulo} {...resto} />
    </div>
  );
}

/* ---------------------------------------------------------------- Faixa */

export function FaixaBadge({ faixaId }) {
  const faixa = faixaPorId(faixaId);
  return (
    <span className={s.faixa}>
      <span className={s.faixaAmostra} style={{ background: faixa.cor }} aria-hidden />
      Faixa {faixa.nome}
    </span>
  );
}

/* ---------------------------------------------------------------- Etiqueta */

export function Etiqueta({ tom = 'neutro', children }) {
  return <span className={cx(s.etiqueta, s[`tom-${tom}`])}>{children}</span>;
}

/* ---------------------------------------------------------------- Estados */

export function EstadoVazio({ icone, titulo, descricao, acao }) {
  return (
    <div className={s.vazio}>
      {icone && (
        <div className={s.vazioIcone} aria-hidden>
          {icone}
        </div>
      )}
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className={s.carregando} role="status">
      <Loader2 size={20} className={s.girar} aria-hidden /> {texto}
    </div>
  );
}

export function MensagemErro({ mensagem, onTentarNovamente }) {
  return (
    <div className={s.erroCaixa} role="alert">
      <AlertCircle size={20} aria-hidden />
      <span style={{ flex: 1 }}>{mensagem}</span>
      {onTentarNovamente && (
        <Botao variante="secundario" tamanho="sm" onClick={onTentarNovamente}>
          Tentar novamente
        </Botao>
      )}
    </div>
  );
}

export function Aviso({ children }) {
  return (
    <div className={s.avisoCaixa}>
      <Info size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Barra de progresso */

export function BarraProgresso({ valor, rotulo, detalhe }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div className={s.progresso}>
      <div className={s.progressoTopo}>
        <span>{rotulo}</span>
        <span>{v}%</span>
      </div>
      <div
        className={s.progressoTrilho}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={rotulo}
      >
        <div className={s.progressoBarra} style={{ width: `${v}%` }} />
      </div>
      {detalhe && <span className={s.dica}>{detalhe}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- Modal */

/** Usa o <dialog> nativo: foco preso no modal e tecla Esc para fechar. */
export function Modal({ aberto, titulo, onFechar, children, rodape, largo, onEnviar }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  const conteudo = (
    <>
      <div className={s.modalTopo}>
        <h2>{titulo}</h2>
        <Botao variante="fantasma" somenteIcone icone={<X size={20} />} aria-label="Fechar" onClick={onFechar} />
      </div>
      <div className={s.modalCorpo}>{children}</div>
      {rodape && <div className={s.modalRodape}>{rodape}</div>}
    </>
  );

  return (
    <dialog
      ref={ref}
      className={cx(s.modal, largo && s.largo)}
      onCancel={(e) => {
        e.preventDefault();
        onFechar();
      }}
      onClick={(e) => e.target === ref.current && onFechar()}
      aria-label={titulo}
    >
      {aberto &&
        (onEnviar ? (
          <form
            className={s.modalConteudo}
            onSubmit={(e) => {
              e.preventDefault();
              onEnviar();
            }}
          >
            {conteudo}
          </form>
        ) : (
          <div className={s.modalConteudo}>{conteudo}</div>
        ))}
    </dialog>
  );
}

/** Pergunta de confirmação para ações importantes (desativar, excluir...). */
export function Confirmacao({ aberto, titulo, mensagem, rotuloConfirmar, onConfirmar, onCancelar, carregando }) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      onFechar={onCancelar}
      rodape={
        <>
          <Botao variante="secundario" onClick={onCancelar}>
            Cancelar
          </Botao>
          <Botao variante="destaque" onClick={onConfirmar} carregando={carregando}>
            {rotuloConfirmar}
          </Botao>
        </>
      }
    >
      <div className="texto-suave">{mensagem}</div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- Abas e segmentado */

export function Abas({ abas, ativa, onMudar, rotulo }) {
  return (
    <div className={s.abas} role="tablist" aria-label={rotulo}>
      {abas.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={a.id === ativa}
          className={cx(s.aba, a.id === ativa && s.abaAtiva)}
          onClick={() => onMudar(a.id)}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Segmentado({ opcoes, valor, onMudar, rotulo }) {
  return (
    <div className={s.segmentado} role="radiogroup" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          className={cx(s.segmento, o.valor === valor && s.segmentoAtivo)}
          onClick={() => onMudar(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
