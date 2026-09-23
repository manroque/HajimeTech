import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IndicadorComparado } from '../../types';
import { numero, textoVariacao } from '../../utils/formatacao';
import s from './CartaoIndicador.module.css';

interface Props {
  rotulo: string;
  indicador: IndicadorComparado;
  /** Frase curta que explica o número para quem não entende de dados. */
  explicacao: string;
  icone: ReactNode;
  sufixo?: string;
  /** Ex.: "mês passado" → "+12% em relação ao mês passado". */
  rotuloPeriodoAnterior: string;
}

/** Número grande + comparação com o período anterior. */
export function CartaoIndicador({ rotulo, indicador, explicacao, icone, sufixo = '', rotuloPeriodoAnterior }: Props) {
  const v = indicador.variacao === null ? null : Math.round(indicador.variacao);
  const tendencia = v === null || v === 0 ? 'neutra' : v > 0 ? 'alta' : 'baixa';
  const Seta = tendencia === 'alta' ? ArrowUpRight : tendencia === 'baixa' ? ArrowDownRight : Minus;

  return (
    <article className={s.cartao}>
      <div className={s.topo}>
        <span className={s.rotulo}>{rotulo}</span>
        <span className={s.icone} aria-hidden>{icone}</span>
      </div>
      <strong className={s.numero}>
        {numero(indicador.atual)}
        {sufixo}
      </strong>
      <span className={`${s.variacao} ${s[tendencia]}`}>
        <Seta size={16} aria-hidden />
        {textoVariacao(indicador.variacao, rotuloPeriodoAnterior)}
      </span>
      <p className={s.explicacao}>{explicacao}</p>
    </article>
  );
}
