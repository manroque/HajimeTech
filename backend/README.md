# Backend do HajimeTech

> **Status: o backend NÃO foi implementado nesta entrega.**
> O front-end funciona 100% com dados simulados. Este documento é o **contrato** que a API real deve cumprir para substituir a simulação sem alterar nenhuma tela.

## Sumário

1. [Situação atual](#1-situação-atual)
2. [Protótipo antigo em `backend/src`](#2-protótipo-antigo-em-backendsrc)
3. [Guia de integração com o front-end](#3-guia-de-integração-com-o-front-end)
4. [Autenticação e permissões](#4-autenticação-e-permissões)
5. [Formato de erro](#5-formato-de-erro)
6. [Regras de negócio que a API deve garantir](#6-regras-de-negócio-que-a-api-deve-garantir)
7. [Endpoints](#7-endpoints)
8. [Como rodar o backend](#8-como-rodar-o-backend) *(a preencher pela equipe)*

---

## 1. Situação atual

```
Telas (React) ──► frontend/src/services/*.ts ──► mockDb.ts (sessionStorage)
                          │
                          └── (futuro) http.ts ──► API REST ──► PostgreSQL (database/schema.sql)
```

- As telas **só** acessam dados pela camada `frontend/src/services` (`alunosService`, `turmasService`, `curriculoService`, `dashboardService` etc.).
- Hoje cada função de service executa `simular(() => ...)`, que lê/escreve num "banco" em memória (`frontend/src/services/mockDb.ts`), persistido no `sessionStorage` do navegador. Os dados iniciais vêm de `frontend/src/mocks`.
- Cada função tem um comentário `INTEGRAÇÃO BACKEND: MÉTODO /api/...` indicando o endpoint que a substituirá. A [seção 7](#7-endpoints) consolida todos eles.
- O modelo de dados oficial é **`database/schema.sql`** (veja `database/README.md`), e os tipos do front (`frontend/src/types/index.ts`) espelham esse modelo em `camelCase`.
- O `mockDb.ts` já simula o comportamento esperado da API: latência, cópia dos dados, erros `403`/`404`/`400`/`422` com mensagem em português.

## 2. Protótipo antigo em `backend/src`

A pasta `backend/` contém um **protótipo anterior** em Express + `pg` (`src/app.js`, `src/routes/*.js`, `migrations/001_init.sql`, `tests/curriculo.test.js`). Ele foi **mantido apenas como referência** e **não é compatível** com o front-end atual nem com `database/schema.sql`. Para reaproveitá-lo, é preciso alinhá-lo ao novo modelo. Principais diferenças:

| Tema | Protótipo antigo (`migrations/001_init.sql` + rotas) | Modelo atual (`database/schema.sql` + services) |
|---|---|---|
| Unidade | Tabela `academias` (só `nome`) | Tabela `escolas` (nome, cidade, endereço, telefone, responsável, `ativo`) |
| Faixas | Texto livre (`alunos.faixa_atual = 'Branca'`) | Tabela global `faixas` com slug (`faixa_id = 'branca'`), ordem, cores e `conteudo_definido` |
| Usuários | `papel IN ('admin','professor')`, `academia_id` obrigatório, sem senha | Enum `perfil_usuario` (`administrador`, `professor`, `aluno`), `escola_id` nulo para admin global, `senha_hash`, `aluno_id` |
| Turmas | `horario` e `faixa_etaria` em texto | `idade_minima` / `idade_maxima`, `professor_id`, `ativo` e tabela `horarios_turma` (vários horários) |
| Alunos | Sem `responsavel` nem `data_ingresso` | Com `responsavel`, `data_ingresso`; faixa só muda por graduação |
| Graduações | `faixa_anterior` enviada pelo cliente, `data_graduacao`, textos | `faixa_anterior_id` calculada pelo servidor, `nova_faixa_id`, `data`, FKs para `faixas` |
| Currículo | `curriculo_categorias` (com `kyu_dan`, sem `ativo`) e `curriculo_itens` (sem escola, sem descrição) | `categorias_curriculo` e `tecnicas`, ambas com `escola_id`, `descricao`, `ordem ≥ 1`, `ativo` |
| Excluir categoria | **Hard delete** (`DELETE` + `ON DELETE CASCADE` apaga as técnicas) | **Desativação lógica** da categoria e de suas técnicas |
| Marrom/Preta | Sem bloqueio | Gatilho no banco + API devolve `422` |
| Acompanhamento técnico | `acompanhamento_tecnico` com técnica em texto livre e níveis `A desenvolver / Em evolução / Consolidada`; sempre insere | `tecnicas_aluno` com FK `tecnica_id`, enum `iniciante / em_desenvolvimento / domina`, *upsert* por (aluno, técnica) |
| Avaliações e premiações | Não existem | `criterios_avaliacao`, `avaliacoes`, `avaliacao_notas`, `premiacoes`, `premiacoes_aluno` |
| Rotas | Planas: `/api/alunos`, `/api/turmas`, `/api/curriculo`... | Aninhadas por escola: `/api/escolas/:escolaId/...` |
| Identificação da escola | Cabeçalho `x-academia-id` (padrão: academia demo) | `escolaId` na rota, validado contra o usuário do token |
| Perfil do usuário | Cabeçalho `x-user-role` (padrão: `admin`, **inseguro**) | Vem do token JWT; verificado no servidor |
| Autenticação | Inexistente | `POST /api/auth/login` → JWT |
| Isolamento | Só `academia_id` na consulta | `escola_id` + FKs compostas `(id, escola_id)` |
| Frequência | `POST` de um aluno por vez | `PUT` em lote por turma e data (upsert) |
| Reordenação | `PATCH /itens/reordenar { itens: [{ id, ordem }] }` | `PATCH .../reordenar { ids: [...] }` (servidor renumera) |
| Dashboard | `{ total_alunos, presencas_30_dias, faixas, turmas }` | Objeto `Dashboard` completo (ver [7.12](#712-dashboard)) |
| Formato de resposta | `snake_case`, linhas cruas do banco | `camelCase` conforme `frontend/src/types` |
| Formato de erro | `{ "error": "..." }`, muitas vezes `500` genérico | `{ "erro": "..." }` com status adequado |
| CORS | `origin: true` (ignora `CORS_ORIGIN` do `.env.example`) | Restringir à origem do front |

O arquivo `frontend/src/services/api.js` é o cliente antigo desse protótipo (usa `x-academia-id`) e também está obsoleto.

---

## 3. Guia de integração com o front-end

1. **Configure a URL da API** criando `frontend/.env`:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

2. **Use o cliente pronto** `frontend/src/services/http.ts`. Ele já:
   - prefixa `VITE_API_URL`;
   - envia `Content-Type: application/json` e `Authorization: Bearer <token>` (definido por `definirToken(token)` após o login);
   - converte respostas de erro em `ErroApi(status, dados.erro)`, que as telas já sabem exibir.

3. **Troque o corpo de cada função**, mantendo nome, parâmetros e tipo de retorno. Exemplo:

   ```ts
   // Antes (mock)
   listar(escolaId: string, filtro: FiltroAlunos = {}): Promise<Aluno[]> {
     return simular(() => db().alunos.filter(/* ... */));
   }

   // Depois (API real)
   listar(escolaId: string, filtro: FiltroAlunos = {}): Promise<Aluno[]> {
     const qs = new URLSearchParams();
     if (filtro.busca) qs.set('busca', filtro.busca);
     if (filtro.turmaId) qs.set('turmaId', filtro.turmaId);
     if (filtro.faixaId) qs.set('faixaId', filtro.faixaId);
     if (filtro.incluirInativos) qs.set('incluirInativos', 'true');
     return http.get<Aluno[]>(`/escolas/${escolaId}/alunos?${qs}`);
   }
   ```

4. **Autenticação**: `authService.entrar(usuarioId)` passa a ser `entrar(email, senha)` chamando `POST /api/auth/login`, guardando o token com `definirToken`. `authService.listarUsuariosDemo()` **não tem equivalente** na API (existe só para o login simulado) e deve ser removido junto com a tela de escolha de usuário. `definirUsuarioSessao` / `exigirPerfil` deixam de ser necessários (a permissão passa a ser verificada no servidor).

5. **Formato das respostas**: a API deve devolver objetos exatamente como os tipos de `frontend/src/types/index.ts` (**camelCase**, datas `AAAA-MM-DD`, data-hora ISO 8601, horas `HH:MM`). Se preferir devolver `snake_case`, faça a conversão dentro do service. Atenção a detalhes:
   - `Turma.horarios` e `Avaliacao.notas` são **listas aninhadas** (juntar `horarios_turma` e `avaliacao_notas`).
   - `TIME` do PostgreSQL vem como `HH:MM:SS` → devolver `HH:MM`.
   - O driver `pg` converte `DATE` em `Date` do JavaScript (risco de mudar o dia por fuso). Recomenda-se `pg.types.setTypeParser(1082, v => v)` para manter a string.
   - Campos de texto opcionais são strings vazias (`''`), não `null`, exceto onde o tipo aceita `null` (`turmaId`, `idadeMaxima`, `professorId`, `avaliadorId`, `escolaId`/`alunoId` do usuário).

6. **Ao final**, apague `frontend/src/services/mockDb.ts`, a pasta `frontend/src/mocks` (se não for mais usada para gerar o seed) e o `restaurarDadosExemplo` exportado em `services/index.ts`. Mova `ErroApi` para `http.ts`.

---

## 4. Autenticação e permissões

### Login

```http
POST /api/auth/login
{ "email": "ana@hajime.local", "senha": "********" }
```

```json
{
  "token": "eyJhbGciOi...",
  "usuario": {
    "id": "00000002-0000-4000-8000-000000000002",
    "escolaId": "00000001-0000-4000-8000-000000000001",
    "nome": "Sensei Ana Paula Ribeiro",
    "email": "ana@hajime.local",
    "perfil": "professor",
    "alunoId": null,
    "ativo": true
  }
}
```

- Senhas guardadas em `usuarios.senha_hash` (bcrypt ou argon2). Usuário inativo não entra (`401`).
- O JWT deve conter ao menos `sub` (id do usuário), `perfil`, `escolaId` e `alunoId`, com expiração.
- Todas as rotas, exceto o login (e um eventual `/api/health`), exigem `Authorization: Bearer <token>` → senão `401`.

### Perfis

| Perfil | Escopo |
|---|---|
| `administrador` | Global (`escolaId = null`). Acessa **qualquer** escola e é o único que gerencia escolas. |
| `professor` | Apenas a **própria escola**. Gerencia alunos, turmas, frequência, graduações, currículo, acompanhamento, avaliações e premiações dessa escola. |
| `aluno` | **Somente leitura** dos **próprios** dados ("Minha evolução"). |

### Regras que o servidor deve aplicar (sempre, independentemente do front)

- **Toda consulta filtrada por `escola_id`.** Um recurso de outra escola deve responder `404` (não revelar sua existência).
- Rotas `/api/escolas/:escolaId/...`: professor e aluno só podem usar o `escolaId` do próprio token → caso contrário `403`.
- Aluno: só `GET`, e apenas de dados com `alunoId` igual ao do token (perfil, frequência, graduações, técnicas, progresso, avaliações, premiações). Nas listagens com `?alunoId=`, o servidor **força** o `alunoId` do token. Pode ler faixas, currículo e critérios (conteúdo da escola). Qualquer escrita → `403`.
- Edição de currículo (categorias e técnicas): **só `administrador` e `professor`** → senão `403`.
- Criar/editar/desativar escolas: **só `administrador`** → senão `403`.
- `GET /api/escolas`: administrador recebe todas; professor/aluno recebem apenas a sua.
- Mensagem padrão de `403`: `"Você não tem permissão para realizar esta ação."` (a mesma do mock).

---

## 5. Formato de erro

Todas as respostas de erro usam **o mesmo corpo** (é o que `http.ts` lê):

```json
{ "erro": "Mensagem em português, pronta para mostrar ao usuário." }
```

| Status | Quando usar | Exemplo de mensagem |
|---|---|---|
| `400` | Dados inválidos ou faltando | `"Informe o nome do aluno."`, `"As notas devem estar entre 1 e 5."`, `"A nova faixa deve ser diferente da faixa atual."` |
| `401` | Sem token, token inválido/expirado, login incorreto | `"E-mail ou senha incorretos."` |
| `403` | Perfil sem permissão ou escola de outro usuário | `"Você não tem permissão para realizar esta ação."` |
| `404` | Registro inexistente ou de outra escola | `"Aluno não encontrado(a)."` |
| `409` *(opcional)* | Conflito de unicidade (ex.: e-mail já usado) | `"Já existe um usuário com este e-mail."` |
| `422` | Regra de negócio violada | `"O conteúdo da faixa Marrom ainda não foi definido pela academia."` |
| `500` | Erro inesperado (sem detalhes internos em produção) | `"Erro interno. Tente novamente."` |

---

## 6. Regras de negócio que a API deve garantir

| # | Regra | Como implementar |
|---|---|---|
| 1 | **Nada de apagar alunos, técnicas, categorias, turmas, escolas, premiações.** | "Excluir" = `UPDATE ... SET ativo = false`. `DELETE /alunos/:id` faz soft delete. |
| 2 | Excluir categoria desativa **também** suas técnicas e renumera a `ordem` das categorias ativas restantes da faixa. | Uma transação. |
| 3 | **Graduação**: grava `faixa_anterior_id` = faixa atual do aluno (calculada no servidor), `nova_faixa_id`, data e observações, e atualiza `alunos.faixa_id`. | Uma transação (`BEGIN` → `INSERT graduacoes` → `UPDATE alunos` → `COMMIT`). A nova faixa deve ser **superior** à atual na progressão (`faixas.ordem` maior); caso contrário → `400` (o mock já aplica essa regra). |
| 4 | A faixa do aluno **não muda** pelo `PUT /alunos/:id`. | Ignorar/recusar `faixaId` no corpo; a faixa só é informada na criação. |
| 5 | **Sem currículo em Marrom/Preta** (`faixas.conteudo_definido = false`). | Verificar antes de criar categoria/técnica e responder `422`. O gatilho do banco é a última barreira (converter o erro dele em `422`). |
| 6 | **Reordenação** renumera `ordem` como 1, 2, 3... dentro do grupo (categorias da mesma escola+faixa; técnicas da mesma categoria). | Receber a lista de ids na nova ordem e atualizar numa transação. Ids de outro grupo/escola → `400`. |
| 7 | Nova categoria/técnica entra no **fim** da lista (`ordem = quantidade atual + 1`). | Calcular no servidor. |
| 8 | **Frequência única por aluno e data.** | `INSERT ... ON CONFLICT (aluno_id, data) DO UPDATE SET presente = EXCLUDED.presente, turma_id = EXCLUDED.turma_id`. Verificar que os alunos pertencem à escola. |
| 9 | Acompanhamento técnico: um registro por (aluno, técnica). | Upsert em `tecnicas_aluno` (`ON CONFLICT (aluno_id, tecnica_id)`). |
| 10 | **Notas de 1 a 5**, uma por critério ativo da escola. | Validar (`400`) e gravar `avaliacoes` + `avaliacao_notas` numa transação. `avaliador_id` = usuário do token. Validar que cada `criterioId` pertence à escola (a FK de `avaliacao_notas` não é composta). |
| 11 | Turmas: `idadeMaxima` nula = sem limite; `idadeMaxima ≥ idadeMinima`; horário com fim depois do início; `PUT` **substitui** todos os horários. | Transação: apaga `horarios_turma` da turma e insere os novos. |
| 12 | Professor de uma turma deve ser professor **da mesma escola**. | Validar no servidor (a FK `turmas.professor_id` não é composta). |
| 13 | Concessão de premiação lançada por engano pode ser removida. | Único `DELETE` físico previsto (`premiacoes_aluno`). O tipo de premiação continua existindo. |
| 14 | Dashboard calculado no servidor. | Consultas SQL agregadas; o front só exibe o objeto `Dashboard`. |

---

## 7. Endpoints

Convenções:

- Prefixo `/api`. Todas as rotas, exceto o login, exigem token.
- `:escolaId` é sempre validado contra o usuário (ver [seção 4](#4-autenticação-e-permissões)).
- Coluna **Perfis**: `A` = administrador, `P` = professor, `Al` = aluno (somente os próprios dados).
- Respostas de criação: `201` com o objeto criado. Respostas sem conteúdo útil: `204`.
- Tipos citados (`Aluno`, `Turma`...) estão em `frontend/src/types/index.ts`; tipos de entrada (`AlunoInput`, `TurmaInput`...) estão nos services.

### Resumo (47 endpoints)

| Domínio | Qtde |
|---|---:|
| Autenticação | 1 |
| Faixas | 1 |
| Escolas e professores | 6 |
| Turmas | 4 |
| Alunos | 6 |
| Frequência | 3 |
| Graduações | 2 |
| Currículo | 10 |
| Acompanhamento técnico | 3 |
| Avaliações | 3 |
| Premiações | 7 |
| Dashboard | 1 |

### 7.1 Autenticação (`authService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| POST | `/api/auth/login` | Login por e-mail e senha → `{ token, usuario }` | público | `authService.entrar` |

Exemplo na [seção 4](#login). `authService.listarUsuariosDemo` **não tem endpoint** (só existe no protótipo).

### 7.2 Faixas (`faixasService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/faixas` | Lista as 8 faixas ordenadas por `ordem` → `Faixa[]` | A, P, Al | `faixasService.listar` |

```json
[
  { "id": "branca", "nome": "Branca", "ordem": 1, "cor": "#F1F5F9", "corTexto": "#0F172A", "conteudoDefinido": true },
  { "id": "marrom", "nome": "Marrom", "ordem": 7, "cor": "#78350F", "corTexto": "#FFFFFF", "conteudoDefinido": false }
]
```

### 7.3 Escolas e professores (`escolasService`, `usuariosService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas?incluirInativas=false` | Lista escolas por nome → `Escola[]`. Admin: todas; demais: só a sua. | A, P, Al | `escolasService.listar(incluirInativas)` |
| GET | `/api/escolas/resumo` | Contagem de alunos ativos e turmas ativas por escola → `Record<escolaId, { alunos, turmas }>` | A, P | `escolasService.resumo` |
| POST | `/api/escolas` | Cria escola → `Escola` | A | `escolasService.criar` |
| PUT | `/api/escolas/:id` | Atualiza dados da escola → `Escola` | A | `escolasService.atualizar` |
| PATCH | `/api/escolas/:id/ativo` | Desativa/reativa (lógico) → `Escola` | A | `escolasService.definirAtivo` |
| GET | `/api/escolas/:escolaId/professores` | Professores ativos da escola → `Usuario[]` | A, P | `usuariosService.listarProfessores` |

> Registre `/api/escolas/resumo` **antes** de rotas `/api/escolas/:id` para não ser capturada como id.

`POST /api/escolas` e `PUT /api/escolas/:id` (`EscolaInput`):

```json
{
  "nome": "Academia Hajime",
  "cidade": "Rio de Janeiro/RJ",
  "endereco": "Rua das Palmeiras, 120, Centro",
  "telefone": "(21) 3333-1200",
  "responsavel": "Sensei Ana Paula Ribeiro"
}
```

`PATCH /api/escolas/:id/ativo`: `{ "ativo": false }`

`GET /api/escolas/resumo`:

```json
{
  "00000001-0000-4000-8000-000000000001": { "alunos": 22, "turmas": 3 },
  "00000001-0000-4000-8000-000000000002": { "alunos": 11, "turmas": 2 }
}
```

### 7.4 Turmas (`turmasService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/turmas?incluirInativas=false` | Turmas com `horarios`, ordenadas por idade mínima → `Turma[]` | A, P, Al | `turmasService.listar` |
| POST | `/api/escolas/:escolaId/turmas` | Cria turma com horários → `Turma` | A, P | `turmasService.criar` |
| PUT | `/api/escolas/:escolaId/turmas/:id` | Atualiza turma e **substitui** os horários → `Turma` | A, P | `turmasService.atualizar` |
| PATCH | `/api/escolas/:escolaId/turmas/:id/ativo` | Desativa/reativa → `Turma` | A, P | `turmasService.definirAtivo` |

`POST` / `PUT` (`TurmaInput`):

```json
{
  "nome": "Adulto",
  "idadeMinima": 18,
  "idadeMaxima": null,
  "professorId": "00000002-0000-4000-8000-000000000002",
  "horarios": [
    { "diaSemana": 1, "horaInicio": "20:00", "horaFim": "21:30" },
    { "diaSemana": 3, "horaInicio": "20:00", "horaFim": "21:30" }
  ]
}
```

`PATCH .../ativo`: `{ "ativo": false }`

### 7.5 Alunos (`alunosService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/alunos?busca=&turmaId=&faixaId=&incluirInativos=false` | Lista por nome. `busca` ignora maiúsculas e acentos ("joao" encontra "João") → `Aluno[]` | A, P | `alunosService.listar` |
| GET | `/api/escolas/:escolaId/alunos/:id` | Dados de um aluno → `Aluno` | A, P, Al | `alunosService.obter` |
| POST | `/api/escolas/:escolaId/alunos` | Cadastra → `Aluno` (`ativo: true`) | A, P | `alunosService.criar` |
| PUT | `/api/escolas/:escolaId/alunos/:id` | Atualiza dados (sem `faixaId`) → `Aluno` | A, P | `alunosService.atualizar` |
| DELETE | `/api/escolas/:escolaId/alunos/:id` | "Excluir" = `ativo = false` → `Aluno` | A, P | `alunosService.definirAtivo(…, false)` |
| PATCH | `/api/escolas/:escolaId/alunos/:id/reativar` | Reativa → `Aluno` | A, P | `alunosService.definirAtivo(…, true)` |

`POST` (`AlunoInput`):

```json
{
  "turmaId": "00000003-0000-4000-8000-000000000001",
  "nome": "Lucas Oliveira",
  "dataNascimento": "2015-04-12",
  "faixaId": "branca",
  "telefone": "(21) 98811-2041",
  "responsavel": "Márcia Oliveira",
  "observacoes": "",
  "dataIngresso": "2025-04-10"
}
```

`PUT`: mesmo corpo **sem** `faixaId` (`Omit<AlunoInput, 'faixaId'>`).

Busca sem acento no PostgreSQL: extensão `unaccent` (`unaccent(lower(nome)) LIKE unaccent(lower('%' || $busca || '%'))`).

### 7.6 Frequência (`frequenciaService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/turmas/:turmaId/frequencias?data=AAAA-MM-DD` | Folha de chamada: alunos **ativos** da turma, por nome, com a presença da data → `LinhaChamada[]` | A, P | `frequenciaService.chamada` |
| PUT | `/api/escolas/:escolaId/turmas/:turmaId/frequencias` | Grava chamada em lote (upsert por `aluno_id, data`) → `204` | A, P | `frequenciaService.registrar` |
| GET | `/api/escolas/:escolaId/alunos/:alunoId/frequencias` | Histórico do aluno, data crescente → `Frequencia[]` | A, P, Al | `frequenciaService.doAluno` |

`GET .../frequencias?data=` (`presente: null` = chamada ainda não feita):

```json
[
  { "alunoId": "00000005-0000-4000-8000-000000000001", "nome": "Lucas Oliveira", "faixaId": "amarela", "presente": true },
  { "alunoId": "00000005-0000-4000-8000-000000000002", "nome": "Sofia Martins", "faixaId": "azul", "presente": null }
]
```

`PUT`:

```json
{
  "data": "2026-09-22",
  "registros": [
    { "alunoId": "00000005-0000-4000-8000-000000000001", "presente": true },
    { "alunoId": "00000005-0000-4000-8000-000000000002", "presente": false }
  ]
}
```

### 7.7 Graduações (`graduacoesService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/graduacoes?alunoId=` | Histórico, mais recentes primeiro → `Graduacao[]` | A, P, Al | `graduacoesService.listar` |
| POST | `/api/escolas/:escolaId/graduacoes` | Registra graduação e atualiza a faixa do aluno (transação) → `Graduacao` | A, P | `graduacoesService.registrar` |

`POST` (`GraduacaoInput`):

```json
{
  "alunoId": "00000005-0000-4000-8000-000000000001",
  "novaFaixaId": "laranja",
  "data": "2026-09-22",
  "observacoes": "Excelente evolução nas projeções."
}
```

Resposta: `Graduacao` com `faixaAnteriorId` preenchida pelo servidor.

### 7.8 Currículo (`curriculoService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/curriculo?faixaId=azul&incluirInativas=false` | Categorias **ativas** da faixa, por `ordem`, cada uma com suas técnicas (inativas só se `incluirInativas=true`) → `CategoriaComTecnicas[]` | A, P, Al | `curriculoService.listarPorFaixa` |
| GET | `/api/escolas/:escolaId/tecnicas` | Todas as técnicas ativas (de categorias ativas) com `faixaId` e `categoriaNome` | A, P, Al | `curriculoService.listarTecnicas` |
| POST | `/api/escolas/:escolaId/curriculo/categorias` | Cria categoria no fim da faixa → `CategoriaCurriculo` (`422` em Marrom/Preta) | A, P | `curriculoService.criarCategoria` |
| PUT | `/api/escolas/:escolaId/curriculo/categorias/:id` | Edita nome/descrição → `CategoriaCurriculo` | A, P | `curriculoService.atualizarCategoria` |
| DELETE | `/api/escolas/:escolaId/curriculo/categorias/:id` | Desativa categoria **e** suas técnicas; renumera as restantes → `204` | A, P | `curriculoService.excluirCategoria` |
| PATCH | `/api/escolas/:escolaId/curriculo/categorias/reordenar` | Nova ordem das categorias de uma faixa → `204` | A, P | `curriculoService.moverCategoria` |
| POST | `/api/escolas/:escolaId/curriculo/tecnicas` | Cria técnica no fim da categoria → `Tecnica` (`422` em Marrom/Preta) | A, P | `curriculoService.criarTecnica` |
| PUT | `/api/escolas/:escolaId/curriculo/tecnicas/:id` | Edita nome/descrição → `Tecnica` | A, P | `curriculoService.atualizarTecnica` |
| PATCH | `/api/escolas/:escolaId/curriculo/tecnicas/:id/ativo` | Desativa/reativa técnica (nunca apaga) → `Tecnica` | A, P | `curriculoService.definirTecnicaAtiva` |
| PATCH | `/api/escolas/:escolaId/curriculo/tecnicas/reordenar` | Nova ordem das técnicas de uma categoria → `204` | A, P | `curriculoService.moverTecnica` |

`GET .../curriculo?faixaId=branca`:

```json
[
  {
    "id": "…", "escolaId": "…", "faixaId": "branca",
    "nome": "Ukemi (quedas)", "descricao": "…", "ordem": 2, "ativo": true,
    "criadoEm": "…", "atualizadoEm": "…",
    "tecnicas": [
      { "id": "…", "escolaId": "…", "categoriaId": "…", "nome": "Ushiro-ukemi", "descricao": "Queda para trás.", "ordem": 1, "ativo": true, "criadoEm": "…", "atualizadoEm": "…" }
    ]
  }
]
```

`GET .../tecnicas` (item): `Tecnica` + `{ "faixaId": "branca", "categoriaNome": "Ukemi (quedas)" }`.

`POST .../categorias`: `{ "faixaId": "azul", "nome": "Nage-waza (projeções)", "descricao": "Técnicas de projeção." }`

`PUT .../categorias/:id` e `PUT .../tecnicas/:id`: `{ "nome": "…", "descricao": "…" }`

`POST .../tecnicas`: `{ "categoriaId": "…", "nome": "O-soto-gari", "descricao": "Grande ceifada por fora." }`

`PATCH .../tecnicas/:id/ativo`: `{ "ativo": false }`

`PATCH .../categorias/reordenar`: `{ "ids": ["idCat3", "idCat1", "idCat2"] }` (todas as categorias ativas de **uma** faixa, na nova ordem)

`PATCH .../tecnicas/reordenar`: `{ "categoriaId": "…", "ids": ["idTec2", "idTec1", "idTec3"] }`

> Os services `moverCategoria(escolaId, id, 'cima' | 'baixo')` e `moverTecnica(...)` recebem **um id e uma direção**, não a lista. Na integração, o service deve montar a lista reordenada a partir do currículo já carregado (troca com o vizinho) antes de chamar o endpoint. Outra opção é a equipe pode optar por um corpo `{ "id": "…", "direcao": "cima" }`. Decidir e documentar aqui.

### 7.9 Acompanhamento técnico (`tecnicasAlunoService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/alunos/:alunoId/tecnicas` | Níveis do aluno em cada técnica → `TecnicaAluno[]` | A, P, Al | `tecnicasAlunoService.listar` |
| PUT | `/api/escolas/:escolaId/alunos/:alunoId/tecnicas/:tecnicaId` | Cria ou atualiza o nível (upsert) → `TecnicaAluno` | A, P | `tecnicasAlunoService.salvar` |
| GET | `/api/escolas/:escolaId/alunos/:alunoId/progresso` | Progresso na faixa atual → `ProgressoCurriculo` | A, P, Al | `tecnicasAlunoService.progresso` |

`PUT`: `{ "nivel": "em_desenvolvimento", "observacoes": "Melhorar a pegada." }` (`nivel`: `iniciante` | `em_desenvolvimento` | `domina`)

`GET .../progresso`: considera só técnicas **ativas** de categorias **ativas** da faixa atual; `percentual = round(domina / total × 100)` (0 se `total = 0`, como em Marrom/Preta):

```json
{
  "faixaId": "amarela",
  "conteudoDefinido": true,
  "total": 11,
  "domina": 6,
  "emDesenvolvimento": 3,
  "iniciante": 1,
  "percentual": 55
}
```

### 7.10 Avaliações de desempenho (`avaliacoesService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/criterios-avaliacao` | Critérios ativos por `ordem` → `CriterioAvaliacao[]` | A, P, Al | `avaliacoesService.listarCriterios` |
| GET | `/api/escolas/:escolaId/avaliacoes?alunoId=` | Avaliações com `notas`, **data crescente** (para o gráfico) → `Avaliacao[]` | A, P, Al | `avaliacoesService.listar` |
| POST | `/api/escolas/:escolaId/avaliacoes` | Registra avaliação + notas (transação); `avaliadorId` = usuário do token → `Avaliacao` | A, P | `avaliacoesService.criar` |

`POST` (`AvaliacaoInput`):

```json
{
  "alunoId": "00000005-0000-4000-8000-000000000001",
  "data": "2026-09-22",
  "observacoes": "Mais concentrado nos treinos.",
  "notas": [
    { "criterioId": "0000000b-0000-4000-8000-000000000001", "nota": 4 },
    { "criterioId": "0000000b-0000-4000-8000-000000000002", "nota": 5 },
    { "criterioId": "0000000b-0000-4000-8000-000000000003", "nota": 3 },
    { "criterioId": "0000000b-0000-4000-8000-000000000004", "nota": 4 }
  ]
}
```

A média exibida é calculada no front (`mediaAvaliacao`: média simples das notas).

### 7.11 Premiações (`premiacoesService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/premiacoes?incluirInativas=false` | Tipos de premiação → `Premiacao[]` | A, P, Al | `premiacoesService.listar` |
| POST | `/api/escolas/:escolaId/premiacoes` | Cria tipo → `Premiacao` | A, P | `premiacoesService.criar` |
| PUT | `/api/escolas/:escolaId/premiacoes/:id` | Edita → `Premiacao` | A, P | `premiacoesService.atualizar` |
| PATCH | `/api/escolas/:escolaId/premiacoes/:id/ativo` | Desativa/reativa → `Premiacao` | A, P | `premiacoesService.definirAtivo` |
| GET | `/api/escolas/:escolaId/premiacoes-aluno?alunoId=` | Premiações concedidas, mais recentes primeiro → `PremiacaoAluno[]` | A, P, Al | `premiacoesService.listarConcedidas` |
| POST | `/api/escolas/:escolaId/premiacoes-aluno` | Concede premiação a um aluno → `PremiacaoAluno` | A, P | `premiacoesService.conceder` |
| DELETE | `/api/escolas/:escolaId/premiacoes-aluno/:id` | Remove concessão lançada por engano (físico) → `204` | A, P | `premiacoesService.removerConcessao` |

`POST` / `PUT .../premiacoes` (`PremiacaoInput`):

```json
{ "nome": "Destaque do mês", "descricao": "Aluno que mais se destacou no mês.", "tipo": "destaque_mes" }
```

(`tipo`: `destaque_mes` | `frequencia` | `campeonato` | `evolucao` | `outro`)

`PATCH .../premiacoes/:id/ativo`: `{ "ativo": false }`

`POST .../premiacoes-aluno` (`ConcessaoInput`):

```json
{
  "premiacaoId": "0000000d-0000-4000-8000-000000000001",
  "alunoId": "00000005-0000-4000-8000-000000000001",
  "data": "2026-09-22",
  "descricao": "Destaque de setembro."
}
```

### 7.12 Dashboard (`dashboardService`)

| Método | Rota | Descrição | Perfis | Service |
|---|---|---|---|---|
| GET | `/api/escolas/:escolaId/dashboard?periodoDias=30&turmaId=` | Todos os indicadores do painel → `Dashboard` | A, P | `dashboardService.obter` |

Parâmetros (`FiltroDashboard`): `periodoDias` (ex.: 30, 90, 180) e `turmaId` (vazio = todas as turmas).

Regras de cálculo (espelham o mock em `dashboardService.ts`):

- **Período atual** = `(hoje − periodoDias, hoje]`; **período anterior** = mesmo tamanho imediatamente antes.
- `IndicadorComparado`: `{ atual, anterior, variacao }`, com `variacao = (atual − anterior) / anterior × 100`, ou `null` se `anterior = 0`.
- `alunosAtivos`: atual = alunos ativos (do filtro de turma); anterior = desses, os que já tinham ingressado no início do período.
- `presencas`: registros com `presente = true` no período. `taxaPresenca`: `presenças / registros × 100`, inteiro.
- `graduacoes`: graduações no período (alunos do filtro).
- `porFaixa`: **todas as 8 faixas** (inclusive com total 0), contando alunos ativos do filtro.
- `porTurma`: todas as turmas ativas da escola com o total de alunos ativos (não é afetado pelo filtro de turma).
- `evolucaoFrequencia`: uma entrada por semana (início na **segunda-feira**) do período, com presenças e faltas.
- `graduacoesRecentes` / `premiacoesRecentes`: até **6** do período, mais recentes primeiro.
- `maisAssiduos`: até **5** alunos com mais presenças no período.

Resposta:

```json
{
  "alunosAtivos": { "atual": 22, "anterior": 21, "variacao": 4.76 },
  "presencas":    { "atual": 148, "anterior": 131, "variacao": 12.98 },
  "taxaPresenca": { "atual": 78, "anterior": 72, "variacao": 8.33 },
  "graduacoes":   { "atual": 3, "anterior": 0, "variacao": null },
  "porFaixa": [
    { "faixaId": "branca", "nome": "Branca", "cor": "#F1F5F9", "total": 4 },
    { "faixaId": "azul",   "nome": "Azul",   "cor": "#1D4ED8", "total": 5 }
  ],
  "porTurma": [
    { "turmaId": "00000003-0000-4000-8000-000000000001", "nome": "Infantil", "total": 9 }
  ],
  "evolucaoFrequencia": [
    { "semana": "2026-08-24", "presencas": 31, "faltas": 8 },
    { "semana": "2026-08-31", "presencas": 35, "faltas": 6 }
  ],
  "graduacoesRecentes": [
    {
      "id": "…", "escolaId": "…", "alunoId": "…",
      "faixaAnteriorId": "azul", "novaFaixaId": "amarela",
      "data": "2026-09-10", "observacoes": "", "criadoEm": "…",
      "alunoNome": "Sofia Martins"
    }
  ],
  "premiacoesRecentes": [
    {
      "id": "…", "escolaId": "…", "premiacaoId": "…", "alunoId": "…",
      "data": "2026-09-20", "descricao": "Destaque de setembro.",
      "alunoNome": "Lucas Oliveira", "premiacaoNome": "Destaque do mês", "tipo": "destaque_mes"
    }
  ],
  "maisAssiduos": [
    { "alunoId": "…", "nome": "Gabriel Santos", "faixaId": "laranja", "presencas": 8 }
  ]
}
```

*(Valores ilustrativos.)*

---

## 8. Como rodar o backend

> **A preencher pela equipe** quando a implementação existir. Os itens abaixo são um roteiro.

### Pré-requisitos

- *A preencher pela equipe.* Ex.: Node.js (versão), npm/pnpm, PostgreSQL 14+ ou Docker.
- Banco criado conforme `database/README.md`.

### Variáveis de ambiente

*A preencher pela equipe.* Sugestão de `backend/.env.example`:

| Variável | Exemplo | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta da API |
| `DATABASE_URL` | `postgresql://hajimetech:hajimetech@localhost:5433/hajimetech` | Conexão com o PostgreSQL (valor do `database/docker-compose.yml`) |
| `JWT_SECRET` | *(segredo forte)* | Assinatura dos tokens |
| `JWT_EXPIRES_IN` | `8h` | Validade do token |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem permitida (front em desenvolvimento) |
| `NODE_ENV` | `development` | Ambiente |

### Instalação

```bash
# A preencher pela equipe
cd backend
npm install
```

### Comandos

| Comando | O que faz |
|---|---|
| *A preencher* | Rodar em desenvolvimento |
| *A preencher* | Rodar em produção |
| *A preencher* | Criar senhas iniciais dos usuários de demonstração |

### Testes

*A preencher pela equipe:* framework, como rodar, cobertura mínima. Sugestão: testes de integração por endpoint cobrindo `403` por perfil, isolamento entre as duas escolas do seed e as regras da [seção 6](#6-regras-de-negócio-que-a-api-deve-garantir).

### Deploy

*A preencher pela equipe:* hospedagem da API e do banco, variáveis em produção, HTTPS, backup do banco, como rodar `schema.sql` em produção (sem o `seed.sql`).
