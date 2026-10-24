/**
 * Escola selecionada. Todas as telas leem `escola.id` daqui e o repassam
 * aos services. É assim que os dados ficam isolados por escola.
 *
 * - Administrador: escolhe qualquer escola na tela "Escolas".
 * - Professor e aluno: ficam presos à escola do próprio cadastro.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { escolasService } from '../services';
import { useAuth } from './AuthContext';

const CHAVE = 'hajimetech:escola';

const EscolaContext = createContext(null);

function lerEscolaSalva() {
  try {
    return sessionStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function EscolaProvider({ children }) {
  const { usuario } = useAuth();
  const [escolas, setEscolas] = useState([]);
  const [escolaId, setEscolaId] = useState(lerEscolaSalva);
  const [carregando, setCarregando] = useState(true);

  const recarregarEscolas = useCallback(async () => {
    setCarregando(true);
    try {
      setEscolas(await escolasService.listar());
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) void recarregarEscolas();
  }, [usuario, recarregarEscolas]);

  // Professores e alunos não escolhem escola.
  useEffect(() => {
    if (usuario && usuario.perfil !== 'administrador') setEscolaId(usuario.escolaId);
    if (!usuario) setEscolaId(null);
  }, [usuario]);

  useEffect(() => {
    try {
      if (escolaId) sessionStorage.setItem(CHAVE, escolaId);
      else sessionStorage.removeItem(CHAVE);
    } catch {
      /* segue sem persistir */
    }
  }, [escolaId]);

  const valor = useMemo(
    () => ({
      escolas,
      escola: escolas.find((e) => e.id === escolaId) ?? null,
      carregando,
      selecionarEscola: setEscolaId,
      recarregarEscolas,
    }),
    [escolas, escolaId, carregando, recarregarEscolas],
  );

  return <EscolaContext.Provider value={valor}>{children}</EscolaContext.Provider>;
}

export function useEscola() {
  const ctx = useContext(EscolaContext);
  if (!ctx) throw new Error('useEscola deve ser usado dentro de <EscolaProvider>.');
  return ctx;
}

/** Atalho para telas que só existem com uma escola selecionada. */
export function useEscolaAtual() {
  const { escola } = useEscola();
  if (!escola) throw new Error('Nenhuma escola selecionada.');
  return escola;
}
