# Arquitetura do HajimeTech

Este documento mostra, com desenhos, como o sistema funciona e por que ele foi organizado assim. Os diagramas usam Mermaid e aparecem desenhados direto no GitHub.

## 1. Visão geral

O HajimeTech tem três partes que conversam em sequência: a interface no navegador, a API e o banco de dados.

```mermaid
flowchart LR
    U([Pessoa usuária<br/>administrador, professor ou aluno])
    subgraph Navegador
        F[Frontend<br/>React + Vite + TypeScript]
    end
    subgraph Servidor
        A[API REST<br/>Node.js + Express]
    end
    subgraph Dados
        B[(PostgreSQL)]
        M[Migrations do Prisma]
        S[seed.sql<br/>dados de demonstração]
    end

    U --> F
    F -- "HTTP + JSON<br/>token JWT no cabeçalho" --> A
    A -- "SQL com o driver pg<br/>sempre filtrando por escola" --> B
    M -. cria e atualiza as tabelas .-> B
    S -. carrega os dados iniciais .-> B
```

| Parte | Responsabilidade | Onde fica |
|---|---|---|
| Frontend | Mostrar as telas, validar formulários, esconder o que o perfil não pode usar | `frontend/` |
| API | Autenticar, conferir permissões, aplicar as regras de negócio, calcular o painel | `backend/src` |
| Banco | Guardar os dados com integridade (chaves, restrições e gatilhos) | `backend/prisma` e `database/` |

**Decisão principal:** a segurança fica no servidor. O front esconde botões para deixar a tela mais simples, mas quem decide se uma ação é permitida é sempre a API. Assim, mesmo que alguém chame a API direto, as regras continuam valendo.

## 2. Como o front foi pensado

O front foi construído em camadas, para cada parte ter uma única responsabilidade e para ser possível desenvolver as telas antes da API existir.

```mermaid
flowchart TB
    subgraph Telas["pages (uma por tela)"]
        P1[Painel] & P2[Alunos] & P3[Currículo] & P4[Frequência] & P5[...]
    end
    subgraph Componentes["components"]
        C1[Layout e menu] & C2[Gráficos] & C3[UI: botões, campos, modais, abas]
    end
    subgraph Estado["contexts"]
        X1[AuthContext<br/>usuário e token]
        X2[EscolaContext<br/>escola selecionada]
    end
    subgraph Servicos["services"]
        SV[alunosService, curriculoService,<br/>dashboardService ...]
        H[http.ts<br/>fetch + token + erros]
    end
    API[(API)]

    Telas --> Componentes
    Telas --> Estado
    Telas --> SV
    SV --> H
    H --> API
```

**Princípios que guiaram o front**

1. **As telas nunca chamam a API direto.** Toda busca de dados passa por uma função de `services`. Isso permitiu criar as telas primeiro, com dados simulados, e depois trocar só o corpo dessas funções pelas chamadas reais, sem mexer em nenhuma tela.
2. **Tipos em um só lugar.** `frontend/src/types/index.ts` descreve cada entidade (Aluno, Turma, Graduação...) igual ao banco, em camelCase. Se o formato mudar, o TypeScript aponta todos os lugares afetados.
3. **Escola selecionada como contexto.** Todas as telas leem a escola do `EscolaContext` e a repassam aos services. É assim que o sistema funciona com várias academias.
4. **Permissões declaradas numa tabela.** `utils/permissoes.ts` diz o que cada perfil pode fazer. As telas perguntam `pode('editarCurriculo')` em vez de repetir regras.
5. **Componentes de interface reaproveitados.** Botões, campos, modais, abas e cartões ficam em `components/ui`, com acessibilidade embutida (rótulos, foco visível, navegação por teclado). Cada tela só monta as peças.
6. **Pensado para quem não é da área.** Cada gráfico tem título simples e uma frase explicando o que mostra, os números grandes comparam com o período anterior e as faixas aparecem com a cor real e o nome escrito.
7. **Identidade visual em tokens.** Cores, fontes e espaçamentos ficam em `styles/tokens.css`, para manter o padrão vermelho, azul e branco em todas as telas.

## 3. Caminho de uma requisição

Exemplo: o professor abre a tela de Alunos.

```mermaid
sequenceDiagram
    autonumber
    actor Prof as Professor
    participant Tela as AlunosPage
    participant Serv as alunosService
    participant API as API (Express)
    participant BD as PostgreSQL

    Prof->>Tela: abre "Alunos"
    Tela->>Serv: listar(escolaId, filtros)
    Serv->>API: GET /api/escolas/:escolaId/alunos<br/>Authorization: Bearer token
    API->>API: autenticar (token válido?)
    API->>API: acessoEscola (a escola é a do professor?)
    API->>API: exigirPerfil (administrador ou professor?)
    API->>BD: SELECT ... WHERE escola_id = $1
    BD-->>API: linhas (snake_case)
    API-->>Serv: JSON em camelCase
    Serv-->>Tela: Aluno[]
    Tela-->>Prof: tabela de alunos
```

