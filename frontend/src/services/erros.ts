/** Erro devolvido pela API: status HTTP e mensagem pronta para mostrar ao usuário. */
export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}
