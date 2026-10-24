/*
 * Erros HTTP e utilitários comuns às rotas.
 * Toda resposta de erro segue o formato { "erro": "mensagem" } (ver backend/README.md, seção 5).
 */
export const MSG_SEM_PERMISSAO = 'Você não tem permissão para realizar esta ação.';

export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export const requisicaoInvalida = (mensagem) => new ErroHttp(400, mensagem);
export const semPermissao = () => new ErroHttp(403, MSG_SEM_PERMISSAO);
export const naoEncontrado = (rotulo) => new ErroHttp(404, `${rotulo} não encontrado(a).`);
export const regraViolada = (mensagem) => new ErroHttp(422, mensagem);

/*
 * Envolve um handler assíncrono para que erros cheguem ao middleware de erros
 * (o Express 4 não captura rejeições de Promise sozinho).
 */
export const rota = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/* ------------------------------------------------------------------ Validação */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const ehUuid = (valor) => typeof valor === 'string' && UUID.test(valor);

/* Id vindo da URL: formato inválido é tratado como "não encontrado". */
export function exigirId(valor, rotulo) {
  if (!ehUuid(valor)) throw naoEncontrado(rotulo);
  return valor;
}

export function textoObrigatorio(valor, mensagem) {
  if (typeof valor !== 'string' || !valor.trim()) throw requisicaoInvalida(mensagem);
  return valor.trim();
}

export const textoOpcional = (valor) => (typeof valor === 'string' ? valor.trim() : '');

export function ehData(valor) {
  if (typeof valor !== 'string' || !DATA.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(valor);
}

export function dataObrigatoria(valor, mensagem = 'Informe uma data válida (AAAA-MM-DD).') {
  if (!ehData(valor)) throw requisicaoInvalida(mensagem);
  return valor;
}

export const ehHora = (valor) => typeof valor === 'string' && HORA.test(valor);

export function booleano(valor, campo) {
  if (typeof valor !== 'boolean') throw requisicaoInvalida(`Informe "${campo}" como verdadeiro ou falso.`);
  return valor;
}

/* Lê `?flag=true` da query string. */
export const flagQuery = (valor) => valor === 'true' || valor === '1';
