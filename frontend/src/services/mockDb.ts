/**
 * "Banco" em memória usado enquanto o backend não existe.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ INTEGRAÇÃO BACKEND: este arquivo deve DESAPARECER. Cada service em    │
 * │ /src/services troca o uso de `db()` por uma chamada a `http.ts`.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Os dados ficam no sessionStorage: sobrevivem a um recarregamento da página
 * e voltam ao exemplo original ao abrir uma nova aba/sessão.
 */
import { criarBancoInicial, type BancoMock } from '../mocks';
import type { Perfil, Usuario } from '../types';

const CHAVE = 'hajimetech:banco:v1';
const LATENCIA_MS = 200;

let banco: BancoMock | null = null;

export function db(): BancoMock {
  if (banco) return banco;
  try {
    const salvo = sessionStorage.getItem(CHAVE);
    if (salvo) banco = JSON.parse(salvo) as BancoMock;
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
  banco ??= criarBancoInicial();
  return banco;
}

/** Persiste as alterações (equivale ao COMMIT do banco real). */
export function salvar(): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(db()));
  } catch {
    /* ignora: os dados continuam em memória */
  }
}

/** Descarta as alterações e volta aos dados de exemplo. */
export function restaurarDadosExemplo(): void {
  banco = criarBancoInicial();
  salvar();
}

/** Erro no mesmo formato que a API real deve devolver (status + mensagem). */
export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/**
 * Simula uma chamada de rede: espera um pouco e devolve uma CÓPIA dos dados,
 * para que as telas nunca alterem o "banco" diretamente.
 */
export async function simular<T>(operacao: () => T, ms = LATENCIA_MS): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  const resultado = operacao();
  return resultado === undefined ? resultado : structuredClone(resultado);
}

export const novoId = (): string => crypto.randomUUID();
export const agora = (): string => new Date().toISOString();

/* ---------------------------------------------------------------- Sessão simulada */

/**
 * Usuário "logado". No backend real, o perfil vem do token de autenticação e
 * as permissões são verificadas no servidor. Aqui simulamos o mesmo 403.
 */
let usuarioSessao: Usuario | null = null;

export function definirUsuarioSessao(usuario: Usuario | null): void {
  usuarioSessao = usuario;
}

export function exigirPerfil(permitidos: Perfil[]): void {
  if (!usuarioSessao || !permitidos.includes(usuarioSessao.perfil)) {
    throw new ErroApi(403, 'Você não tem permissão para realizar esta ação.');
  }
}

export function usuarioAtual(): Usuario | null {
  return usuarioSessao;
}

export function encontrar<T extends { id: string }>(lista: T[], id: string, rotulo: string): T {
  const item = lista.find((x) => x.id === id);
  if (!item) throw new ErroApi(404, `${rotulo} não encontrado(a).`);
  return item;
}
