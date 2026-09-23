import { Award, CalendarCheck, Star, TrendingUp, Trophy } from 'lucide-react';
import type { TipoPremiacao } from '../types';

const CORES: Record<TipoPremiacao, { fundo: string; cor: string }> = {
  destaque_mes: { fundo: '#fdecee', cor: '#a00d25' },
  campeonato: { fundo: '#fef3e2', cor: '#b45309' },
  frequencia: { fundo: '#eef3ff', cor: '#1e3a8a' },
  evolucao: { fundo: '#e8f6ee', cor: '#166534' },
  outro: { fundo: '#eef2f7', cor: '#475569' },
};

/** Ícone redondo que identifica o tipo de premiação. */
export function IconePremiacao({ tipo, tamanho = 40 }: { tipo: TipoPremiacao; tamanho?: number }) {
  const Icone = { destaque_mes: Star, campeonato: Trophy, frequencia: CalendarCheck, evolucao: TrendingUp, outro: Award }[tipo];
  const { fundo, cor } = CORES[tipo];
  return (
    <span
      aria-hidden
      style={{ display: 'grid', placeItems: 'center', width: tamanho, height: tamanho, borderRadius: '50%', background: fundo, color: cor, flexShrink: 0 }}
    >
      <Icone size={tamanho * 0.5} />
    </span>
  );
}
