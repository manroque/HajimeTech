/**
 * Cliente HTTP para o backend real (AINDA NÃO UTILIZADO).
 *
 * INTEGRAÇÃO BACKEND: quando a API existir, defina `VITE_API_URL` no
 * arquivo frontend/.env e substitua, em cada service, o bloco `simular(...)`
 * por chamadas como `http.get<Aluno[]>(`/escolas/${escolaId}/alunos`)`.
 * Os contratos esperados estão em /backend/README.md.
 */
import { ErroApi } from './mockDb';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

let token: string | null = null;

export function definirToken(novoToken: string | null): void {
  token = novoToken;
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(BASE_URL + caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
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
