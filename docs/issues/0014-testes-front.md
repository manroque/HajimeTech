# #14 Testes automatizados do front

| Campo | Valor |
|---|---|
| Número | [#14](https://github.com/manroque/HajimeTech/issues/14) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

O backend tem testes unitários e de integração (#7). O front é verificado pelo build no CI, mas não tem testes de comportamento.

## Proposta

1. Adicionar Vitest e Testing Library ao `frontend`.
2. Testar primeiro o que tem regra:
   * `utils/permissoes.js`: o que cada perfil pode fazer
   * `utils/formatacao.js`: datas, idade, faixa etária e textos de variação
   * `services/curriculoService.js`: `moverNaLista` (subir e descer itens)
   * componentes `Abas` e `Segmentado`: navegação pelas setas do teclado
3. Testar telas com a API simulada: login com erro, tela de Alunos com busca e exclusão, Currículo sem botões de edição para o perfil aluno.
4. Incluir `npm test` do front no CI.

## Critérios de aceite

* [ ] Vitest configurado com `npm test` no front
* [ ] Testes das regras de permissão e formatação
* [ ] Testes de teclado das abas e seletores
* [ ] Testes rodando no CI

## Relacionadas

* #7
* #8
