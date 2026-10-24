# #21 Edição dos critérios de avaliação

| Campo | Valor |
|---|---|
| Número | [#21](https://github.com/manroque/HajimeTech/issues/21) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A tela Avaliações mostra os critérios da escola (Técnica, Disciplina, Frequência e Evolução), mas não permite alterar esses critérios. Cada academia pode querer critérios diferentes.

## Proposta

1. Na tela Avaliações, um botão "Critérios" (visível para administrador e professor) que abre a lista de critérios.
2. Ações: criar, editar nome e descrição, subir e descer na ordem e desativar.
3. Criar as funções correspondentes em `avaliacoesService` (`frontend/src/services/desempenhoService.ts`).
4. Ao desativar um critério, avisar que ele deixa de aparecer nas novas avaliações, mas as notas antigas continuam no histórico.
5. Reaproveitar `moverNaLista` de `curriculoService.ts` para a ordenação.

## Critérios de aceite

* [ ] Criar, editar, reordenar e desativar critérios pela tela
* [ ] O modal "Nova avaliação" passa a usar os critérios atualizados
* [ ] Histórico de avaliações antigas continua correto
* [ ] Perfil aluno não vê o botão

## Relacionadas

* Depende de #13 (rotas de critérios)