Se qualquer verificação falhar, a API responde `{ "erro": "mensagem" }` com o status certo (401, 403, 404...), e a tela mostra a mensagem. Em caso de 401, o front volta para o login.

## 4. Organização da API

```mermaid
flowchart LR
    R[Requisição] --> AU[autenticar<br/>middleware/auth.js]
    AU --> E{Rota de escola?}
    E -- "não: /api/faixas, /api/escolas" --> RT1[rota]
    E -- "sim: /api/escolas/:escolaId/..." --> AE[acessoEscola<br/>middleware/escola.js]
    AE --> SL[alunoSomenteLeitura]
    SL --> RT2[rota do domínio<br/>alunos, turmas, currículo...]
    RT1 --> V[validação<br/>lib/http.js]
    RT2 --> V
    V --> SQL[(consulta SQL)]
    SQL --> MP[conversão<br/>lib/mapeadores.js]
    MP --> RESP[resposta JSON]
    V -. erro .-> ERR[tratamento central<br/>app.js]
    ERR --> RESP
```

**Decisões da API**

* **Rotas aninhadas por escola** (`/api/escolas/:escolaId/...`): o escopo fica explícito na URL e é conferido em um único middleware.
* **SQL direto com `pg` e Prisma só para migrations:** as consultas ficam visíveis e simples de ler; o Prisma garante o versionamento do banco.
* **Erros centralizados:** as rotas lançam `ErroHttp` e o `app.js` monta a resposta, sempre no mesmo formato.
* **Transações** nas operações compostas (graduação, chamada, turma com horários), para nunca gravar pela metade.

## 5. Perfis e permissões

```mermaid
flowchart TB
    T[Token JWT<br/>perfil, escolaId, alunoId] --> P{Perfil}
    P -- administrador --> AD[Qualquer escola<br/>gerencia escolas e todos os cadastros]
    P -- professor --> PR[Só a própria escola<br/>gerencia alunos, turmas, frequência,<br/>graduações, currículo, avaliações e premiações]
    P -- aluno --> AL[Só a própria escola<br/>somente leitura dos próprios dados<br/>e do currículo]
```

## 6. Modelo de dados (resumo)

Todas as tabelas de dados têm `escola_id`. Chaves estrangeiras compostas impedem que um registro aponte para dados de outra escola. O modelo completo, com todas as colunas, está em [`database/README.md`](../database/README.md).

```mermaid
erDiagram
    escolas ||--o{ turmas : tem
    escolas ||--o{ alunos : tem
    escolas ||--o{ usuarios : tem
    turmas ||--o{ horarios_turma : tem
    turmas ||--o{ alunos : agrupa
    faixas ||--o{ alunos : "faixa atual"
    alunos ||--o{ frequencias : registra
    alunos ||--o{ graduacoes : recebe
    faixas ||--o{ categorias_curriculo : organiza
    categorias_curriculo ||--o{ tecnicas : contém
    alunos ||--o{ tecnicas_aluno : evolui
    tecnicas ||--o{ tecnicas_aluno : "nível em"
    alunos ||--o{ avaliacoes : recebe
    avaliacoes ||--o{ avaliacao_notas : tem
    criterios_avaliacao ||--o{ avaliacao_notas : avalia
    premiacoes ||--o{ premiacoes_aluno : concedida
    alunos ||--o{ premiacoes_aluno : ganha
```

## 7. Ambiente de desenvolvimento

```mermaid
flowchart LR
    subgraph Docker["database/docker-compose.yml"]
        DB[(db<br/>PostgreSQL 16<br/>porta 5433)]
        MG[migrate<br/>aplica migrations<br/>e carrega o seed]
    end
    BE[backend<br/>npm run dev<br/>porta 3000]
    FE[frontend<br/>npm run dev<br/>porta 5173]
    CI[GitHub Actions<br/>build do front e<br/>testes com banco]

    MG --> DB
    BE --> DB
    FE --> BE
    CI -. a cada pull request .-> BE
    CI -. a cada pull request .-> FE
```

## 8. Onde mexer para cada tipo de mudança

| Quero... | Arquivos |
|---|---|
| Criar uma tela | `frontend/src/pages`, rota em `AppRoutes.tsx`, item de menu em `components/layout/AppLayout.tsx` |
| Buscar ou gravar um dado novo | Função em `frontend/src/services` e rota em `backend/src/routes` |
| Mudar uma regra de permissão | `backend/src/middleware` (servidor) e `frontend/src/utils/permissoes.ts` (tela) |
| Mudar o banco | `backend/prisma/schema.prisma` e uma migration nova (`npm run db:migrate`) |
| Mudar os dados de demonstração | `frontend/src/mocks` e `npm run gerar-seed` |
| Mudar cores ou fontes | `frontend/src/styles/tokens.css` |
