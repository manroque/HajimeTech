# #8 Verificação automática a cada pull request (CI)

| Campo | Valor |
|---|---|
| Número | [#8](https://github.com/manroque/HajimeTech/issues/8) |
| Tipo | Tarefa |
| Área | CI |
| Etiquetas | enhancement, ci |
| Situação | Resolvida no PR #25 (falta a regra de proteção da main) |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Até aqui, nada era conferido automaticamente quando alguém abria um pull request. Um erro no build do front ou um teste quebrado no backend só aparecia quando outra pessoa rodava o projeto.

## O que foi feito

Foi criado o workflow `.github/workflows/ci.yml`, que roda a cada pull request e a cada envio para a `main`, com duas etapas independentes:

| Etapa | O que faz |
|---|---|
| Frontend (build) | Instala as dependências com `npm ci` e roda `npm run build`, que gera a versão de produção e falha se houver erro de sintaxe ou import quebrado |
| Backend (testes com banco) | Sobe um PostgreSQL 16 próprio, aplica as migrations do Prisma (`prisma migrate deploy`), carrega o seed (`prisma db seed`) e roda `npm test`, incluindo os testes de integração de #7 |

O resultado aparece direto no pull request, com um sinal verde ou vermelho em cada etapa.

## Arquivos alterados

* `.github/workflows/ci.yml` (novo)

## Como testar

1. Abra um pull request.
2. Na aba "Checks" do pull request, confira as etapas "Frontend (build)" e "Backend (testes com banco)".

## Próximo passo sugerido

Em Settings, Branches, criar uma regra para a `main` exigindo que as duas etapas passem antes de aprovar o pull request. Essa configuração precisa ser feita por quem administra o repositório.

## Critérios de aceite

* [x] Workflow roda a cada pull request
* [x] Front: build verificado
* [x] Backend: migrations, seed e todos os testes com banco
* [ ] Regra de proteção da `main` exigindo o CI (depende de quem administra o repositório)

## Relacionadas

* #7
