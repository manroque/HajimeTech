# #5 Reescrever a API sobre o modelo atual do banco

| Campo | Valor |
|---|---|
| Número | [#5](https://github.com/manroque/HajimeTech/issues/5) |
| Tipo | Bug |
| Área | Backend, Banco de dados |
| Etiquetas | bug, backend, banco de dados |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Depois do PR #4, o banco passou a ser controlado pelas migrations do Prisma (`backend/prisma/migrations/0_init`). O login foi implementado sobre esse modelo, mas as demais rotas da API continuavam escritas para o banco da primeira versão do projeto.

## Problema

As rotas em `backend/src/routes` consultavam tabelas e colunas que não existem mais:

| Rota antiga | O que ela usava | O que existe no banco atual |
|---|---|---|
| `/api/curriculo` | `curriculo_categorias`, `curriculo_itens` | `categorias_curriculo`, `tecnicas` |
| `/api/tecnico` | `acompanhamento_tecnico` | `tecnicas_aluno` |
| `/api/alunos`, `/api/turmas`, `/api/graduacoes`, `/api/frequencias`, `/api/dashboard` | `faixa_atual`, `horario`, `faixa_etaria`, `academia_id` | `faixa_id`, `horarios_turma`, `idade_minima` e `idade_maxima`, `escola_id` |

Na prática, currículo e acompanhamento técnico falhavam ao serem chamados, e as outras rotas devolviam dados num formato diferente do que o front espera. Os testes passavam porque não acessavam o banco de verdade.

## O que foi feito

A base da API foi reescrita sobre o modelo atual, seguindo o contrato da seção 7 do `backend/README.md`. Foram mantidos o padrão do projeto (Express com o driver `pg`) e o login do PR #4.

**Estrutura**

* Todas as rotas de dados ficam em `/api/escolas/:escolaId/...`, e a escola vem da URL, nunca de cabeçalhos.
* `src/middleware/escola.js` confere a escola da URL contra o token. Professor e aluno só acessam a própria escola (403), e uma escola inexistente responde 404.
* O perfil aluno é somente leitura e só enxerga os próprios dados. Nas listagens com `?alunoId=`, o servidor força o aluno do token.
* `src/lib/http.js` concentra os erros (400, 403, 404, 422), as validações e o envio de erros assíncronos para o tratamento central.
* `src/lib/mapeadores.js` converte as linhas do banco para o formato do front (camelCase, horas `HH:MM`, datas `AAAA-MM-DD`).
* `src/db/index.js` lê colunas `DATE` como texto, para o fuso não trocar o dia, e oferece `transacao()` para operações compostas.
* O tratamento de erros do `app.js` devolve sempre `{ "erro": "..." }` e converte erros do banco (gatilho, unicidade, formato inválido) no status certo.

**Rotas implementadas**

* Faixas: `GET /api/faixas`
* Escolas: listar, resumo e professores da escola
* Turmas: listar e cadastrar com vários horários
* Alunos: listar com busca que ignora acentos, obter, criar, editar, excluir (desativação lógica) e reativar
* Frequência: folha de chamada por turma e data, gravação em lote sem duplicar e histórico do aluno
* Graduações: histórico e registro em transação, guardando a faixa anterior e atualizando a faixa atual
* Currículo: listar por faixa; criar, editar e excluir categoria (desativa também as técnicas); criar, editar, desativar e reativar técnica; lista geral de técnicas
* Acompanhamento técnico: níveis do aluno, gravação do nível e progresso na faixa atual
* Avaliações: critérios e histórico com notas
* Premiações: listagem dos tipos e das premiações concedidas
* Painel: todos os indicadores calculados no servidor

**Regras de negócio garantidas pelo servidor**

* Nada é apagado: alunos, técnicas e categorias são desativados.
* Graduação só para uma faixa superior à atual.
* Marrom e Preta não aceitam currículo (422), com o gatilho do banco como segunda barreira.
* Nova categoria ou técnica entra no fim da lista.
* Professor de uma turma precisa ser da mesma escola.

**Arquivos removidos**

* `backend/src/routes/tecnico.js` (substituído pelas rotas de técnicas do aluno em `alunos.js`)
* `backend/src/middleware/tenant.js` (substituído por `middleware/escola.js`)

## Pendências (tarefas do grupo)

As rotas abaixo ficaram como tarefas separadas. O front já chama todas elas, e o lugar no código está marcado com um comentário `PENDENTE`.

* #15 Cadastro, edição e desativação de escolas
* #16 Edição e desativação de turmas
* #17 Reordenação de categorias e técnicas do currículo
* #18 Registro de avaliação de desempenho
* #19 Tipos de premiação e concessão aos alunos
* #13 Rotas de usuários, troca de senha e critérios de avaliação

## Arquivos alterados

* `backend/src/app.js`
* `backend/src/db/index.js`
* `backend/src/lib/http.js`, `backend/src/lib/mapeadores.js`, `backend/src/lib/datas.js` (novos)
* `backend/src/middleware/auth.js`, `backend/src/middleware/escola.js` (novo)
* `backend/src/routes/escolas.js`, `faixas.js`, `avaliacoes.js`, `premiacoes.js` (novos)
* `backend/src/routes/alunos.js`, `turmas.js`, `frequencias.js`, `graduacoes.js`, `curriculo.js`, `dashboard.js` (reescritos)
* `backend/tests/auth.test.js`, `backend/tests/curriculo.test.js` (ajustados para as rotas novas)
* `backend/README.md` (situação, estrutura do código, pendências e testes)

## Como testar

1. Suba o banco: `cd database` e `docker compose up -d`.
2. Rode a API: `cd backend`, `npm install`, copie `.env.example` para `.env` e rode `npm run dev`.
3. Faça login pelo `client.http` ou pelo front com `ana@hajime.local` e senha `hajime123`.
4. Rode os testes com banco: defina `TEST_DATABASE_URL=postgresql://hajimetech:hajimetech@localhost:5433/hajimetech` e rode `npm test`.

## Critérios de aceite

* [x] Nenhuma rota consulta tabelas do modelo antigo
* [x] Rotas implementadas respondem no formato dos tipos do front
* [x] Professor e aluno não acessam outra escola, nem trocando o id na URL
* [x] Aluno não escreve nada e só lê os próprios dados
* [x] Pendências registradas em issues próprias
* [x] Testes unitários e de integração passando

## Relacionadas

* PR #4 (login e Prisma), que definiu o modelo usado aqui
* Pendências: #13, #15, #16, #17, #18, #19
