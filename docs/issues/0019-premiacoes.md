# #19 Tipos de premiação e concessão aos alunos

| Campo | Valor |
|---|---|
| Número | [#19](https://github.com/manroque/HajimeTech/issues/19) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A tela Premiações já lista os tipos de premiação e as premiações concedidas, e tem os botões de criar, editar, desativar, conceder e remover, que chamam `premiacoesService`. As listagens funcionam no backend. Faltam as gravações.

## Proposta

Implementar em `backend/src/routes/premiacoes.js`, nos dois comentários `PENDENTE`:

**Tipos de premiação**

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/escolas/:escolaId/premiacoes` | `{ nome, descricao, tipo }` | `201` com a `Premiacao` |
| PUT | `/api/escolas/:escolaId/premiacoes/:id` | `{ nome, descricao, tipo }` | `200` com a `Premiacao` |
| PATCH | `/api/escolas/:escolaId/premiacoes/:id/ativo` | `{ ativo }` | `200` com a `Premiacao` |

**Premiações concedidas**

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/escolas/:escolaId/premiacoes-aluno` | `{ premiacaoId, alunoId, data, descricao }` | `201` com a `PremiacaoAluno` |
| DELETE | `/api/escolas/:escolaId/premiacoes-aluno/:id` | sem corpo | `204` |

**Regras**

1. Somente administrador e professor.
2. `tipo` deve ser um de `destaque_mes`, `frequencia`, `campeonato`, `evolucao` ou `outro` (400).
3. `nome` obrigatório (400).
4. Desativar tipo é lógico.
5. Conceder: premiação ativa da escola, aluno ativo da escola e data não futura.
6. O `DELETE` de concessão é o único apagamento físico do sistema, para corrigir lançamentos feitos por engano. O tipo de premiação continua existindo.
7. Respostas convertidas com `paraPremiacao` e `paraPremiacaoAluno`.

## Como testar

1. Entre como `ana@hajime.local`, crie um tipo de premiação e conceda a um aluno.
2. Confira a premiação no perfil do aluno e no painel ("Destaques e premiações").
3. Remova a concessão e confira que ela some.

## Critérios de aceite

* [ ] Cinco rotas implementadas
* [ ] Validações de tipo, aluno ativo e data
* [ ] Testes de integração: criar tipo, conceder, remover, tipo inválido (400) e perfil aluno (403)
* [ ] Exemplos adicionados ao `backend/client.http`

## Relacionadas

* Base da API: #5
* Contrato: seção 7.11 do `backend/README.md`
