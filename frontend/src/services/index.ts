/**
 * Camada de serviços: ÚNICO ponto de contato das telas com os dados.
 *
 * Hoje todas as funções leem/escrevem no banco em memória (mockDb.ts).
 * Para integrar o backend, reescreva o corpo de cada função usando `http.ts`
 * mantendo a mesma assinatura: nenhuma tela precisará mudar.
 */
export * from './cadastrosService';
export * from './alunosService';
export * from './curriculoService';
export * from './desempenhoService';
export * from './dashboardService';
export { ErroApi, restaurarDadosExemplo, definirUsuarioSessao } from './mockDb';
