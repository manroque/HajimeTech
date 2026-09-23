import type { Faixa } from '../types';

/**
 * Progressão oficial de faixas da academia.
 * Tabela global (não pertence a uma escola). Ver `faixas` em schema.sql.
 *
 * Marrom e Preta estão com `conteudoDefinido: false`: o sistema NÃO inventa
 * técnicas para elas e exibe um estado vazio no currículo.
 */
export const FAIXAS: Faixa[] = [
  { id: 'branca', nome: 'Branca', ordem: 1, cor: '#F1F5F9', corTexto: '#0F172A', conteudoDefinido: true },
  { id: 'azul', nome: 'Azul', ordem: 2, cor: '#1D4ED8', corTexto: '#FFFFFF', conteudoDefinido: true },
  { id: 'amarela', nome: 'Amarela', ordem: 3, cor: '#FACC15', corTexto: '#1F2937', conteudoDefinido: true },
  { id: 'laranja', nome: 'Laranja', ordem: 4, cor: '#F97316', corTexto: '#1F2937', conteudoDefinido: true },
  { id: 'verde', nome: 'Verde', ordem: 5, cor: '#15803D', corTexto: '#FFFFFF', conteudoDefinido: true },
  { id: 'roxa', nome: 'Roxa', ordem: 6, cor: '#7E22CE', corTexto: '#FFFFFF', conteudoDefinido: true },
  { id: 'marrom', nome: 'Marrom', ordem: 7, cor: '#78350F', corTexto: '#FFFFFF', conteudoDefinido: false },
  { id: 'preta', nome: 'Preta', ordem: 8, cor: '#111827', corTexto: '#FFFFFF', conteudoDefinido: false },
];
