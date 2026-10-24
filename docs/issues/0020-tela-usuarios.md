# #20 Tela de usuários

| Campo | Valor |
|---|---|
| Número | [#20](https://github.com/manroque/HajimeTech/issues/20) |
| Tipo | Tarefa |
| Área | Frontend |
| Etiquetas | enhancement, frontend |
| Situação | Aberta |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Não existe tela para cadastrar professores nem para criar o acesso de um aluno. Hoje os usuários só existem pelo `database/seed.sql`. As rotas estão descritas em #13.

## Proposta

1. Criar `frontend/src/pages/UsuariosPage.tsx`, no padrão das outras telas (`CabecalhoPagina`, tabela, `Modal` para o formulário, `Confirmacao` para desativar).
2. Criar `usuariosService.listar`, `criar` e `definirAtivo` em `frontend/src/services/cadastrosService.ts` (o objeto `usuariosService` já existe).
3. Registrar a rota `/usuarios` em `frontend/src/AppRoutes.tsx` e o item "Usuários" no grupo "Academia" do menu (`components/layout/AppLayout.tsx`), visível para administrador e professor.
4. No perfil do aluno (`components/PerfilAluno.tsx`), um botão "Criar acesso" para gerar o login do aluno, quando ele ainda não tiver um.
5. Acrescentar a permissão `gerenciarUsuarios` em `frontend/src/utils/permissoes.ts`.
6. Formulário com validação: nome, email, perfil e senha inicial (mínimo de 8 caracteres).

## Critérios de aceite

* [ ] Tela lista, cria e desativa usuários
* [ ] Professor só vê a opção de criar acesso de aluno
* [ ] Mensagens de erro da API exibidas (ex.: email repetido)
* [ ] Responsiva e acessível, como as demais telas

## Relacionadas

* Depende de #13 (rotas)
