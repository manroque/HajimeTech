/**
 * Currículo técnico de EXEMPLO, baseado no Gokyo do Kodokan.
 *
 * É apenas um ponto de partida: cada academia edita o próprio currículo
 * pela tela "Currículo". Cada escola recebe uma cópia independente
 * (isolamento de dados por escola).
 *
 * IMPORTANTE: Marrom e Preta NÃO têm conteúdo, pois ele ainda não foi definido
 * pela academia e o sistema não deve inventá-lo.
 */
import type { CategoriaCurriculo, FaixaId, Tecnica } from '../types';
import { ESCOLAS } from './cadastros';
import { CRIADO_EM, TABELA, uid } from './utils';

/** [nome da técnica, descrição curta em português, ativa?] */
type ModeloTecnica = [string, string, boolean?];

interface ModeloCategoria {
  nome: string;
  descricao: string;
  tecnicas: ModeloTecnica[];
}

export const MODELO_CURRICULO: Partial<Record<FaixaId, ModeloCategoria[]>> = {
  branca: [
    {
      nome: 'Fundamentos',
      descricao: 'Base de comportamento e movimentação no tatame.',
      tecnicas: [
        ['Rei (saudação)', 'Cumprimento de respeito ao entrar no tatame e ao parceiro.'],
        ['Kumikata (pegada)', 'Forma correta de segurar o judogi do parceiro.'],
        ['Shisei (postura)', 'Posturas natural e defensiva.'],
        ['Shintai (deslocamento)', 'Andar no tatame sem cruzar os pés.'],
      ],
    },
    {
      nome: 'Ukemi (quedas)',
      descricao: 'Aprender a cair sem se machucar.',
      tecnicas: [
        ['Ushiro-ukemi', 'Queda para trás.'],
        ['Yoko-ukemi', 'Queda para o lado.'],
        ['Mae-ukemi', 'Queda para a frente.'],
        ['Zenpo-kaiten-ukemi', 'Rolamento para a frente.'],
      ],
    },
    {
      nome: 'Nage-waza (projeções)',
      descricao: 'Primeiras técnicas de derrubar o parceiro.',
      tecnicas: [
        ['O-soto-gari', 'Grande ceifada por fora.'],
        ['O-goshi', 'Grande projeção de quadril.'],
      ],
    },
    {
      nome: 'Osaekomi-waza (imobilizações)',
      descricao: 'Técnicas para segurar o parceiro no chão.',
      tecnicas: [['Kesa-gatame', 'Imobilização lateral em forma de faixa.']],
    },
  ],
  azul: [
    {
      nome: 'Nage-waza (projeções)',
      descricao: '1º grupo do Gokyo (Dai Ikkyo).',
      tecnicas: [
        ['De-ashi-harai', 'Varrida no pé que avança.'],
        ['Hiza-guruma', 'Giro pelo joelho.'],
        ['Sasae-tsurikomi-ashi', 'Bloqueio do pé com puxada.'],
        ['Uki-goshi', 'Quadril flutuante.'],
        ['O-uchi-gari', 'Grande ceifada por dentro.'],
        ['Seoi-nage', 'Projeção pelas costas.'],
        ['Morote-seoi-nage', 'Projeção pelas costas com as duas mãos.', false],
      ],
    },
    {
      nome: 'Osaekomi-waza (imobilizações)',
      descricao: 'Variações de imobilização.',
      tecnicas: [
        ['Kuzure-kesa-gatame', 'Variação da imobilização lateral.'],
        ['Kata-gatame', 'Imobilização pelo ombro.'],
      ],
    },
  ],
  amarela: [
    {
      nome: 'Nage-waza (projeções)',
      descricao: '2º grupo do Gokyo (Dai Nikyo).',
      tecnicas: [
        ['Ko-soto-gari', 'Pequena ceifada por fora.'],
        ['Ko-uchi-gari', 'Pequena ceifada por dentro.'],
        ['Koshi-guruma', 'Giro pelo quadril.'],
        ['Tsurikomi-goshi', 'Quadril com puxada para cima.'],
        ['Okuri-ashi-harai', 'Varrida dos dois pés.'],
      ],
    },
    {
      nome: 'Osaekomi-waza (imobilizações)',
      descricao: 'Imobilizações pelos quatro pontos.',
      tecnicas: [
        ['Yoko-shiho-gatame', 'Imobilização lateral dos quatro pontos.'],
        ['Kami-shiho-gatame', 'Imobilização pela cabeça.'],
      ],
    },
  ],
  laranja: [
    {
      nome: 'Nage-waza (projeções)',
      descricao: 'Final do 2º grupo e início do 3º grupo do Gokyo.',
      tecnicas: [
        ['Tai-otoshi', 'Queda do corpo.'],
        ['Harai-goshi', 'Varrida com o quadril.'],
        ['Uchi-mata', 'Projeção pela parte interna da coxa.'],
        ['Ko-soto-gake', 'Pequeno gancho por fora.'],
        ['Tsuri-goshi', 'Quadril com pegada na faixa.'],
      ],
    },
    {
      nome: 'Osaekomi-waza (imobilizações)',
      descricao: 'Imobilizações montadas.',
      tecnicas: [
        ['Tate-shiho-gatame', 'Imobilização montada.'],
        ['Kuzure-kami-shiho-gatame', 'Variação da imobilização pela cabeça.'],
      ],
    },
  ],
  verde: [
    {
      nome: 'Nage-waza (projeções)',
      descricao: '3º grupo do Gokyo (Dai Sankyo).',
      tecnicas: [
        ['Yoko-otoshi', 'Queda lateral.'],
        ['Ashi-guruma', 'Giro pela perna.'],
        ['Hane-goshi', 'Quadril com impulsão da perna.'],
        ['Harai-tsurikomi-ashi', 'Varrida do pé com puxada.'],
        ['Tomoe-nage', 'Projeção em círculo.'],
        ['Kata-guruma', 'Giro pelos ombros.'],
      ],
    },
    {
      nome: 'Shime-waza (estrangulamentos)',
      descricao: 'Técnicas de controle pelo pescoço, sempre com supervisão.',
      tecnicas: [
        ['Hadaka-jime', 'Estrangulamento sem uso do judogi.'],
        ['Okuri-eri-jime', 'Estrangulamento deslizando a gola.'],
        ['Kata-juji-jime', 'Estrangulamento em cruz.'],
      ],
    },
  ],
  roxa: [
    {
      nome: 'Nage-waza (projeções)',
      descricao: '4º grupo do Gokyo (Dai Yonkyo).',
      tecnicas: [
        ['Sumi-gaeshi', 'Reversão pelo canto.'],
        ['Tani-otoshi', 'Queda no vale.'],
        ['Hane-makikomi', 'Enrolamento com impulsão.'],
        ['Sukui-nage', 'Projeção por "colheita".'],
        ['Utsuri-goshi', 'Troca de quadril.'],
        ['O-guruma', 'Grande giro.'],
        ['Soto-makikomi', 'Enrolamento por fora.'],
        ['Uki-otoshi', 'Queda flutuante.'],
      ],
    },
    {
      nome: 'Kansetsu-waza (chaves de braço)',
      descricao: 'Técnicas de alavanca no cotovelo.',
      tecnicas: [
        ['Ude-garami', 'Chave de braço enroscada.'],
        ['Juji-gatame', 'Chave de braço em cruz.'],
        ['Ude-gatame', 'Chave de braço estendida.'],
      ],
    },
    {
      nome: 'Kata (formas)',
      descricao: 'Sequências formais de demonstração.',
      tecnicas: [['Nage-no-kata: Te-waza', '1º grupo do Nage-no-kata (técnicas de mão).']],
    },
  ],
  // marrom: conteúdo ainda não definido pela academia
  // preta: conteúdo ainda não definido pela academia
};

