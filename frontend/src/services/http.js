/**
 * Cliente HTTP da API do HajimeTech.
 *
 * A URL vem de `VITE_API_URL` (frontend/.env). O token do login é enviado em
 * todas as requisições. Contratos das rotas em /backend/README.md.
 */
import { ErroApi } from './erros';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

let token = null;
let aoNaoAutorizado = null;

export function definirToken(novoToken) {
  token = novoToken;
}

/** Chamado quando uma requisição autenticada recebe 401 (token expirado ou inválido). */
export function definirAoNaoAutorizado(callback) {
  aoNaoAutorizado = callback;
}

async function requisicao(metodo, caminho, corpo) {
  let resposta;
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
  // 204 (sem conteúdo) não tem corpo
  const dados = resposta.status === 204 ? undefined : await resposta.json().catch(() => ({}));
  if (resposta.status === 401 && token) aoNaoAutorizado?.();
  if (!resposta.ok) throw new ErroApi(resposta.status, dados?.erro ?? 'Erro ao comunicar com o servidor.');
  return dados;
}

export const http = {
  get: (caminho) => requisicao('GET', caminho),
  post: (caminho, corpo) => requisicao('POST', caminho, corpo),
  put: (caminho, corpo) => requisicao('PUT', caminho, corpo),
  patch: (caminho, corpo) => requisicao('PATCH', caminho, corpo),
  delete: (caminho) => requisicao('DELETE', caminho),
};

/** Monta a query string ignorando valores vazios: consulta({ a: 1, b: null }) → "?a=1". */
export function consulta(parametros) {
  const qs = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== null && valor !== undefined && valor !== '' && valor !== false) qs.set(chave, String(valor));
  }
  const texto = qs.toString();
  return texto ? `?${texto}` : '';
}

/** Prefixo das rotas de uma escola. */
export const daEscola = (escolaId) => `/escolas/${escolaId}`;
