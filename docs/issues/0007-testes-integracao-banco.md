# #7 Testes de integração com banco de verdade

| Campo | Valor |
|---|---|
| Número | [#7](https://github.com/manroque/HajimeTech/issues/7) |
| Tipo | Tarefa |
| Área | Backend |
| Etiquetas | enhancement, backend |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Os testes do backend (`auth.test.js` e `curriculo.test.js`) simulam o banco. Eles são úteis para o login, mas não percebem quando uma rota consulta uma tabela que não existe, que foi exatamente o problema descrito em #5.

## O que foi feito

Foi criado `backend/tests/integracao.test.js`, que roda contra um PostgreSQL de verdade com as migrations do Prisma e o `database/seed.sql` aplicados. Ele entra com usuários reais do seed (administrador, professor e aluno) e percorre o que já está implementado:

| Área | O que é verificado |
|---|---|
| Faixas e escolas | 8 faixas na ordem certa, Marrom e Preta sem conteúdo; administrador vê todas as escolas e professor só a sua |
| Isolamento | Professor não lê alunos de outra escola (403); aluno de outra escola responde 404 até para o administrador |
| Alunos | Busca ignorando acentos; cadastro, exclusão lógica e reativação; nome obrigatório |
| Perfil aluno | Lê o próprio cadastro e progresso; não lê outro aluno; listagens devolvem só os próprios dados; não escreve e não vê o painel |
| Turmas | Recusa horário com fim antes do início; devolve horas no formato `HH:MM` |
| Currículo | Marrom recusa categoria (422); técnica desativada some da lista sem ser apagada |
| Graduações | Recusa voltar de faixa; ao graduar, guarda a faixa anterior e atualiza a faixa do aluno |
| Frequência | Grava e corrige a chamada sem duplicar registros |
| Painel | Devolve todos os indicadores |

Sem a variável `TEST_DATABASE_URL`, esses testes são pulados, para quem não tem o banco rodando continuar conseguindo rodar `npm test`.

Os testes de rotas protegidas do `auth.test.js` foram atualizados para as rotas novas, incluindo os casos de escola de outro usuário (403), escola inexistente (404) e id em formato inválido.

Resultado: **39 testes passando** (22 unitários e 17 de integração).

## O que fica para o grupo

Cada tarefa pendente do backend (#13, #15, #16, #17, #18 e #19) tem, nos critérios de aceite, os testes de integração da sua parte. Os testes devem seguir o modelo de `integracao.test.js`: entrar com um usuário do seed e conferir resposta, permissões e efeito no banco.

## Arquivos alterados

* `backend/tests/integracao.test.js` (novo)
* `backend/tests/auth.test.js`
* `backend/tests/curriculo.test.js`
* `backend/src/db/index.js` (variável opcional `DB_POOL_MAX` para limitar conexões)
* `backend/README.md` (seção Testes)

## Como testar

```bash
cd database
docker compose up -d
cd ../backend
TEST_DATABASE_URL=postgresql://hajimetech:hajimetech@localhost:5433/hajimetech npm test
```

No PowerShell: `$env:TEST_DATABASE_URL="postgresql://hajimetech:hajimetech@localhost:5433/hajimetech"; npm test`

Os testes de integração alteram dados (criam alunos, graduações etc.). Para voltar ao estado original: `docker compose down -v` e `docker compose up -d`.

## Critérios de aceite

* [x] Testes com banco de verdade cobrindo permissões por perfil
* [x] Isolamento entre as duas escolas do seed
* [x] Exclusão lógica e bloqueio de currículo em Marrom e Preta
* [x] Testes pulados automaticamente quando não há banco configurado
* [ ] Testes das rotas pendentes, entregues junto de cada tarefa

## Relacionadas

* Cobre a API de #5
* Roda automaticamente pelo CI de #8
