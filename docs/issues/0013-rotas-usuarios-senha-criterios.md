# #13 Rotas de usuários, troca de senha e critérios de avaliação

| Campo | Valor |
|---|---|
| Número | [#13](https://github.com/manroque/HajimeTech/issues/13) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Os usuários (administrador, professores e acessos de alunos) e os critérios de avaliação existem no banco, mas hoje só podem ser criados pelo `database/seed.sql` ou direto no banco. Não há rotas para isso. As telas correspondentes estão em #20, #21 e #22.

## Proposta

1. `GET /api/escolas/:escolaId/usuarios`: lista professores e acessos de alunos da escola (administrador e professor).
2. `POST /api/escolas/:escolaId/usuarios` com `{ nome, email, perfil, alunoId, senha }`: cria um professor ou um acesso de aluno. A senha é guardada em hash com `bcryptjs`, como já faz `src/routes/auth.js`.
3. `PATCH /api/escolas/:escolaId/usuarios/:id/ativo` com `{ ativo }`: desativa ou reativa o acesso.
4. `POST /api/auth/trocar-senha` com `{ senhaAtual, novaSenha }`: o próprio usuário troca a senha.
5. Critérios de avaliação: `POST`, `PUT` e `PATCH .../criterios-avaliacao/:id/ativo`, além de `PATCH .../criterios-avaliacao/reordenar`. Ficam em `src/routes/avaliacoes.js`.
6. Email repetido responde 409 (o `app.js` já converte o erro de unicidade do banco).

**Regras de permissão**

* Administrador cria professores em qualquer escola; professor, apenas acessos de alunos da própria escola.
* Um acesso de aluno precisa apontar para um aluno ativo da mesma escola.
* A senha nunca é devolvida pela API (use `paraUsuario` de `src/lib/mapeadores.js`).

## Arquivos envolvidos

* `backend/src/routes/usuarios.js` (novo), montado em `src/routes/escolas.js`
* `backend/src/routes/auth.js`
* `backend/src/routes/avaliacoes.js`
* `backend/tests/integracao.test.js`

## Critérios de aceite

* [ ] Administrador cria professores em qualquer escola; professor, só acessos de alunos na própria
* [ ] Senha guardada em hash e nunca devolvida
* [ ] Troca de senha confere a senha atual
* [ ] Critérios de avaliação editáveis pela API
* [ ] Testes de integração cobrindo as permissões
* [ ] Rotas documentadas no `backend/README.md` e no `client.http`

## Relacionadas

* Usa a estrutura de rotas e permissões de #5
* Telas: #20, #21 e #22
