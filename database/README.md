# Banco de dados do HajimeTech

Esta pasta guarda o **modelo de dados oficial** do HajimeTech (PostgreSQL) e os **dados de exemplo** usados na demonstração. É a referência que o backend deve seguir.

| Arquivo | Conteúdo | Pode editar? |
|---|---|---|
| `schema.sql` | Criação de tipos (enums), tabelas, chaves, índices e gatilhos. | Sim. É a fonte da verdade do modelo. Se mudar, atualize também `frontend/src/types/index.ts`. |
| `seed.sql` | Dados de exemplo (2 escolas, 35 alunos, currículo, frequência de 1 ano etc.). | **Não.** É gerado automaticamente. |

### Como o `seed.sql` é gerado

O `seed.sql` é produzido a partir dos mesmos mocks que o front-end usa (`frontend/src/mocks`), garantindo que banco e protótipo tenham **os mesmos IDs, nomes e quantidades**:

```bash
cd frontend
npm run gerar-seed      # executa scripts/gerar-seed.ts → ../database/seed.sql
```

- Para alterar os dados de exemplo, edite os arquivos em `frontend/src/mocks` e rode o comando novamente. Alterações feitas à mão no `seed.sql` serão perdidas.
- As **datas são relativas** ao dia em que o seed é carregado (`CURRENT_DATE - n`). Assim o dashboard sempre mostra dados "recentes", não importa quando o banco foi criado.
- Todo o seed roda dentro de uma transação (`BEGIN ... COMMIT`): ou entra tudo, ou nada.
- O seed **não tem `ON CONFLICT`**: carregá-lo duas vezes no mesmo banco gera erro de chave duplicada. Recrie o banco antes (veja [Recriar do zero](#recriar-do-zero)).
- Os usuários do seed **não têm senha** (`senha_hash` nulo). Quando o backend existir, ele deve definir as senhas (ex.: script de criação de senha inicial).

---

## Como criar o banco

### Pré-requisitos

- **PostgreSQL 14 ou superior** (usa `gen_random_uuid()` da extensão `pgcrypto`, criada pelo próprio `schema.sql`), **ou**
- **Docker** (não precisa instalar o PostgreSQL).

Os arquivos estão em UTF-8. No Windows, se aparecerem acentos quebrados, rode antes `set PGCLIENTENCODING=UTF8` (cmd) ou `$env:PGCLIENTENCODING="UTF8"` (PowerShell).

### Opção 1: PostgreSQL instalado (psql)

Na pasta `database/`:

```bash
createdb hajimetech
psql -d hajimetech -v ON_ERROR_STOP=1 -f schema.sql
psql -d hajimetech -v ON_ERROR_STOP=1 -f seed.sql
```

Se precisar informar usuário/servidor: `psql -U postgres -h localhost -d hajimetech -f schema.sql`.

Conferência rápida:

```bash
psql -d hajimetech -c "SELECT nome, (SELECT count(*) FROM alunos a WHERE a.escola_id = e.id) AS alunos FROM escolas e;"
```

### Opção 2: Docker Compose (recomendado)

A pasta já tem um `docker-compose.yml`. Na primeira vez que o contêiner sobe, o PostgreSQL executa `schema.sql` e `seed.sql` sozinho.

```bash
cd database
docker compose up -d
```

| Item | Valor |
|---|---|
| Host / porta | `localhost:5433` (a 5433 evita conflito com um PostgreSQL instalado na 5432) |
| Banco | `hajimetech` |
| Usuário / senha | `hajimetech` / `hajimetech` (apenas para desenvolvimento local) |
| String de conexão | `postgresql://hajimetech:hajimetech@localhost:5433/hajimetech` |

Para abrir o psql dentro do contêiner:

```bash
docker exec -it hajimetech-db psql -U hajimetech -d hajimetech
```

Também dá para conectar pelo DBeaver, pelo pgAdmin ou pela extensão de PostgreSQL do VS Code, usando os dados da tabela acima.

### Recriar do zero

Com psql:

```bash
dropdb --if-exists hajimetech   # ou, dentro do psql: DROP DATABASE hajimetech;
createdb hajimetech
psql -d hajimetech -v ON_ERROR_STOP=1 -f schema.sql
psql -d hajimetech -v ON_ERROR_STOP=1 -f seed.sql
```

Com Docker Compose (apaga o volume e roda os scripts de novo):

```bash
cd database
docker compose down -v
docker compose up -d
```

Faça isso sempre que alterar o `schema.sql` ou regerar o `seed.sql`. As datas do seed são relativas ao dia em que ele foi carregado.

---

## Convenções do modelo

| Convenção | Como funciona |
|---|---|
| **Chaves UUID** | Todas as tabelas usam `id UUID DEFAULT gen_random_uuid()`. |
| **Faixas globais** | `faixas` é a única tabela sem escola e com chave legível (slug): `branca`, `azul`, `amarela`, `laranja`, `verde`, `roxa`, `marrom`, `preta`. A coluna `ordem` (1 a 8) define a progressão. |
| **Isolamento por escola** | Toda tabela de dados tem `escola_id`. O backend **deve filtrar todas as consultas** por `escola_id`. |
| **FKs compostas** | Tabelas "filhas" referenciam `(id, escola_id)` do pai (ex.: `frequencias (aluno_id, escola_id) → alunos (id, escola_id)`). O próprio banco impede que um registro aponte para dados de **outra** escola. Por isso as tabelas-pai têm `UNIQUE (id, escola_id)`. |
| **Exclusão lógica (soft delete)** | Coluna `ativo`. Alunos, técnicas, categorias, turmas, escolas, critérios e premiações **nunca são apagados**; "excluir" = `ativo = false`. |
| **Ordem de exibição** | `categorias_curriculo.ordem`, `tecnicas.ordem`, `criterios_avaliacao.ordem` (começando em 1). Ao reordenar, o backend renumera 1, 2, 3... |
| **Datas de auditoria** | Todas as tabelas têm `criado_em` e `atualizado_em` (`TIMESTAMPTZ`). O gatilho `definir_atualizado_em()` atualiza `atualizado_em` em todo `UPDATE`. |
| **Currículo bloqueado em Marrom/Preta** | `faixas.conteudo_definido = false` para Marrom e Preta. O gatilho `trg_categorias_faixa_definida` (função `validar_faixa_com_conteudo()`) recusa criar ou mover categorias para essas faixas. Como técnicas sempre pertencem a uma categoria, também ficam bloqueadas. |
| **Enums** | `perfil_usuario` (`administrador`, `professor`, `aluno`), `nivel_tecnica` (`iniciante`, `em_desenvolvimento`, `domina`), `tipo_premiacao` (`destaque_mes`, `frequencia`, `campeonato`, `evolucao`, `outro`). |
| **Nomes** | `snake_case` no banco; `camelCase` no front-end (`frontend/src/types`). |

Outras restrições importantes:

- `usuarios`: e-mail único; perfil diferente de `administrador` exige `escola_id`; perfil `aluno` exige `aluno_id` (e só ele pode ter).
- `frequencias`: **uma linha por aluno por data** (`UNIQUE (aluno_id, data)`) → gravação por *upsert*.
- `graduacoes`: faixa anterior ≠ nova faixa. Ao inserir, o backend atualiza `alunos.faixa_id` **na mesma transação**.
- `tecnicas_aluno`: um registro por aluno e técnica (`UNIQUE (aluno_id, tecnica_id)`).
- `avaliacao_notas`: nota de 1 a 5, uma por critério em cada avaliação (PK composta).
- `horarios_turma`: `dia_semana` de 0 (domingo) a 6 (sábado); `hora_fim > hora_inicio`.
- `turmas`: `idade_maxima` nula = sem limite ("18 anos ou mais").

---

## Diagrama entidade-relacionamento

> As colunas `criado_em` / `atualizado_em` aparecem em todas as tabelas. Relacionamentos com `escolas` via `escola_id` estão todos representados.

```mermaid
erDiagram
    escolas {
        uuid id PK
        varchar nome
        varchar cidade
        varchar endereco
        varchar telefone
        varchar responsavel
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    faixas {
        varchar id PK "slug ex branca"
        varchar nome UK
        smallint ordem UK "1 a 8"
        char cor "hex"
        char cor_texto "hex"
        boolean conteudo_definido "false para marrom e preta"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    usuarios {
        uuid id PK
        uuid escola_id FK "nulo para admin global"
        varchar nome
        varchar email UK
        varchar senha_hash
        perfil_usuario perfil
        uuid aluno_id FK "so perfil aluno"
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    turmas {
        uuid id PK
        uuid escola_id FK
        varchar nome
        smallint idade_minima
        smallint idade_maxima "nulo sem limite"
        uuid professor_id FK
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    horarios_turma {
        uuid id PK
        uuid turma_id FK "on delete cascade"
        smallint dia_semana "0 domingo a 6 sabado"
        time hora_inicio
        time hora_fim
        timestamptz criado_em
        timestamptz atualizado_em
    }

    alunos {
        uuid id PK
        uuid escola_id FK
        uuid turma_id FK "composta com escola_id"
        varchar nome
        date data_nascimento
        varchar faixa_id FK "padrao branca"
        varchar telefone
        varchar responsavel
        text observacoes
        date data_ingresso
        boolean ativo "soft delete"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    frequencias {
        uuid id PK
        uuid escola_id FK
        uuid aluno_id FK "unico com data"
        uuid turma_id FK
        date data
        boolean presente
        timestamptz criado_em
        timestamptz atualizado_em
    }

    graduacoes {
        uuid id PK
        uuid escola_id FK
        uuid aluno_id FK
        varchar faixa_anterior_id FK
        varchar nova_faixa_id FK
        date data
        text observacoes
        timestamptz criado_em
        timestamptz atualizado_em
    }

    categorias_curriculo {
        uuid id PK
        uuid escola_id FK
        varchar faixa_id FK "bloqueado se conteudo_definido false"
        varchar nome
        text descricao
        integer ordem
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    tecnicas {
        uuid id PK
        uuid escola_id FK
        uuid categoria_id FK
        varchar nome
        text descricao
        integer ordem
        boolean ativo "nunca apagada"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    tecnicas_aluno {
        uuid id PK
        uuid escola_id FK
        uuid aluno_id FK "unico com tecnica_id"
        uuid tecnica_id FK
        nivel_tecnica nivel
        text observacoes
        timestamptz criado_em
        timestamptz atualizado_em
    }

    criterios_avaliacao {
        uuid id PK
        uuid escola_id FK
        varchar nome
        text descricao
        integer ordem
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    avaliacoes {
        uuid id PK
        uuid escola_id FK
        uuid aluno_id FK
        uuid avaliador_id FK "usuario"
        date data
        text observacoes
        timestamptz criado_em
        timestamptz atualizado_em
    }

    avaliacao_notas {
        uuid avaliacao_id PK "FK avaliacoes"
        uuid criterio_id PK "FK criterios_avaliacao"
        smallint nota "1 a 5"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    premiacoes {
        uuid id PK
        uuid escola_id FK
        varchar nome
        text descricao
        tipo_premiacao tipo
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    premiacoes_aluno {
        uuid id PK
        uuid escola_id FK
        uuid premiacao_id FK
        uuid aluno_id FK
        date data
        text descricao
        timestamptz criado_em
        timestamptz atualizado_em
    }

    escolas |o--o{ usuarios : "vincula"
    escolas ||--o{ turmas : "tem"
    escolas ||--o{ alunos : "matricula"
    escolas ||--o{ frequencias : "isola"
    escolas ||--o{ graduacoes : "isola"
    escolas ||--o{ categorias_curriculo : "define"
    escolas ||--o{ tecnicas : "isola"
    escolas ||--o{ tecnicas_aluno : "isola"
    escolas ||--o{ criterios_avaliacao : "define"
    escolas ||--o{ avaliacoes : "isola"
    escolas ||--o{ premiacoes : "define"
    escolas ||--o{ premiacoes_aluno : "isola"

    usuarios |o--o{ turmas : "professor de"
    usuarios |o--o{ avaliacoes : "avalia"
    alunos |o--o{ usuarios : "acessa como aluno"

    turmas ||--o{ horarios_turma : "acontece em"
    turmas |o--o{ alunos : "agrupa"
    turmas ||--o{ frequencias : "registra"

    faixas ||--o{ alunos : "faixa atual"
    faixas ||--o{ graduacoes : "faixa anterior"
    faixas ||--o{ graduacoes : "nova faixa"
    faixas ||--o{ categorias_curriculo : "organiza"

    alunos ||--o{ frequencias : "tem"
    alunos ||--o{ graduacoes : "recebe"
    alunos ||--o{ tecnicas_aluno : "pratica"
    alunos ||--o{ avaliacoes : "recebe"
    alunos ||--o{ premiacoes_aluno : "conquista"

    categorias_curriculo ||--o{ tecnicas : "contem"
    tecnicas ||--o{ tecnicas_aluno : "acompanhada em"

    avaliacoes ||--|{ avaliacao_notas : "tem notas"
    criterios_avaliacao ||--o{ avaliacao_notas : "pontua"

    premiacoes ||--o{ premiacoes_aluno : "concedida em"
```

Leitura das cardinalidades: `||` = exatamente um, `|o` = zero ou um, `o{` = zero ou muitos, `|{` = um ou muitos. Uma avaliação deve ter ao menos uma nota (`|{`), regra garantida pelo backend, não pelo banco.

---

## Dicionário de dados (resumo)

| Tabela | Descrição |
|---|---|
| `escolas` | Academias/unidades atendidas pelo sistema (multi-escola). Desativadas com `ativo = false`. |
| `faixas` | Tabela global com as 8 faixas (Branca → Preta), cores para exibição e se o conteúdo já foi definido. |
| `usuarios` | Pessoas que acessam o sistema: administrador (global, sem escola), professor (de uma escola) e aluno (ligado a um registro de `alunos`). |
| `turmas` | Turmas da escola, com faixa etária (idade mínima/máxima) e professor responsável. |
| `horarios_turma` | Dias da semana e horários de cada turma (uma turma pode ter vários). |
| `alunos` | Cadastro dos alunos: dados pessoais, responsável, turma, faixa atual, data de ingresso e situação (ativo). |
| `frequencias` | Presença/falta de cada aluno por data (uma por dia). |
| `graduacoes` | Histórico de trocas de faixa, com faixa anterior e nova. |
| `categorias_curriculo` | Grupos de conteúdo do currículo de cada faixa (ex.: "Ukemi", "Nage-waza"), definidos por escola. |
| `tecnicas` | Técnicas de cada categoria, ordenadas. Desativadas em vez de apagadas. |
| `tecnicas_aluno` | Acompanhamento técnico: nível do aluno em cada técnica (Iniciante / Em desenvolvimento / Domina). |
| `criterios_avaliacao` | Critérios usados nas avaliações de desempenho de cada escola (ex.: Técnica, Disciplina). |
| `avaliacoes` | Avaliação de desempenho de um aluno numa data, com observações e avaliador. |
| `avaliacao_notas` | Nota de 1 a 5 por critério em cada avaliação. |
| `premiacoes` | Tipos de premiação da escola (destaque do mês, frequência, campeonato, evolução, outro). |
| `premiacoes_aluno` | Premiações concedidas aos alunos (data e descrição). |

---

## Dados de exemplo (`seed.sql`)

| Tabela | Registros | Observação |
|---|---:|---|
| `faixas` | 8 | Marrom e Preta com `conteudo_definido = false`. |
| `escolas` | 2 | Academia Hajime (Rio de Janeiro/RJ) e Dojo Kizuna (Niterói/RJ). |
| `usuarios` | 6 | 1 administrador, 3 professores, 2 alunos. |
| `turmas` | 5 | Hajime: Infantil, Juvenil, Adulto. Kizuna: Kids, Adulto e Juvenil. |
| `horarios_turma` | 10 | 2 horários por turma. |
| `alunos` | 35 | 23 na Hajime e 12 na Kizuna; 33 ativos e 2 desativados. |
| `categorias_curriculo` | 30 | 15 por escola (Branca a Roxa). |
| `tecnicas` | 110 | 55 por escola. Nenhuma em Marrom/Preta. |
| `graduacoes` | 87 | Histórico coerente com a faixa atual de cada aluno. |
| `frequencias` | 3.046 | Último ano de aulas, conforme os dias de cada turma. |
| `tecnicas_aluno` | 943 | Níveis variados nas técnicas das faixas já cursadas e da atual. |
| `criterios_avaliacao` | 8 | 4 por escola: Técnica, Disciplina, Frequência, Evolução. |
| `avaliacoes` | 116 | Com 464 notas em `avaliacao_notas` (4 por avaliação). |
| `premiacoes` | 8 | 4 tipos por escola. |
| `premiacoes_aluno` | 24 | Concessões distribuídas no último ano. |

Todos os nomes, telefones e endereços são **fictícios**.

### Usuários de demonstração

No protótipo o login é **simulado** (escolhe-se o usuário numa lista). No backend real o acesso será por e-mail e senha.

| Nome | E-mail | Perfil | Escola |
|---|---|---|---|
| Coordenação HajimeTech | `admin@hajimetech.local` | Administrador | Todas (global) |
| Sensei Ana Paula Ribeiro | `ana@hajime.local` | Professor | Academia Hajime |
| Prof. Rafael Souza | `rafael@hajime.local` | Professor | Academia Hajime |
| Sensei Marcos Tanaka | `marcos@kizuna.local` | Professor | Dojo Kizuna |
| Lucas Oliveira | `lucas@aluno.local` | Aluno | Academia Hajime |
| Yuki Tanaka | `yuki@aluno.local` | Aluno | Dojo Kizuna |

IDs seguem um padrão legível para facilitar testes: escolas `00000001-...-00000000000N`, usuários `00000002-...`, turmas `00000003-...`, alunos `00000005-...` etc.
