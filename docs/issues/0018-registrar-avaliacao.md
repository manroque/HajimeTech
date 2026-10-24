# #18 Registro de avaliação de desempenho

| Campo | Valor |
|---|---|
| Número | [#18](https://github.com/manroque/HajimeTech/issues/18) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A tela Avaliações já mostra o histórico e o gráfico de evolução, e o modal "Nova avaliação" já envia as notas por `avaliacoesService.criar`. Os critérios e a listagem funcionam no backend. Falta registrar a avaliação.

## Proposta

Implementar em `backend/src/routes/avaliacoes.js`, no lugar do comentário `PENDENTE`:

`POST /api/escolas/:escolaId/avaliacoes`

```json
{
  "alunoId": "00000005-0000-4000-8000-000000000001",
  "data": "2026-10-20",
  "observacoes": "Mais concentrado nos treinos.",
  "notas": [
    { "criterioId": "0000000b-0000-4000-8000-000000000001", "nota": 4 }
  ]
}
```

Resposta: `201` com a `Avaliacao`, incluindo a lista `notas`.

**Regras**

1. Somente administrador e professor.
2. Aluno da escola (404 se não existir; use `obterAluno` de `src/routes/alunos.js`).
3. Data válida e não futura (400).
4. Uma nota para **cada** critério ativo da escola, sem repetir e sem critério de outra escola (400 "Dê uma nota para cada critério de avaliação da escola.").
5. Notas inteiras de 1 a 5 (400 "As notas devem estar entre 1 e 5.").
6. `avaliador_id` é o usuário do token (`req.usuario.id`).
7. Gravar `avaliacoes` e `avaliacao_notas` na mesma transação e responder com a função `comNotas`, que já existe no arquivo.

## Como testar

1. Entre como `ana@hajime.local`, abra Avaliações, escolha um aluno e registre uma avaliação.
2. O gráfico de evolução ganha um ponto novo, e o perfil do aluno mostra a avaliação.

## Critérios de aceite

* [ ] Rota implementada em transação
* [ ] Validações de critérios e notas
* [ ] Testes de integração: avaliação completa, avaliação incompleta (400), nota fora de 1 a 5 (400) e perfil aluno (403)
* [ ] Exemplo adicionado ao `backend/client.http`

## Relacionadas

* Base da API: #5
* Regra 10 da seção 6 do `backend/README.md`
