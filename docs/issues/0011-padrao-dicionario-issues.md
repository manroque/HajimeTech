# #11 Padrão de issues e dicionário em docs/issues

| Campo | Valor |
|---|---|
| Número | [#11](https://github.com/manroque/HajimeTech/issues/11) |
| Tipo | Documentação |
| Área | Documentação |
| Etiquetas | documentation |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Com o projeto crescendo, as tarefas começaram a se espalhar entre conversas e descrições de pull request. Faltava um padrão para abrir issues e um jeito rápido de procurar o que já foi registrado.

## O que foi feito

* **Modelos de issue** em `.github/ISSUE_TEMPLATE`: "Tarefa" (contexto, proposta, arquivos, como testar, critérios de aceite e relacionadas) e "Bug" (o que acontece, o que deveria acontecer, como reproduzir e critérios de aceite). Eles aparecem automaticamente ao clicar em "New issue".
* **Dicionário de issues** em `docs/issues`:
  * `README.md` com o índice geral, organizado por número, por área (backend, frontend, banco de dados, CI, documentação) e por situação, e com dicas de busca.
  * Uma ficha por issue (`NNNN-assunto.md`), com o mesmo conteúdo da issue no GitHub. Assim dá para procurar pelo editor ou pelo terminal, mesmo sem internet.
* **Etiquetas por área** no repositório (`backend`, `frontend`, `banco de dados`, `ci`), além das que já existiam (`bug`, `enhancement`, `accessibility`, `documentation`).

## Como manter o dicionário

1. Abra a issue no GitHub usando um dos modelos.
2. Crie a ficha em `docs/issues` com o número da issue e um nome curto, por exemplo `0020-exportar-relatorio.md`.
3. Acrescente uma linha no índice de `docs/issues/README.md`.
4. Quando a issue for resolvida, atualize a situação na ficha e no índice.

## Arquivos alterados

* `.github/ISSUE_TEMPLATE/tarefa.md`, `bug.md`, `config.yml` (novos)
* `docs/issues/README.md` e as fichas de cada issue (novos)
* `README.md` (estrutura do projeto e próximos passos)

## Critérios de aceite

* [x] Modelos disponíveis ao abrir uma issue
* [x] Índice com busca por número, área e situação
* [x] Uma ficha para cada issue registrada
