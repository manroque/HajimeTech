# #22 Troca de senha

| Campo | Valor |
|---|---|
| Número | [#22](https://github.com/manroque/HajimeTech/issues/22) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Todos os usuários de demonstração entram com a mesma senha, e não há como o usuário trocar a própria senha.

## Proposta

1. No topo da tela (`components/layout/AppLayout.jsx`), ao lado do nome do usuário, um botão "Trocar senha" que abre um `Modal`.
2. Campos: senha atual, nova senha e confirmação da nova senha.
3. Validações no front: nova senha com pelo menos 8 caracteres e confirmação igual.
4. Criar `authService.trocarSenha(senhaAtual, novaSenha)` em `frontend/src/services/cadastrosService.js`, chamando `POST /api/auth/trocar-senha`.
5. Mensagem de sucesso com o `useToast` e mensagem clara quando a senha atual estiver errada.

## Critérios de aceite

* [ ] Modal acessível pelo topo em qualquer tela
* [ ] Validações de tamanho e confirmação
* [ ] Erro da API exibido quando a senha atual estiver errada
* [ ] Funciona para os três perfis

## Relacionadas

* Depende de #13 (rota de troca de senha)
