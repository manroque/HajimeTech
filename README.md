# HajimeTech — PI2

Sistema web de gestão e acompanhamento de alunos para uma academia de judô.

O HajimeTech foi desenvolvido como projeto acadêmico para auxiliar na organização de alunos, turmas, frequência, graduações e currículo técnico da academia.

---

## 🎯 Objetivo

Centralizar as principais informações da academia em um sistema web simples, organizado e acessível.

O sistema permite acompanhar:

- alunos cadastrados;
- turmas e horários;
- frequência;
- graduações;
- evolução técnica;
- currículo de cada faixa;
- indicadores da academia.

---

## 🥋 Funcionamento do currículo

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

---

## 🛠️ Tecnologias

### Frontend

- React
- Vite
- JavaScript
- Lucide React
- CSS

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

## 📋 Funcionalidades

### Dashboard

- Total de alunos ativos
- Presenças dos últimos 30 dias
- Distribuição de alunos por faixa
- Distribuição de alunos por turma

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

### Relatórios

- Distribuição de alunos por faixa
- Distribuição de alunos por turma

---

## 🔐 Segurança e isolamento de dados

O backend utiliza um identificador de academia para separar os dados entre academias.

As requisições utilizam o cabeçalho:

```text
x-academia-id