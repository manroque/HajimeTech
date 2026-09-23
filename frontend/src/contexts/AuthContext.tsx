/**
 * Sessão do usuário (login SIMULADO).
 *
 * INTEGRAÇÃO BACKEND: trocar `authService.entrar(usuarioId)` por login com
 * e-mail e senha, guardar o token (ver services/http.ts → definirToken) e
 * remover `definirUsuarioSessao`, que só existe para o mock.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { authService, definirUsuarioSessao } from '../services';
import type { Usuario } from '../types';
import { pode, type Acao } from '../utils/permissoes';

const CHAVE = 'hajimetech:usuario';

interface AuthContextValor {
  usuario: Usuario | null;
  entrar: (usuarioId: string) => Promise<Usuario>;
  sair: () => void;
  pode: (acao: Acao) => boolean;
}

const AuthContext = createContext<AuthContextValor | null>(null);

function lerSessao(): Usuario | null {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    const usuario = salvo ? (JSON.parse(salvo) as Usuario) : null;
    definirUsuarioSessao(usuario);
    return usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(lerSessao);

  const entrar = useCallback(async (usuarioId: string) => {
    const u = await authService.entrar(usuarioId);
    definirUsuarioSessao(u);
    setUsuario(u);
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(u));
    } catch {
      /* segue sem persistir */
    }
    return u;
  }, []);

  const sair = useCallback(() => {
    definirUsuarioSessao(null);
    setUsuario(null);
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* nada a fazer */
    }
  }, []);

  const valor = useMemo<AuthContextValor>(
    () => ({ usuario, entrar, sair, pode: (acao) => pode(usuario?.perfil, acao) }),
    [usuario, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
