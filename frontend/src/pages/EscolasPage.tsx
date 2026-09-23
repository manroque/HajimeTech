/** Seleção e gestão das escolas (academias). Exclusiva do administrador. */
import { ArrowRight, Check, MapPin, Pencil, Phone, Plus, Power, School } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao, CabecalhoPagina, CampoTexto, Carregando, Cartao, EstadoVazio, Etiqueta, MensagemErro, Modal } from '../components/ui';
import { useEscola } from '../contexts/EscolaContext';
import { useToast } from '../contexts/ToastContext';
import { useCarregar } from '../hooks/useCarregar';
import { escolasService, type EscolaInput } from '../services';
import type { Escola } from '../types';
import s from './paginas.module.css';

const VAZIA: EscolaInput = { nome: '', cidade: '', endereco: '', telefone: '', responsavel: '' };

export function EscolasPage() {
  const { escola: selecionada, selecionarEscola, recarregarEscolas } = useEscola();
  const navigate = useNavigate();
  const toast = useToast();
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [escolas, resumo] = await Promise.all([escolasService.listar(true), escolasService.resumo()]);
    return { escolas, resumo };
  }, []);

  const [edicao, setEdicao] = useState<{ id: string | null; dados: EscolaInput } | null>(null);
  const [salvando, setSalvando] = useState(false);

  function entrar(escola: Escola) {
    selecionarEscola(escola.id);
    navigate('/');
  }

  async function salvar() {
    if (!edicao) return;
    if (!edicao.dados.nome.trim()) return toast('Informe o nome da escola.', 'erro');
    setSalvando(true);
    try {
      if (edicao.id) await escolasService.atualizar(edicao.id, edicao.dados);
      else await escolasService.criar(edicao.dados);
      toast(edicao.id ? 'Escola atualizada.' : 'Escola cadastrada.');
      setEdicao(null);
      await Promise.all([recarregar(), recarregarEscolas()]);
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(escola: Escola) {
    try {
      await escolasService.definirAtivo(escola.id, !escola.ativo);
      toast(escola.ativo ? 'Escola desativada.' : 'Escola reativada.');
      if (escola.ativo && selecionada?.id === escola.id) selecionarEscola('');
      await Promise.all([recarregar(), recarregarEscolas()]);
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  }

  const campo = (chave: keyof EscolaInput) => ({
    value: edicao?.dados[chave] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEdicao((atual) => atual && { ...atual, dados: { ...atual.dados, [chave]: e.target.value } }),
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Escolas"
        descricao="Escolha a academia que deseja acompanhar. Todas as telas passam a mostrar apenas os dados da escola selecionada."
        acoes={
          <Botao icone={<Plus size={18} />} onClick={() => setEdicao({ id: null, dados: VAZIA })}>
            Nova escola
          </Botao>
        }
      />

      {carregando && !dados && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={recarregar} />}
      {dados && !dados.escolas.length && (
        <EstadoVazio icone={<School />} titulo="Nenhuma escola cadastrada" descricao="Cadastre a primeira academia para começar." />
      )}

      <div className={s.gradeCartoes}>
        {dados?.escolas.map((escola) => {
          const resumo = dados.resumo[escola.id] ?? { alunos: 0, turmas: 0 };
          const atual = selecionada?.id === escola.id;
          return (
            <Cartao
              key={escola.id}
              as="article"
              className={`${s.cartaoEscola} ${atual ? s.cartaoEscolaSelecionada : ''} ${escola.ativo ? '' : s.inativo}`}
            >
              <div className="linha" style={{ justifyContent: 'space-between' }}>
                <h2>{escola.nome}</h2>
                {atual && <Etiqueta tom="info"><Check size={12} /> Selecionada</Etiqueta>}
                {!escola.ativo && <Etiqueta>Inativa</Etiqueta>}
              </div>
              <div className="texto-fraco">
                <div className="linha" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                  <MapPin size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{escola.endereco || '-'} · {escola.cidade}</span>
                </div>
                <div className="linha" style={{ flexWrap: 'nowrap' }}><Phone size={14} aria-hidden /> {escola.telefone || '-'}</div>
                <div>Responsável: {escola.responsavel || '-'}</div>
              </div>
              <div className={s.metricas}>
                <div className={s.metrica}><strong>{resumo.alunos}</strong><span>alunos ativos</span></div>
                <div className={s.metrica}><strong>{resumo.turmas}</strong><span>turmas</span></div>
              </div>
              <div className={s.rodapeCartao}>
                {escola.ativo && (
                  <Botao variante={atual ? 'primario' : 'secundario'} icone={<ArrowRight size={16} />} onClick={() => entrar(escola)}>
                    {atual ? 'Ir para o painel' : 'Acessar escola'}
                  </Botao>
                )}
                <Botao
                  variante="fantasma"
                  somenteIcone
                  icone={<Pencil size={18} />}
                  aria-label={`Editar ${escola.nome}`}
                  title="Editar"
                  onClick={() => setEdicao({ id: escola.id, dados: { ...escola } })}
                />
                <Botao
                  variante="fantasma"
                  somenteIcone
                  icone={<Power size={18} />}
                  aria-label={escola.ativo ? `Desativar ${escola.nome}` : `Reativar ${escola.nome}`}
                  title={escola.ativo ? 'Desativar' : 'Reativar'}
                  onClick={() => alternarAtivo(escola)}
                />
              </div>
            </Cartao>
          );
        })}
      </div>

      <Modal
        aberto={!!edicao}
        titulo={edicao?.id ? 'Editar escola' : 'Nova escola'}
        onFechar={() => setEdicao(null)}
        onEnviar={salvar}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEdicao(null)}>Cancelar</Botao>
            <Botao type="submit" carregando={salvando}>Salvar</Botao>
          </>
        }
      >
        <CampoTexto rotulo="Nome da escola" obrigatorio autoFocus {...campo('nome')} />
        <div className={s.formGrade}>
          <CampoTexto rotulo="Cidade" placeholder="Ex.: Rio de Janeiro/RJ" {...campo('cidade')} />
          <CampoTexto rotulo="Telefone" type="tel" placeholder="(21) 0000-0000" {...campo('telefone')} />
          <CampoTexto rotulo="Endereço" className="campo-input" {...campo('endereco')} />
          <CampoTexto rotulo="Responsável" {...campo('responsavel')} />
        </div>
      </Modal>
    </>
  );
}
