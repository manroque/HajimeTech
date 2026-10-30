# #12 Front com dois gerenciadores de pacotes (npm e pnpm)

| Campo | Valor |
|---|---|
| Número | [#12](https://github.com/manroque/HajimeTech/issues/12) |
| Tipo | Bug |
| Área | Frontend |
| Etiquetas | bug, frontend |
| Situação | Resolvida (decisão: npm) |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A pasta `frontend` tem dois arquivos de lock ao mesmo tempo:

* `package-lock.json` (npm), que já existia
* `pnpm-lock.yaml` e `pnpm-workspace.yaml` (pnpm), adicionados no PR #4

## Problema

Cada gerenciador lê o seu próprio arquivo. Quem roda `npm install` e quem roda `pnpm install` pode acabar com versões diferentes das dependências, e um dos arquivos sempre fica desatualizado em relação ao outro.

Hoje o README orienta usar `npm`, e o CI de #8 instala com `npm ci`. O `package-lock.json` está em sincronia com o `package.json` (conferido com `npm ci`).

## Proposta

1. O grupo decide qual gerenciador vai usar.
2. Se for o **npm**: remover `pnpm-lock.yaml` e `pnpm-workspace.yaml`.
3. Se for o **pnpm**: remover `package-lock.json`, adicionar `"packageManager": "pnpm@<versão>"` no `package.json`, trocar os comandos do README (`pnpm install`, `pnpm dev`) e ajustar o CI para usar `pnpm install --frozen-lockfile`.
4. Fazer o mesmo no `backend`, para o projeto inteiro usar um gerenciador só.

## Decisão

O grupo escolheu o **npm**. Todo o projeto já usava npm (README, CI de #8, `database/migrate.Dockerfile` e o `package-lock.json` do backend), e o `package-lock.json` do front estava em sincronia com o `package.json`. A ação foi remover os arquivos do pnpm do `frontend`.

## Critérios de aceite

* [x] Decisão registrada nesta issue — **npm**
* [x] Um único arquivo de lock em `frontend` e em `backend` — `package-lock.json` nos dois
* [x] README e CI usando o gerenciador escolhido — já usavam npm

## Relacionadas

* PR #4, que adicionou o `pnpm-lock.yaml`
* #8
