# #9 Remover arquivos da versão antiga do front

| Campo | Valor |
|---|---|
| Número | [#9](https://github.com/manroque/HajimeTech/issues/9) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Quando o front foi reescrito, os arquivos da primeira versão ficaram no repositório. Eles não eram importados por nada, mas confundiam quem abria a pasta `frontend/src`.

## O que foi feito

Foram removidos os arquivos sem uso:

* `frontend/src/App.jsx` e `frontend/src/main.jsx`
* `frontend/src/components/Layout.jsx` e `frontend/src/components/Modal.jsx`
* `frontend/src/pages/Alunos.jsx`, `Curriculo.jsx`, `Dashboard.jsx`, `Frequencia.jsx`, `Graduacoes.jsx` e `Relatorios.jsx`
* `frontend/src/services/api.js` (cliente da API antiga, que usava o cabeçalho `x-academia-id`)
* `frontend/src/styles/index.css`

Também foram corrigidos os comentários de `frontend/src/types/index.js` e `frontend/src/mocks/faixas.js`, que ainda citavam o `schema.sql`. O modelo agora está em `backend/prisma/schema.prisma`.

O código removido continua disponível no histórico do Git.

## Como testar

1. `cd frontend` e `npm run build`: o build passa sem os arquivos removidos.
2. Confira que os arquivos listados acima não existem mais em `frontend/src`.

Observação: depois desta limpeza, o front foi convertido para JavaScript (#26), e por isso hoje existem arquivos `.jsx` novos, como `main.jsx` e `AppRoutes.jsx`. Eles são a versão atual e não têm relação com os arquivos removidos aqui.

## Critérios de aceite

* [x] Nenhum arquivo da versão antiga em `frontend/src`
* [x] Nenhum comentário citando o `schema.sql` removido
* [x] Build do front passando
