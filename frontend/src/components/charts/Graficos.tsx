/**
 * Gráficos do HajimeTech (Recharts), pensados para leigos:
 * uma série por gráfico, rótulos diretos, grade discreta e tooltip em
 * linguagem simples. As cores das faixas são as cores reais do judô.
 */
import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatarData, formatarDataCurta } from '../../utils/formatacao';
import s from './Graficos.module.css';

const COR_EIXO = '#64748b';
const COR_GRADE = '#e2e8f0';
const AZUL = '#1d4ed8';

/* ---------------------------------------------------------------- Moldura com título e explicação */

interface CartaoGraficoProps {
  titulo: string;
  /** Frase simples explicando o que o gráfico mostra. */
  explicacao: string;
  children: ReactNode;
  rodape?: ReactNode;
  acoes?: ReactNode;
}

export function CartaoGrafico({ titulo, explicacao, children, rodape, acoes }: CartaoGraficoProps) {
  return (
    <section className={s.cartao}>
      <header className={s.cabecalho}>
        <div>
          <h2 className={s.titulo}>{titulo}</h2>
          <p className={s.explicacao}>{explicacao}</p>
        </div>
        {acoes}
      </header>
      <div className={s.corpo}>{children}</div>
      {rodape && <footer className={s.rodape}>{rodape}</footer>}
    </section>
  );
}

/* ---------------------------------------------------------------- Tooltip */

function CaixaTooltip({ titulo, linhas }: { titulo: string; linhas: { rotulo: string; valor: string; cor?: string }[] }) {
  return (
    <div className={s.tooltip}>
      <strong>{titulo}</strong>
      {linhas.map((l) => (
        <div key={l.rotulo} className={s.tooltipLinha}>
          {l.cor && <span className={s.tooltipCor} style={{ background: l.cor }} />}
          <span>{l.rotulo}</span>
          <b>{l.valor}</b>
        </div>
      ))}
    </div>
  );
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/* ---------------------------------------------------------------- Barras horizontais (faixa, turma) */

interface BarrasProps {
  dados: { rotulo: string; valor: number; cor?: string }[];
  /** Ex.: ["aluno", "alunos"] para o texto do tooltip. */
  unidade: [string, string];
  altura?: number;
}

export function GraficoBarrasHorizontais({ dados, unidade, altura }: BarrasProps) {
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const h = altura ?? Math.max(160, dados.length * 38 + 20);
  return (
    <div style={{ width: '100%', height: h }} role="img" aria-label={dados.map((d) => `${d.rotulo}: ${d.valor}`).join(', ')}>
      <ResponsiveContainer>
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={COR_GRADE} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: COR_EIXO, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="rotulo" width={92} tick={{ fill: '#1e293b', fontSize: 13 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgb(29 78 216 / 6%)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as BarrasProps['dados'][number];
              const pct = total ? Math.round((d.valor / total) * 100) : 0;
              return (
                <CaixaTooltip
                  titulo={d.rotulo}
                  linhas={[{ rotulo: 'Total', valor: `${plural(d.valor, ...unidade)} (${pct}% do total)`, cor: d.cor ?? AZUL }]}
                />
              );
            }}
          />
          <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            {dados.map((d) => (
              // Faixa branca recebe contorno para não sumir no fundo branco.
              <Cell key={d.rotulo} fill={d.cor ?? AZUL} stroke={d.cor && d.cor.toUpperCase() === '#F1F5F9' ? '#94a3b8' : 'none'} />
            ))}
            <LabelList dataKey="valor" position="right" fill="#1e293b" fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------- Evolução da frequência (área) */

export function GraficoFrequencia({ dados, altura = 260 }: { dados: { semana: string; presencas: number; faltas: number }[]; altura?: number }) {
  return (
    <div style={{ width: '100%', height: altura }} role="img" aria-label="Presenças por semana">
      <ResponsiveContainer>
        <AreaChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="gradFreq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AZUL} stopOpacity={0.25} />
              <stop offset="100%" stopColor={AZUL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={COR_GRADE} />
          <XAxis
            dataKey="semana"
            tickFormatter={formatarDataCurta}
            tick={{ fill: COR_EIXO, fontSize: 12 }}
            axisLine={{ stroke: COR_GRADE }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fill: COR_EIXO, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { semana: string; presencas: number; faltas: number };
              const total = d.presencas + d.faltas;
              return (
                <CaixaTooltip
                  titulo={`Semana de ${formatarData(d.semana)}`}
                  linhas={[
                    { rotulo: 'Vieram treinar', valor: plural(d.presencas, 'vez', 'vezes'), cor: AZUL },
                    { rotulo: 'Faltaram', valor: plural(d.faltas, 'vez', 'vezes') },
                    { rotulo: 'Comparecimento', valor: total ? `${Math.round((d.presencas / total) * 100)}%` : '-' },
                  ]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="presencas"
            stroke={AZUL}
            strokeWidth={2}
            fill="url(#gradFreq)"
            dot={false}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------- Evolução de notas (linha) */

export function GraficoEvolucaoNotas({ dados, altura = 240 }: { dados: { data: string; media: number }[]; altura?: number }) {
  return (
    <div style={{ width: '100%', height: altura }} role="img" aria-label="Média das avaliações ao longo do tempo">
      <ResponsiveContainer>
        <LineChart data={dados} margin={{ top: 16, right: 20, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={COR_GRADE} />
          <XAxis dataKey="data" tickFormatter={formatarDataCurta} tick={{ fill: COR_EIXO, fontSize: 12 }} axisLine={{ stroke: COR_GRADE }} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: COR_EIXO, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { data: string; media: number };
              return <CaixaTooltip titulo={formatarData(d.data)} linhas={[{ rotulo: 'Média', valor: `${d.media.toFixed(1)} de 5`, cor: '#c8102e' }]} />;
            }}
          />
          <Line
            type="monotone"
            dataKey="media"
            stroke="#c8102e"
            strokeWidth={2}
            dot={{ r: 5, fill: '#c8102e', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          >
            <LabelList dataKey="media" position="top" formatter={(v: number) => v.toFixed(1)} fill="#1e293b" fontSize={12} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