/** Monta categorias e técnicas de cada escola a partir do modelo. */
export function gerarCurriculo(): { categorias: CategoriaCurriculo[]; tecnicas: Tecnica[] } {
  const categorias: CategoriaCurriculo[] = [];
  const tecnicas: Tecnica[] = [];

  for (const escola of ESCOLAS) {
    for (const [faixaId, modelos] of Object.entries(MODELO_CURRICULO) as [FaixaId, ModeloCategoria[]][]) {
      modelos.forEach((modelo, ordemCategoria) => {
        const categoria: CategoriaCurriculo = {
          id: uid(TABELA.categorias, categorias.length + 1),
          escolaId: escola.id,
          faixaId,
          nome: modelo.nome,
          descricao: modelo.descricao,
          ordem: ordemCategoria + 1,
          ativo: true,
          criadoEm: CRIADO_EM,
          atualizadoEm: CRIADO_EM,
        };
        categorias.push(categoria);

        modelo.tecnicas.forEach(([nome, descricao, ativo], ordemTecnica) => {
          tecnicas.push({
            id: uid(TABELA.tecnicas, tecnicas.length + 1),
            escolaId: escola.id,
            categoriaId: categoria.id,
            nome,
            descricao,
            ordem: ordemTecnica + 1,
            ativo: ativo ?? true,
            criadoEm: CRIADO_EM,
            atualizadoEm: CRIADO_EM,
          });
        });
      });
    }
  }

  return { categorias, tecnicas };
}
