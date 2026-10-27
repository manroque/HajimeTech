# #26 Converter o front para JavaScript (exigência da disciplina)

| Campo | Valor |
|---|---|
| Número | [#26](https://github.com/manroque/HajimeTech/issues/26) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A disciplina exige que o projeto seja desenvolvido em JavaScript. O backend já usava JavaScript, mas o frontend tinha sido escrito em TypeScript.

## O que foi feito

O front inteiro foi convertido para JavaScript, sem mudar o comportamento das telas:

* Os 45 arquivos `.ts` e `.tsx` viraram `.js` e `.jsx`. As anotações de tipo foram removidas automaticamente, e o código foi formatado em seguida. As renomeações foram feitas com `git mv`, então o histórico de cada arquivo continua acessível.
* `frontend/src/types/index.js` passou a documentar o formato de cada entidade em **JSDoc** (comentários padronizados do JavaScript). O VS Code usa essas definições para mostrar os campos de cada objeto, sem depender de TypeScript.
* `tsconfig.json` foi substituído por `jsconfig.json`, que orienta o editor no projeto JavaScript.
* `package.json`: saíram `typescript`, `tsx` e os pacotes `@types`. O `npm run build` agora é só o `vite build`.
* O gerador do seed (`scripts/gerar-seed.js`) roda direto com `node`. Para isso, os imports dos dados de demonstração (`src/mocks`) passaram a usar a extensão `.js`.
* `index.html` aponta para `src/main.jsx`.
* README, `docs/arquitetura.md`, `REQUISITOS.md` e as issues foram atualizados para citar os arquivos `.js` e `.jsx`.
* A etapa do CI passou a se chamar "Frontend (build)".

## Arquivos alterados

* Todos os arquivos de `frontend/src` e `frontend/scripts` (renomeados de `.ts`/`.tsx` para `.js`/`.jsx`)
* `frontend/src/types/index.js` (reescrito em JSDoc)
* `frontend/package.json`, `frontend/package-lock.json`, `frontend/jsconfig.json`, `frontend/index.html`, `frontend/vite.config.js`
* `README.md`, `REQUISITOS.md`, `docs/arquitetura.md`, `backend/README.md`, `database/README.md`, `.github/workflows/ci.yml`

## Como testar

1. `cd frontend`, `npm install` e `npm run build`: o build passa.
2. `npm run gerar-seed`: o seed é gerado sem nenhuma ferramenta de TypeScript.
3. Suba banco, API e front e navegue pelas telas com os três perfis: o comportamento é o mesmo de antes.
4. Busque por arquivos `.ts` ou `.tsx` em `frontend`: não há nenhum.

## Critérios de aceite

* [x] Nenhum arquivo TypeScript no front
* [x] Nenhuma dependência de TypeScript no `package.json`
* [x] Build e gerador do seed funcionando
* [x] Formato das entidades documentado em JSDoc
* [x] Documentação atualizada

## Relacionadas

* #6 (integração do front com a API)
* #23 (como o front foi pensado)
* #12 (o `pnpm-lock.yaml` ficou desatualizado com a saída das dependências de TypeScript; vale resolver junto com a decisão entre npm e pnpm)
