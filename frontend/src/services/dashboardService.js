import { consulta, daEscola, http } from './http';

export const dashboardService = {
  /** GET /api/escolas/:escolaId/dashboard?periodoDias=30&turmaId= */
  obter(escolaId, filtro) {
    return http.get(
      `${daEscola(escolaId)}/dashboard${consulta({ periodoDias: filtro.periodoDias, turmaId: filtro.turmaId })}`,
    );
  },
};
