# HajimeTech: PI2

Sistema web de gestão e acompanhamento de alunos para uma academia de judô.

O HajimeTech foi desenvolvido como projeto acadêmico para auxiliar na organização de alunos, turmas, frequência, graduações e currículo técnico da academia.

> **Sumário:** [1. Sobre](#1--sobre-o-hajimetech) · [2. Objetivo](#2--objetivo) · [3. Currículo](#3--funcionamento-do-currículo) · [4. Funcionalidades](#4--funcionalidades) · [5. Identidade visual](#5--identidade-visual) · [6. Tecnologias](#6-️-tecnologias) · [7. Estrutura](#7--estrutura-do-projeto) · [8. Rodar o front-end](#8-️-como-rodar-o-front-end) · [9. Banco de dados](#9-️-banco-de-dados) · [10. Backend](#10--backend) · [11. Próximos passos](#11--próximos-passos)

---

## 1. 🥋 Sobre o HajimeTech

O HajimeTech organiza alunos, turmas, frequência, graduações, avaliação de desempenho, premiações e o currículo técnico de cada faixa.

O sistema suporta **mais de uma academia/escola de judô**. Cada aluno pertence a uma escola, e todas as informações (alunos, turmas, frequência, graduações, currículo, premiações e indicadores) são filtradas e organizadas pela escola selecionada.

**Situação desta entrega:**

| Parte | Situação |
|---|---|
| Front-end (`/frontend`) | Completo e navegável, com **dados mockados** |
| Banco de dados (`/database`) | Pronto: `schema.sql`, `seed.sql` e DER |
| Backend (`/backend`) | Não implementado nesta entrega; há contratos de API e um ponto de partida para a equipe |

---

## 2. 🎯 Objetivo

Centralizar as principais informações da academia em um sistema web simples, organizado e acessível.

O sistema permite acompanhar:

- alunos cadastrados;
- turmas e horários;
- frequência;
- graduações;
- evolução técnica;
- currículo de cada faixa;
- indicadores da academia.

Além disso, esta versão acrescenta avaliações de desempenho e premiações, além do suporte a várias escolas.

---

## 3. 🥋 Funcionamento do currículo

O currículo técnico segue uma progressão de faixas:

**Branca → Azul → Amarela → Laranja → Verde → Roxa → Marrom → Preta**

A ideia do sistema é que o aluno aprenda as técnicas correspondentes à sua faixa atual e avance para a próxima faixa após cumprir os conhecimentos definidos pela academia.

Os conteúdos das faixas **Marrom e Preta ainda não estão definidos no projeto**, portanto não são inventados pelo sistema.

O currículo pode ser organizado por:

- categorias;
- técnicas;
- ordem das técnicas;
- ordem das categorias.

Administradores e professores podem editar o currículo.

**Como isso aparece no sistema:**

- Na tela **Currículo**, as faixas Marrom e Preta mostram o aviso *"Conteúdo ainda não definido pela academia"*. O front e o banco (por meio de um gatilho no `schema.sql`) recusam o cadastro de itens nessas faixas.
- As faixas Branca a Roxa trazem um **currículo de exemplo** baseado no Gokyo do Kodokan, que cada academia pode editar à vontade.
- Técnicas e categorias nunca são apagadas, apenas **desativadas**, para preservar o histórico dos alunos.
- Somente **administradores e professores** veem os botões de criar, editar, reordenar e desativar. O perfil Aluno vê o currículo em modo leitura.
- O perfil de cada aluno tem uma **barra de progresso** com a porcentagem de técnicas da faixa atual que ele já domina.

---

## 4. 📋 Funcionalidades

### Escolas *(nova)*

- Lista de academias cadastradas (cadastro, edição e desativação feitos pelo administrador)
- Ao selecionar uma escola, todo o sistema passa a exibir os dados dela

### Dashboard

- Total de alunos ativos
- Presenças dos últimos 30 dias
- Distribuição de alunos por faixa
- Distribuição de alunos por turma

Novidades desta versão:

- evolução da frequência semana a semana;
- graduações recentes;
- destaques e premiações do período;
- os alunos que mais treinaram;
- cartões com número grande e comparação com o período anterior (ex.: "+12% em relação ao mês anterior");
- filtros por período (30 dias, 3 meses ou 6 meses) e por turma;
- em cada gráfico, um título em linguagem simples, uma frase explicando o que ele mostra e tooltips sem jargão;
- as cores reais das faixas no gráfico de distribuição por faixa.

### Alunos

- Cadastro de alunos
- Edição de alunos
- Desativação de alunos
- Busca por nome
- Associação com turma
- Registro de faixa atual
- Telefone
- Observações

> A opção "Excluir" desativa o cadastro do aluno em vez de apagar fisicamente seus dados do banco.

**Perfil do aluno** *(novo)*: dados, frequência, histórico de graduações, técnicas aprendidas, avaliações, premiações, jornada de faixas e a barra de progresso do currículo da faixa atual.

### Turmas

- Cadastro de turmas
- Horários
- Faixa etária

### Frequência

- Seleção da data
- Registro de presença
- Registro de ausência
- Atualização da presença do aluno

### Graduações

- Registro de graduação
- Faixa anterior
- Nova faixa
- Data da graduação
- Observações
- Histórico de graduações

### Acompanhamento técnico

- Registro de técnicas por aluno
- Nível da técnica
- Observações

Os níveis usados são **Iniciante**, **Em desenvolvimento** e **Domina**.

### Currículo

- Visualização do currículo por faixa
- Criação de categorias
- Edição de categorias
- Exclusão de categorias
- Criação de técnicas
- Edição de técnicas
- Desativação de técnicas
- Reordenação de técnicas
- Organização por categorias

Esta versão também permite **reordenar as categorias** (botões de subir e descer).

### Avaliação de desempenho *(nova)*

- Avaliação individual de cada aluno nos critérios definidos pela academia: Técnica, Disciplina, Frequência e Evolução
- Nota de 1 a 5 por critério, com um conceito em palavras (de "Precisa de atenção" a "Excelente"), e observações do professor
- Histórico de avaliações com gráfico de evolução

### Premiação *(nova)*

- Cadastro de tipos de premiação (destaque do mês, maior frequência, campeonatos, evolução)
- Vínculo da premiação ao aluno, com data e descrição
- Exibição no perfil do aluno e no dashboard

### Relatórios

- Distribuição de alunos por faixa
- Distribuição de alunos por turma

Novidades desta versão: indicadores do dashboard em formato de tabela (com comparação ao período anterior), frequência semanal, graduações, premiações, alunos mais assíduos e a opção **Imprimir relatório** (também serve para salvar em PDF).

### Perfis de acesso *(nova)*

| Perfil | O que pode fazer |
|---|---|
| **Administrador** | Tudo, incluindo a gestão de escolas e do currículo |
| **Professor** | Gerencia alunos, turmas, frequência, graduações, avaliações, premiações e o currículo **da sua escola** |
| **Aluno** | Somente leitura: acompanha a própria evolução ("Minha evolução") e consulta o currículo |

No front, o login é **simulado**: você escolhe o perfil na tela de entrada. A matriz completa de permissões está em [`REQUISITOS.md`](REQUISITOS.md).

---

## 🔐 Segurança e isolamento de dados

O backend utiliza um identificador de academia para separar os dados entre academias.

As requisições utilizam o cabeçalho:

```text
x-academia-id
```

> **Atualização desta versão:** no modelo novo, o identificador da escola fica na própria rota (`/api/escolas/:escolaId/...`) e o perfil do usuário vem do token de autenticação. Todas as tabelas têm `escola_id`, e chaves estrangeiras compostas impedem que um registro aponte para dados de outra escola. Detalhes em [`backend/README.md`](backend/README.md) e [`database/README.md`](database/README.md).

---

## 5. 🎨 Identidade visual

| Elemento | Definição |
|---|---|
| Cores principais | **Vermelho** `#C8102E`, **azul** `#1D4ED8` / `#13306E` e **branco**, com tons de apoio para fundos, bordas e estados. Todos os pares de texto e fundo atingem contraste WCAG AA. |
| Cores das faixas | As cores reais do judô, usadas em badges e gráficos |
| Títulos | **Dela Gothic One** (Google Fonts). O pedido era "Gothic One"; esta é a fonte disponível mais próxima com esse nome. |
| Textos | **Montserrat** |
| Logomarca "HajimeTech" | **Yuji Syuku** |
| Símbolo | Uma faixa de judô em movimento ascendente, passando por degraus (as graduações) até um círculo vermelho (a meta), para transmitir acompanhamento e evolução |

Todos os tokens de design (cores, fontes, espaçamentos) ficam em [`frontend/src/styles/tokens.css`](frontend/src/styles/tokens.css). A interface é responsiva: no celular, o menu vira uma gaveta.

---

## 6. 🛠️ Tecnologias

### Frontend

- React
- Vite
- JavaScript
- Lucide React
- CSS

> **Nesta versão**, o front foi reescrito em **TypeScript**, com CSS Modules, **React Router** (navegação) e **Recharts** (gráficos). A versão anterior em JavaScript continua em `frontend/src/**/*.jsx` apenas como referência (veja [Próximos passos](#11--próximos-passos)).

### Backend

- Node.js
- Express
- JavaScript
- REST API

### Banco de dados

- PostgreSQL

### Testes

- Jest
- Supertest

### Versionamento

- Git
- GitHub

### Deploy

- Render

---

## 7. 📁 Estrutura do projeto

```text
HajimeTech/
├── README.md               ← este arquivo
├── REQUISITOS.md           ← requisitos funcionais, não funcionais, regras de negócio e permissões
├── frontend/               ← aplicação React + Vite + TypeScript
│   ├── index.html
│   ├── package.json
│   ├── scripts/
│   │   └── gerar-seed.ts   ← gera database/seed.sql a partir dos mocks
│   └── src/
│       ├── main.tsx, AppRoutes.tsx   ← entrada e rotas (com proteção por perfil)
│       ├── components/     ← layout, gráficos, logo, perfil do aluno e componentes de UI
│       ├── contexts/       ← sessão (AuthContext), escola selecionada (EscolaContext), avisos
│       ├── hooks/          ← useCarregar (carregamento assíncrono)
│       ├── mocks/          ← dados de exemplo (determinísticos)
│       ├── pages/          ← uma página por tela
│       ├── services/       ← camada que simula a API ← ÚNICO ponto a trocar pelo backend
│       ├── styles/         ← tokens de design e estilos globais
│       ├── types/          ← tipos de domínio (espelham o banco)
│       └── utils/          ← formatação e matriz de permissões
├── database/
│   ├── schema.sql          ← tabelas, chaves, índices, constraints e gatilhos
│   ├── seed.sql            ← dados de exemplo (gerado, coerente com os mocks)
│   └── README.md           ← como criar o banco + DER (Mermaid)
└── backend/
    ├── README.md           ← contratos de API esperados + espaço para a equipe
    └── src/ ...            ← protótipo Express anterior (referência, não alinhado ao novo schema)
```

**Telas:** Login (perfil simulado) · Escolas · Painel · Alunos · Perfil do aluno · Turmas · Frequência · Graduações · Acompanhamento técnico · Currículo · Avaliações · Premiações · Relatórios · Minha evolução (aluno).

---

## 8. ▶️ Como rodar o front-end

### Pré-requisitos

- [Node.js](https://nodejs.org/) **20 ou superior** (testado com o Node 24) e o npm
- Um navegador atualizado (Chrome, Edge, Firefox ou Safari)

### Instalação

```bash
cd frontend
npm install
```

### Iniciar

```bash
npm run dev
```

Abra **http://localhost:5173** no navegador.

### Como usar a demonstração

1. Na tela de entrada, escolha o perfil **Administrador**, **Professor** ou **Aluno** e um usuário de demonstração.
2. O administrador cai na tela **Escolas**: clique em "Acessar escola". O professor e o aluno já entram na própria escola.
3. As alterações feitas (cadastros, chamadas, graduações...) ficam salvas enquanto a aba estiver aberta. Para voltar aos dados originais, use **Restaurar**, no rodapé do menu.

| Usuário de demonstração | Perfil | Escola |
|---|---|---|
| Coordenação HajimeTech | Administrador | Todas |
| Sensei Ana Paula Ribeiro | Professor | Academia Hajime |
| Prof. Rafael Souza | Professor | Academia Hajime |
| Sensei Marcos Tanaka | Professor | Dojo Kizuna |
| Lucas Oliveira | Aluno | Academia Hajime |
| Yuki Tanaka | Aluno | Dojo Kizuna |

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Verifica os tipos (TypeScript) e gera a versão de produção em `frontend/dist` |
| `npm run preview` | Serve localmente a versão de produção gerada |
| `npm run typecheck` | Só verifica os tipos |
| `npm run gerar-seed` | Regera `database/seed.sql` a partir dos mocks |

---

## 9. 🗄️ Banco de dados

O modelo completo, com DER, dicionário de dados e convenções, está em [`database/README.md`](database/README.md).

**Com Docker (mais fácil):** o banco sobe já com as tabelas e os dados de exemplo.

```bash
cd database
docker compose up -d
```

Conexão: `postgresql://hajimetech:hajimetech@localhost:5433/hajimetech` (porta 5433, para não conflitar com um PostgreSQL instalado).

**Com PostgreSQL instalado:**

```bash
createdb hajimetech
psql -d hajimetech -f database/schema.sql
psql -d hajimetech -f database/seed.sql
```

- **PostgreSQL 14+**.
- `seed.sql` é **gerado** pelos mocks do front (`npm run gerar-seed`), então banco e interface têm exatamente os mesmos dados. Não edite o seed à mão.
- As datas de exemplo são relativas (`CURRENT_DATE - n`), para que o painel sempre mostre dados recentes.
- O `schema.sql` e o `seed.sql` foram validados num PostgreSQL real, e o seed não cria nenhuma técnica para as faixas Marrom e Preta.

---

## 10. 🔌 Backend

> **Seção a ser preenchida pela equipe de backend.**

### O que já foi feito (ponto de partida)

- **Contratos de API:** cada função em [`frontend/src/services`](frontend/src/services) tem um comentário `INTEGRAÇÃO BACKEND: MÉTODO /api/...` com o endpoint esperado. A lista completa de endpoints, com corpos de exemplo, está em [`backend/README.md`](backend/README.md).
- **Modelo de dados:** [`database/schema.sql`](database/schema.sql) é a referência oficial.
- **Tipos:** [`frontend/src/types/index.ts`](frontend/src/types/index.ts) define o formato dos objetos que a API deve devolver.
- **Cliente HTTP:** [`frontend/src/services/http.ts`](frontend/src/services/http.ts) já está pronto e usa a variável `VITE_API_URL`.
- **Protótipo anterior:** `backend/src` tem uma API Express da versão anterior, mantida como referência. Ela usa um schema antigo (`backend/migrations/001_init.sql`) e precisa ser alinhada ao novo modelo.

### Onde estão os mocks e o que substituir

| Arquivo | O que fazer na integração |
|---|---|
| `frontend/src/mocks/*` | Dados de exemplo. Continuam úteis para gerar o seed |
| `frontend/src/services/mockDb.ts` | "Banco" em memória. **Remover** depois da integração |
| `frontend/src/services/*Service.ts` | Trocar o corpo de cada função (`simular(...)`) por `http.get/post/...`, **mantendo a mesma assinatura**. Nenhuma tela precisa mudar |
| `frontend/src/contexts/AuthContext.tsx` | Trocar o login simulado por e-mail e senha (JWT) |
| `frontend/src/pages/LoginPage.tsx` | Trocar o seletor de perfil por um formulário de login |

### Como rodar o backend

*A preencher pela equipe:*

- Pré-requisitos:
- Variáveis de ambiente (`backend/.env`):
- Instalação:
- Comando para iniciar:
- Endereço local:
- Testes:
- Deploy (Render):

---

## 11. 🚀 Próximos passos

1. **Backend:** implementar os endpoints de [`backend/README.md`](backend/README.md) sobre o `schema.sql`, com autenticação JWT e permissões validadas no servidor.
2. **Integração:** substituir a camada `services` por chamadas reais e remover o `mockDb.ts`.
3. **Currículo das faixas Marrom e Preta:** quando a academia definir o conteúdo, marcar `conteudo_definido = true` na tabela `faixas` e cadastrar as técnicas pela tela Currículo.
4. **Revisar o currículo de exemplo** (Branca a Roxa) com os professores de cada escola.
5. **Gestão de usuários:** criar telas para cadastrar professores e acessos de alunos, e para editar os critérios de avaliação.
6. **Limpeza:** remover os arquivos da versão anterior do front (`frontend/src/**/*.jsx`, `frontend/src/services/api.js`, `frontend/src/styles/index.css`), que não são mais usados.
7. **Testes automatizados** para os services e as regras de negócio (Vitest no front; Jest e Supertest no backend).
8. **Deploy** do front e do backend no Render.
