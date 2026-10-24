# #10 Navegação por teclado nas abas e seletores de opção

| Campo | Valor |
|---|---|
| Número | [#10](https://github.com/manroque/HajimeTech/issues/10) |
| Tipo | Acessibilidade |
| Área | Frontend |
| Etiquetas | accessibility, frontend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

As abas do perfil do aluno (Frequência, Graduações, Técnicas, Avaliações e Premiações) e os seletores de opção (período do painel e nível da técnica no acompanhamento técnico) funcionam com o mouse e com Tab e Enter, mas não seguem o comportamento de teclado esperado para esses componentes. Isso dificulta o uso com leitor de tela.

## Problema

* Cada aba e cada opção é uma parada separada do Tab, então é preciso apertar Tab muitas vezes para passar pelo grupo.
* As setas do teclado não trocam de aba nem de opção.
* As abas não estão ligadas ao conteúdo que controlam, e o leitor de tela não anuncia essa relação.

## Proposta

Aplicar os padrões de abas e de grupo de opções do ARIA Authoring Practices (W3C) nos componentes `Abas` e `Segmentado`, em `frontend/src/components/ui/index.tsx`:

1. Setas para a direita e para baixo vão para a próxima opção; para a esquerda e para cima, para a anterior, voltando ao início no fim da lista.
2. Home vai para a primeira opção e End, para a última.
3. A opção escolhida já é selecionada e recebe o foco.
4. Só a opção ativa entra na ordem do Tab (`tabIndex={0}` na ativa e `tabIndex={-1}` nas demais).
5. Cada aba aponta para o seu painel com `aria-controls`, e o conteúdo recebe `role="tabpanel"` e `aria-labelledby`. Sugestão: criar um componente `PainelAba` e aplicar esse componente em `frontend/src/components/PerfilAluno.tsx`.
6. Todos os botões desses grupos com `type="button"`.

Referência: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ e https://www.w3.org/WAI/ARIA/apg/patterns/radio/

## Arquivos envolvidos

* `frontend/src/components/ui/index.tsx` (`Abas` e `Segmentado`)
* `frontend/src/components/PerfilAluno.tsx`

## Como testar

1. Abra o perfil de um aluno, aperte Tab até chegar nas abas e use as setas: a aba muda e o conteúdo acompanha.
2. No painel, aperte Tab até o seletor de período e use as setas para trocar entre 30 dias, 3 meses e 6 meses.
3. Com um leitor de tela (NVDA no Windows ou VoiceOver no Mac), confira que ele anuncia "aba, 1 de 5" e o painel correspondente.

## Critérios de aceite

* [ ] Setas, Home e End funcionam nas abas e nos seletores
* [ ] Só a opção ativa recebe o foco pelo Tab
* [ ] Abas ligadas aos painéis com `aria-controls` e `role="tabpanel"`
* [ ] Testes de teclado incluídos quando #14 estiver pronta
