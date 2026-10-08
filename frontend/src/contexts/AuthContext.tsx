/**
 * Sessão do usuário: login com e-mail e senha na API (POST /api/auth/login).
 *
 * O token fica no sessionStorage (some ao fechar a aba) e é enviado pelo
 * services/http.ts. Enquanto os demais services usam o mock, o usuário logado
 * também é repassado a `definirUsuarioSessao` para o mock aplicar as permissões.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, definirUsuarioSessao, ErroApi } from '../services';
import { definirAoNaoAutorizado, definirToken } from '../services/http';
import type { Usuario } from '../types';
import { pode, type Acao } from '../utils/permissoes';

const CHAVE = 'hajimetech:sessao';

interface Sessao {
  token: string;
  usuario: Usuario;
}

interface AuthContextValor {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  sair: () => void;
  pode: (acao: Acao) => boolean;
}

const AuthContext = createContext<AuthContextValor | null>(null);

function aplicarSessao(sessao: Sessao | null): void {
  definirToken(sessao?.token ?? null);
  definirUsuarioSessao(sessao?.usuario ?? null);
}

function lerSessao(): Sessao | null {
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    const sessao = salvo ? (JSON.parse(salvo) as Sessao) : null;
    const valida = sessao?.token && sessao.usuario ? sessao : null;
    aplicarSessao(valida);
    return valida;
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null): void {
  try {
    if (sessao) sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
    else sessionStorage.removeItem(CHAVE);
  } catch {
    /* segue sem persistir */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao);

  const sair = useCallback(() => {
    aplicarSessao(null);
    gravarSessao(null);
    setSessao(null);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const nova = await authService.entrar(email, senha);
    aplicarSessao(nova);
    gravarSessao(nova);
    setSessao(nova);
    return nova.usuario;
  }, []);

  // Token expirado/inválido em qualquer requisição → volta para o login.
  useEffect(() => {
    definirAoNaoAutorizado(sair);
    return () => definirAoNaoAutorizado(null);
  }, [sair]);

  // Ao recarregar a página, confirma com a API que a sessão salva ainda vale.
  const token = sessao?.token;
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    authService
      .sessaoAtual()
      .then((usuario) => {
        if (!ativo) return;
        const atualizada = { token, usuario };
        aplicarSessao(atualizada);
        gravarSessao(atualizada);
        setSessao(atualizada);
      })
      .catch((e) => {
        if (ativo && e instanceof ErroApi && e.status === 401) sair();
      });
    return () => {
      ativo = false;
    };
    // Só na montagem: depois do login o usuário já veio da API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usuario = sessao?.usuario ?? null;
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
