# #24 Desenho da arquitetura do projeto

| Campo | Valor |
|---|---|
| Número | [#24](https://github.com/manroque/HajimeTech/issues/24) |
| Tipo | Documentação |
| Área | Documentação |
| Etiquetas | documentation |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

O projeto tinha documentação de cada parte (`backend/README.md`, `database/README.md`), mas faltava um desenho de como as partes se encaixam e por que foram organizadas assim.

## O que foi feito

Foi criado `docs/arquitetura.md`, com diagramas em Mermaid (o GitHub mostra os desenhos direto na página):

| Seção | Desenho |
|---|---|
| 1. Visão geral | Usuário, frontend, API, banco, migrations e seed |
| 2. Como o front foi pensado | Camadas: telas, componentes, contextos, services e cliente HTTP |
| 3. Caminho de uma requisição | Sequência completa da tela de Alunos até o banco e de volta |
| 4. Organização da API | Middlewares, validação, consulta, conversão e tratamento de erros |
| 5. Perfis e permissões | O que cada perfil acessa a partir do token |
| 6. Modelo de dados | Relacionamento entre as tabelas |
| 7. Ambiente de desenvolvimento | Docker, backend, frontend e CI |
| 8. Onde mexer | Tabela com os arquivos de cada tipo de mudança |

**Principais decisões registradas**

* A segurança fica no servidor; o front só esconde o que o perfil não pode usar.
* Rotas aninhadas por escola (`/api/escolas/:escolaId/...`), conferidas em um único middleware.
* SQL direto com `pg` e Prisma só para as migrations.
* Erros centralizados, sempre no formato `{ "erro": "..." }`.
* Transações nas operações compostas.

O README principal ganhou um resumo da arquitetura com link para o documento completo.

## Arquivos alterados

* `docs/arquitetura.md` (novo)
* `README.md` (seção Arquitetura)

## Como conferir

Abra `docs/arquitetura.md` no GitHub: os diagramas aparecem desenhados.

## Critérios de aceite

* [x] Visão geral do sistema
* [x] Camadas do front e da API
* [x] Caminho de uma requisição
* [x] Perfis, modelo de dados e ambiente

## Relacionadas

* #23 (como o front foi pensado)
* #11 (padrão de issues)
