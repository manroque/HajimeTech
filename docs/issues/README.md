# Dicionário de issues do HajimeTech

Cópia organizada das issues do GitHub, para encontrar rápido o que já foi registrado, o que foi feito e o que falta. Cada issue tem uma ficha nesta pasta, com o mesmo texto publicado no GitHub.

As issues oficiais ficam em https://github.com/manroque/HajimeTech/issues

## Resumo

| Situação | Quantidade |
|---|---:|
| Tarefas abertas do backend | 6 |
| Tarefas abertas do frontend | 6 |
| Resolvidas no PR #25 | 9 |
| Total | 21 |

## Índice geral

| Nº | Título | Tipo | Área | Situação | Ficha |
|---:|---|---|---|---|---|
| [#5](https://github.com/manroque/HajimeTech/issues/5) | Reescrever a API sobre o modelo atual do banco | Bug | Backend, Banco de dados | Resolvida no PR #25 | [0005](0005-base-da-api.md) |
| [#6](https://github.com/manroque/HajimeTech/issues/6) | Ligar todas as telas do front à API | Tarefa | Frontend | Resolvida no PR #25 | [0006](0006-ligar-telas-api.md) |
| [#7](https://github.com/manroque/HajimeTech/issues/7) | Testes de integração com banco de verdade | Tarefa | Backend | Resolvida no PR #25 | [0007](0007-testes-integracao-banco.md) |
| [#8](https://github.com/manroque/HajimeTech/issues/8) | Verificação automática a cada pull request (CI) | Tarefa | CI | Resolvida no PR #25 | [0008](0008-verificacao-automatica-ci.md) |
| [#9](https://github.com/manroque/HajimeTech/issues/9) | Remover arquivos da versão antiga do front | Tarefa | Frontend | Resolvida no PR #25 | [0009](0009-remover-front-antigo.md) |
| [#10](https://github.com/manroque/HajimeTech/issues/10) | Navegação por teclado nas abas e seletores de opção | Acessibilidade | Frontend | Aberta | [0010](0010-navegacao-teclado.md) |
| [#11](https://github.com/manroque/HajimeTech/issues/11) | Padrão de issues e dicionário em docs/issues | Documentação | Documentação | Resolvida no PR #25 | [0011](0011-padrao-dicionario-issues.md) |
| [#12](https://github.com/manroque/HajimeTech/issues/12) | Front com dois gerenciadores de pacotes (npm e pnpm) | Bug | Frontend | Aberta (aguarda decisão do grupo) | [0012](0012-gerenciador-pacotes.md) |
| [#13](https://github.com/manroque/HajimeTech/issues/13) | Rotas de usuários, troca de senha e critérios de avaliação | Tarefa | Backend | Aberta | [0013](0013-rotas-usuarios-senha-criterios.md) |
| [#14](https://github.com/manroque/HajimeTech/issues/14) | Testes automatizados do front | Tarefa | Frontend | Aberta | [0014](0014-testes-front.md) |
| [#15](https://github.com/manroque/HajimeTech/issues/15) | Cadastro, edição e desativação de escolas | Tarefa | Backend | Aberta | [0015](0015-cadastro-escolas.md) |
| [#16](https://github.com/manroque/HajimeTech/issues/16) | Edição e desativação de turmas | Tarefa | Backend | Aberta | [0016](0016-editar-desativar-turmas.md) |
| [#17](https://github.com/manroque/HajimeTech/issues/17) | Reordenação de categorias e técnicas do currículo | Tarefa | Backend | Aberta | [0017](0017-reordenar-curriculo.md) |
| [#18](https://github.com/manroque/HajimeTech/issues/18) | Registro de avaliação de desempenho | Tarefa | Backend | Aberta | [0018](0018-registrar-avaliacao.md) |
| [#19](https://github.com/manroque/HajimeTech/issues/19) | Tipos de premiação e concessão aos alunos | Tarefa | Backend | Aberta | [0019](0019-premiacoes.md) |
| [#20](https://github.com/manroque/HajimeTech/issues/20) | Tela de usuários | Tarefa | Frontend | Aberta | [0020](0020-tela-usuarios.md) |
| [#21](https://github.com/manroque/HajimeTech/issues/21) | Edição dos critérios de avaliação | Tarefa | Frontend | Aberta | [0021](0021-edicao-criterios.md) |
| [#22](https://github.com/manroque/HajimeTech/issues/22) | Troca de senha | Tarefa | Frontend | Aberta | [0022](0022-troca-senha.md) |
| [#23](https://github.com/manroque/HajimeTech/issues/23) | Como o front foi pensado | Documentação | Frontend, Documentação | Resolvida no PR #25 | [0023](0023-como-o-front-foi-pensado.md) |
| [#24](https://github.com/manroque/HajimeTech/issues/24) | Desenho da arquitetura do projeto | Documentação | Documentação | Resolvida no PR #25 | [0024](0024-arquitetura-do-projeto.md) |
| [#26](https://github.com/manroque/HajimeTech/issues/26) | Converter o front para JavaScript (exigência da disciplina) | Tarefa | Frontend | Resolvida no PR #25 | [0026](0026-front-em-javascript.md) |

## Tarefas abertas por área

**Backend**

| Nº | Tarefa | Onde implementar |
|---:|---|---|
| #15 | Cadastro, edição e desativação de escolas | `backend/src/routes/escolas.js` |
| #16 | Edição e desativação de turmas | `backend/src/routes/turmas.js` |
| #17 | Reordenação de categorias e técnicas do currículo | `backend/src/routes/curriculo.js` |
| #18 | Registro de avaliação de desempenho | `backend/src/routes/avaliacoes.js` |
| #19 | Tipos de premiação e concessão aos alunos | `backend/src/routes/premiacoes.js` |
| #13 | Rotas de usuários, troca de senha e critérios de avaliação | `backend/src/routes` (arquivo novo) |

As pendências de #15 a #19 estão marcadas no código com um comentário `PENDENTE`, e as telas já chamam essas rotas.

**Frontend**

| Nº | Tarefa | Depende de |
|---:|---|---|
| #10 | Navegação por teclado nas abas e seletores de opção | nada |
| #12 | Definir um único gerenciador de pacotes | decisão do grupo |
| #14 | Testes automatizados do front | nada |
| #20 | Tela de usuários | #13 |
| #21 | Edição dos critérios de avaliação | #13 |
| #22 | Troca de senha | #13 |

## Resolvidas

| Nº | Assunto |
|---:|---|
| #5 | Base da API sobre o modelo atual |
| #6 | Telas ligadas à API |
| #7 | Testes de integração com banco |
| #8 | CI a cada pull request |
| #9 | Remoção do front antigo |
| #11 | Padrão de issues e este dicionário |
| #23 | Como o front foi pensado |
| #24 | Desenho da arquitetura |
| #26 | Front convertido para JavaScript |

## Pull requests

| PR | Título | Autoria |
|---:|---|---|
| [#3](https://github.com/manroque/HajimeTech/pull/3) | Front em TypeScript, banco de dados modelado e documentação | pivetadev |
| [#4](https://github.com/manroque/HajimeTech/pull/4) | Implement login (Prisma, login com email e senha, client.http) | robertvitoriano |
| [#25](https://github.com/manroque/HajimeTech/pull/25) | Base da API, integração do front, testes, CI e documentação | pivetadev |

## Como procurar

* **Por número:** as fichas começam com o número da issue com quatro dígitos (`0005`, `0015`...).
* **Por assunto, no VS Code:** abra a busca com `Ctrl+Shift+F`, digite a palavra (por exemplo, "currículo") e limite a busca a `docs/issues`.
* **Pelo terminal:** `git grep -n "frequência" -- docs/issues`
* **No GitHub:** filtre pelas etiquetas, por exemplo `label:backend is:open`.

## Etiquetas

| Etiqueta | Uso |
|---|---|
| `bug` | Algo que não funciona como deveria |
| `enhancement` | Funcionalidade nova ou melhoria |
| `accessibility` | Acessibilidade (teclado, leitor de tela, contraste) |
| `documentation` | Documentação |
| `backend` | API, rotas e regras no servidor |
| `frontend` | Telas, componentes e services do front |
| `banco de dados` | Modelo, migrations e seed |
| `ci` | Verificação automática e GitHub Actions |

## Como registrar uma nova issue

1. No GitHub, clique em "New issue" e escolha o modelo **Tarefa** ou **Bug** (ficam em `.github/ISSUE_TEMPLATE`).
2. Preencha todas as seções e marque as etiquetas de tipo e de área.
3. Crie a ficha nesta pasta com o número e um nome curto, por exemplo `0030-exportar-relatorio.md`, copiando o texto da issue e o quadro de informações do topo.
4. Acrescente a issue no índice geral e na tabela da sua área.
5. Quando a issue for resolvida, atualize a situação na ficha e no índice, citando o pull request.
