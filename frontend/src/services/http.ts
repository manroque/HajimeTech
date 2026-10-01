/**
 * Cliente HTTP para o backend real.
 *
 * Já usado pelo login (authService). Para os demais dados, INTEGRAÇÃO BACKEND:
 * substitua, em cada service, o bloco `simular(...)` por chamadas como
 * `http.get<Aluno[]>(`/escolas/${escolaId}/alunos`)`.
 * A URL vem de `VITE_API_URL` (frontend/.env). Contratos em /backend/README.md.
 */
import { ErroApi } from './mockDb';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

let token: string | null = null;
let aoNaoAutorizado: (() => void) | null = null;

export function definirToken(novoToken: string | null): void {
  token = novoToken;
}

/** Chamado quando uma requisição autenticada recebe 401 (token expirado ou inválido). */
export function definirAoNaoAutorizado(callback: (() => void) | null): void {
  aoNaoAutorizado = callback;
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(BASE_URL + caminho, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }
  const dados = await resposta.json().catch(() => ({}));
  if (resposta.status === 401 && token) aoNaoAutorizado?.();
  if (!resposta.ok) throw new ErroApi(resposta.status, dados.erro ?? 'Erro ao comunicar com o servidor.');
  return dados as T;
}

export const http = {
  get: <T>(caminho: string) => requisicao<T>('GET', caminho),
  post: <T>(caminho: string, corpo: unknown) => requisicao<T>('POST', caminho, corpo),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>('PUT', caminho, corpo),
  patch: <T>(caminho: string, corpo?: unknown) => requisicao<T>('PATCH', caminho, corpo),
  delete: <T>(caminho: string) => requisicao<T>('DELETE', caminho),
};
