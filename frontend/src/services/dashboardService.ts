/**
 * Indicadores do painel e dos relatórios, calculados pela API.
 */
import type { Dashboard, FiltroDashboard } from '../types';
import { consulta, daEscola, http } from './http';

export const dashboardService = {
  /** GET /api/escolas/:escolaId/dashboard?periodoDias=30&turmaId= */
  obter(escolaId: string, filtro: FiltroDashboard): Promise<Dashboard> {
    return http.get(`${daEscola(escolaId)}/dashboard${consulta({ periodoDias: filtro.periodoDias, turmaId: filtro.turmaId })}`);
  },
};
