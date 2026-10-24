# #15 Cadastro, edição e desativação de escolas

| Campo | Valor |
|---|---|
| Número | [#15](https://github.com/manroque/HajimeTech/issues/15) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

A tela Escolas (perfil administrador) já tem os botões "Nova escola", editar e desativar, e o front já chama as rotas abaixo por `escolasService` (`frontend/src/services/cadastrosService.ts`). A listagem, o resumo e os professores já funcionam. Falta o lado do servidor das gravações.

## Proposta

Implementar em `backend/src/routes/escolas.js`, no lugar do comentário `PENDENTE`:

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/escolas` | `{ nome, cidade, endereco, telefone, responsavel }` | `201` com a `Escola` criada |
| PUT | `/api/escolas/:id` | o mesmo corpo | `200` com a `Escola` atualizada |
| PATCH | `/api/escolas/:id/ativo` | `{ ativo }` | `200` com a `Escola` |

**Regras**

1. Somente o perfil administrador: use `exigirPerfil('administrador')` de `src/middleware/auth.js`. Os demais recebem 403.
2. `nome` obrigatório (400 com "Informe o nome da escola."); os outros campos são texto opcional.
3. Id em formato inválido ou inexistente responde 404 (use `exigirId` e `naoEncontrado` de `src/lib/http.js`).
4. Desativar é lógico: `UPDATE escolas SET ativo = false`. Nunca apagar.
5. Resposta convertida com `paraEscola` de `src/lib/mapeadores.js`.
6. Atenção à ordem: as rotas `/:id` precisam ser declaradas antes de `router.use('/:escolaId', ...)`.

## Como testar

1. Entre como `admin@hajimetech.local` (senha `hajime123`), vá em Escolas e cadastre, edite e desative uma escola.
2. Entre como `ana@hajime.local` e confira pelo `client.http` que `POST /api/escolas` responde 403.

## Critérios de aceite

* [ ] Três rotas implementadas conforme a tabela
* [ ] Professor e aluno recebem 403
* [ ] Testes de integração: criar, editar, desativar, 403 para professor e 404 para id inexistente
* [ ] Exemplos adicionados ao `backend/client.http`

## Relacionadas

* Base da API: #5
* Contrato: seção 7.3 do `backend/README.md`
