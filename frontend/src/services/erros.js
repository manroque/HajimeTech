/** Erro devolvido pela API: status HTTP e mensagem pronta para mostrar ao usuário. */
export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}
