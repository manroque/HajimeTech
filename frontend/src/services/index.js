/**
 * Camada de serviços: ÚNICO ponto de contato das telas com os dados.
 * Cada função chama uma rota da API (contratos em /backend/README.md).
 */
export * from './cadastrosService';
export * from './alunosService';
export * from './curriculoService';
export * from './desempenhoService';
export * from './dashboardService';
export { ErroApi } from './erros';
