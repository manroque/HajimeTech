# #17 Reordenação de categorias e técnicas do currículo

| Campo | Valor |
|---|---|
| Número | [#17](https://github.com/manroque/HajimeTech/issues/17) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Na tela Currículo, os botões de subir e descer já montam a lista completa na nova ordem (função `moverNaLista`) e chamam `reordenarCategorias` e `reordenarTecnicas` em `frontend/src/services/curriculoService.ts`. Falta o servidor gravar a nova ordem.

## Proposta

Implementar em `backend/src/routes/curriculo.js`, no lugar do comentário `PENDENTE`:

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| PATCH | `/api/escolas/:escolaId/curriculo/categorias/reordenar` | `{ ids: [...] }` | `204` |
| PATCH | `/api/escolas/:escolaId/curriculo/tecnicas/reordenar` | `{ categoriaId, ids: [...] }` | `204` |

**Regras**

1. Somente administrador e professor.
2. Categorias: `ids` deve conter **exatamente** as categorias ativas de uma faixa da escola, cada uma uma vez. Use a primeira categoria da lista para descobrir a faixa.
3. Técnicas: `ids` deve conter exatamente as técnicas ativas da categoria informada.
4. Lista incompleta, repetida ou com item de outro grupo responde 400 ("Envie todos os itens do grupo, cada um uma vez, na nova ordem.").
5. Gravar `ordem` como 1, 2, 3... dentro de uma transação.
6. Declare `/categorias/reordenar` antes de qualquer rota `/categorias/:id` que use o mesmo método, para o Express não confundir "reordenar" com um id.

## Como testar

1. Entre como `ana@hajime.local`, abra Currículo, faixa Branca, e use as setas de subir e descer em categorias e técnicas.
2. Recarregue a página: a nova ordem continua lá.

## Critérios de aceite

* [ ] Duas rotas implementadas, em transação
* [ ] 400 para listas incompletas, repetidas ou de outro grupo
* [ ] Testes de integração: reordenar categorias, reordenar técnicas e lista inválida
* [ ] Exemplos adicionados ao `backend/client.http`

## Relacionadas

* Base da API: #5
* Regra 6 da seção 6 do `backend/README.md`
