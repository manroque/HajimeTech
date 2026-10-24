# #6 Ligar todas as telas do front à API

| Campo | Valor |
|---|---|
| Número | [#6](https://github.com/manroque/HajimeTech/issues/6) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

O front foi construído com uma camada de services (`frontend/src/services`) que simulava a API num banco em memória (`mockDb.ts`), para as telas ficarem prontas antes do backend. Com a base da API pronta (#5), essa simulação deixou de fazer sentido.

## Problema

Só o login usava a API. Todas as outras telas liam e gravavam dados simulados no navegador, então nada do que era cadastrado chegava ao banco, e as permissões eram conferidas só no próprio front.

## O que foi feito

* Cada função dos services passou a chamar a rota real correspondente, **mantendo a mesma assinatura**. Por isso nenhuma tela precisou mudar a forma de buscar dados.
* `services/http.js` ganhou `consulta()`, que monta a query string ignorando valores vazios, e `daEscola()`, que gera o prefixo `/escolas/:escolaId`. Também passou a tratar respostas `204` sem corpo.
* `ErroApi` foi para `services/erros.js`, separado do cliente HTTP.
* `services/mockDb.ts` foi removido, junto com o botão "Restaurar dados de exemplo" do menu e a função `definirUsuarioSessao` do `AuthContext`.
* A tela de Currículo passou a enviar a ordem completa ao subir ou descer um item, com a nova função `moverNaLista` e as funções `reordenarCategorias` e `reordenarTecnicas`, seguindo a decisão registrada no `backend/README.md`.
* A pasta `frontend/src/mocks` continua existindo, mas só como fonte do `database/seed.sql` (`npm run gerar-seed`). As telas não usam mais esses dados.

**Ações que dependem de tarefas do backend**

O front já chama as rotas abaixo. Enquanto elas não forem implementadas, a tela mostra a mensagem "Rota não encontrada" ao tentar a ação:

| Ação na tela | Issue do backend |
|---|---|
| Nova escola, editar e desativar escola | #15 |
| Editar e desativar turma | #16 |
| Subir e descer itens do currículo | #17 |
| Nova avaliação | #18 |
| Premiações: criar, editar, desativar, conceder e remover | #19 |

## Arquivos alterados

* `frontend/src/services/http.js`, `erros.js` (novo), `index.js`
* `frontend/src/services/cadastrosService.js`, `alunosService.js`, `curriculoService.js`, `desempenhoService.js`, `dashboardService.js`
* `frontend/src/services/mockDb.ts` (removido)
* `frontend/src/contexts/AuthContext.jsx`
* `frontend/src/components/layout/AppLayout.jsx` e `AppLayout.module.css`
* `frontend/src/pages/CurriculoPage.jsx`, `FrequenciaPage.jsx`
* `frontend/src/utils/formatacao.js`, `frontend/src/types/index.js`, `frontend/src/mocks/index.js`, `frontend/src/mocks/faixas.js` (comentários)

## Como testar

1. Suba banco e API como descrito em #5.
2. No front: `cd frontend`, `npm install`, copie `.env.example` para `.env` e rode `npm run dev`.
3. Entre como `ana@hajime.local` (senha `hajime123`), cadastre um aluno e recarregue a página: o aluno continua lá, porque foi gravado no banco.
4. Entre como `lucas@aluno.local` e confira que só aparecem "Minha evolução" e "Currículo", sem botões de edição.

## Critérios de aceite

* [x] Nenhuma tela usa dados simulados
* [x] `mockDb.ts` removido
* [x] Todas as telas carregam com os três perfis (verificado chamada a chamada contra a API)
* [x] Build de produção do front passando

## Relacionadas

* Depende de #5
* Ações que aguardam o backend: #15, #16, #17, #18, #19
