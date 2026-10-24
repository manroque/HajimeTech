# #16 Edição e desativação de turmas

| Campo | Valor |
|---|---|
| Número | [#16](https://github.com/manroque/HajimeTech/issues/16) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A tela Turmas já permite editar e desativar uma turma, e o front chama as rotas abaixo por `turmasService`. Listar e cadastrar turmas já funcionam no backend. Falta editar e desativar.

## Proposta

Implementar em `backend/src/routes/turmas.js`, no lugar do comentário `PENDENTE`:

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| PUT | `/api/escolas/:escolaId/turmas/:id` | `{ nome, idadeMinima, idadeMaxima, professorId, horarios: [{ diaSemana, horaInicio, horaFim }] }` | `200` com a `Turma` e seus horários |
| PATCH | `/api/escolas/:escolaId/turmas/:id/ativo` | `{ ativo }` | `200` com a `Turma` |

**Regras**

1. Somente administrador e professor (`exigirPerfil('administrador', 'professor')`).
2. Reaproveitar a validação `lerTurma` do cadastro: idade máxima maior ou igual à mínima, pelo menos um horário, fim depois do início e professor da mesma escola.
3. O `PUT` **substitui todos os horários**, dentro de uma transação (`transacao()` de `src/db/index.js`): atualizar a turma, apagar os horários antigos e inserir os novos com `inserirHorarios`.
4. Turma de outra escola ou inexistente responde 404.
5. Desativar é lógico. Os alunos continuam ligados à turma.
6. Resposta montada com `carregarTurmas`, que já junta os horários.

## Como testar

1. Entre como `ana@hajime.local`, abra Turmas, edite os horários da turma Infantil e desative a turma Adulto.
2. Recarregue a página: as mudanças continuam lá, e a turma desativada some do filtro de turmas das outras telas.

## Critérios de aceite

* [ ] Edição substitui os horários em transação
* [ ] Desativação lógica
* [ ] Testes de integração: editar, horário inválido (400), turma de outra escola (404) e desativar
* [ ] Exemplos adicionados ao `backend/client.http`

## Relacionadas

* Base da API: #5
* Contrato: seção 7.4 do `backend/README.md`
