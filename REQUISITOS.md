# Requisitos do HajimeTech

Sistema web de gestão para academias de judô, com suporte a **várias escolas** (multi-escola). Este documento reúne os requisitos funcionais, não funcionais, as regras de negócio e a matriz de permissões por perfil.

Documentos relacionados: [`database/README.md`](database/README.md) (modelo de dados) e [`backend/README.md`](backend/README.md) (contrato da API).

> **Situação da entrega:** o front-end funciona com dados simulados (mocks). Onde um requisito depende do backend, isso está indicado como *(backend)*.

---

## 1. Requisitos funcionais

### Escolas

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir **selecionar a escola ativa**. O administrador pode alternar entre todas as escolas; professor e aluno ficam fixos na própria escola. Todos os dados exibidos pertencem à escola selecionada. |
| RF02 | O administrador deve poder **gerenciar escolas**: cadastrar, editar (nome, cidade, endereço, telefone, responsável) e desativar/reativar. A lista mostra, para cada escola, a quantidade de alunos ativos e de turmas ativas. |

### Autenticação e perfis

| ID | Requisito |
|---|---|
| RF03 | No protótipo, a entrada deve ser **simulada**: o usuário escolhe um dos usuários de demonstração (administrador, professores e alunos). *(backend: login com e-mail e senha, retornando um token.)* |
| RF04 | O sistema deve adaptar menus, telas e ações ao **perfil** do usuário (Administrador, Professor, Aluno), escondendo o que ele não pode fazer, e permitir **sair** / trocar de usuário. |
| RF05 | O protótipo deve permitir **restaurar os dados de exemplo**, descartando as alterações feitas na sessão. |

### Dashboard

| ID | Requisito |
|---|---|
| RF06 | Exibir os indicadores principais: **alunos ativos**, **presenças no período** (padrão: últimos 30 dias), **taxa de presença** (%) e **graduações no período**. |
| RF07 | Cada indicador deve mostrar a **comparação com o período anterior** de mesmo tamanho (valor anterior e variação percentual, com indicação de alta/queda). |
| RF08 | Permitir **filtrar** o dashboard por **período** (ex.: 30, 90 e 180 dias) e por **turma** (ou todas). |
| RF09 | Exibir a **distribuição de alunos por faixa**, usando a cor real de cada faixa. |
| RF10 | Exibir a **distribuição de alunos por turma**. |
| RF11 | Exibir a **evolução da frequência** semana a semana (presenças e faltas). |
| RF12 | Listar as **graduações recentes** (aluno, faixa anterior → nova faixa, data). |
| RF13 | Exibir **destaques**: premiações recentes e os alunos mais assíduos do período. |
| RF14 | Cada indicador e gráfico deve ter uma **explicação em linguagem simples** do que significa e de como é calculado. |

### Alunos

| ID | Requisito |
|---|---|
| RF15 | Listar os alunos da escola com **busca por nome** (sem diferenciar maiúsculas nem acentos) e filtros por **turma** e **faixa**, com opção de exibir também os desativados. |
| RF16 | **Cadastrar** aluno: nome, data de nascimento, turma, faixa inicial, telefone, responsável, observações e data de ingresso. A escola é a escola ativa. |
| RF17 | **Editar** os dados do aluno (a faixa não é editada aqui: muda apenas por graduação). |
| RF18 | **Excluir** aluno com confirmação, o que apenas o **desativa** (sem apagar o histórico), e permitir **reativá-lo**. |
| RF19 | Exibir o **perfil do aluno** com: dados cadastrais, frequência (histórico e percentual), histórico de graduações, técnicas por nível, avaliações, premiações e **barra de progresso** na faixa atual. |

### Turmas

| ID | Requisito |
|---|---|
| RF20 | Cadastrar, editar e desativar/reativar **turmas**: nome, **faixa etária** (idade mínima e máxima, ou "sem limite"), professor responsável e **um ou mais horários** (dia da semana, hora de início e fim). |

### Frequência

| ID | Requisito |
|---|---|
| RF21 | Fazer a **chamada** por turma e data: listar os alunos ativos da turma, marcar presente/falta e gravar todos de uma vez. Uma chamada já feita pode ser revista e corrigida. |
| RF22 | Consultar o **histórico de frequência** de cada aluno. |

### Graduações

| ID | Requisito |
|---|---|
| RF23 | **Registrar graduação**: aluno, nova faixa, data e observações. O sistema guarda automaticamente a faixa anterior e atualiza a faixa atual do aluno. |
| RF24 | Consultar o **histórico de graduações** da escola e de cada aluno. |

### Acompanhamento técnico

| ID | Requisito |
|---|---|
| RF25 | Registrar, para cada aluno e técnica, o **nível**: **Iniciante**, **Em desenvolvimento** ou **Domina**, com observações. |
| RF26 | Calcular e exibir o **progresso** do aluno na faixa atual (técnicas dominadas / total de técnicas ativas da faixa). |

### Currículo

| ID | Requisito |
|---|---|
| RF27 | **Visualizar o currículo por faixa** (seletor com as 8 faixas), com categorias e técnicas na ordem definida. Em Marrom e Preta, exibir a mensagem "Conteúdo ainda não definido pela academia". |
| RF28 | **Criar, editar e excluir categorias** de uma faixa. Excluir desativa a categoria e suas técnicas. |
| RF29 | **Criar e editar técnicas** (nome e descrição) e **desativar/reativar** técnicas, com opção de exibir as desativadas. |
| RF30 | **Reordenar** categorias e técnicas (mover para cima/para baixo). |

### Avaliação de desempenho

| ID | Requisito |
|---|---|
| RF31 | Registrar **avaliação de desempenho** de um aluno: data, **nota de 1 a 5 para cada critério** da escola (ex.: Técnica, Disciplina, Frequência, Evolução) e observações. O avaliador é o usuário logado. |
| RF32 | Exibir o **histórico de avaliações** do aluno com **gráfico de evolução** (média e notas por critério ao longo do tempo). |

### Premiações

| ID | Requisito |
|---|---|
| RF33 | Cadastrar, editar e desativar **tipos de premiação** (nome, descrição, tipo: destaque do mês, frequência, campeonato, evolução, outro). |
| RF34 | **Conceder** uma premiação a um aluno (data e descrição) e remover uma concessão lançada por engano. |

### Relatórios

| ID | Requisito |
|---|---|
| RF35 | Gerar **relatórios** da escola (ex.: frequência, alunos por faixa e turma, graduações, premiações, desempenho) com os filtros de período e turma. |
| RF36 | Permitir **imprimir** os relatórios (ou salvar em PDF pelo navegador) em layout próprio para papel, sem menus e botões. |

### Área do aluno

| ID | Requisito |
|---|---|
| RF37 | O aluno deve ter a área **"Minha evolução"**, somente leitura, com sua faixa, progresso no currículo da faixa atual, frequência, graduações, avaliações e premiações. |

---

## 2. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Responsividade | Funcionar bem em **desktop e celular** (a partir de 360 px de largura), sem rolagem horizontal; menu recolhível em telas pequenas; tabelas adaptadas (cartões ou rolagem interna). |
| RNF02 | Acessibilidade (contraste) | Atender **WCAG 2.1 nível AA**: contraste mínimo 4,5:1 para texto normal e 3:1 para textos grandes e elementos gráficos. Badges de faixa usam a cor de texto acessível (`corTexto`), e a informação nunca depende só da cor (o nome da faixa aparece escrito). |
| RNF03 | Acessibilidade (interação) | Tudo operável por **teclado**, com **foco visível**; **rótulos** em todos os campos; mensagens de erro associadas ao campo; botões só com ícone têm nome acessível; gráficos com resumo em texto; hierarquia de títulos correta; idioma da página `pt-BR`. |
| RNF04 | Desempenho | Carregamento inicial em até ~3 s em conexão 4G; respostas às ações em até 1 s; indicadores do dashboard calculados no servidor *(backend)*; feedback de carregamento em toda operação. |
| RNF05 | Usabilidade para leigos | Linguagem simples e sem jargão técnico; termos do judô acompanhados de explicação; confirmação antes de ações que desativam/removem; mensagens claras de sucesso e erro; estados vazios que orientam o próximo passo. |
| RNF06 | Identidade visual | Paleta **vermelho, azul e branco**. Fontes (Google Fonts): **Dela Gothic One** para títulos (a fonte "Gothic One" solicitada não existe no Google Fonts; Dela Gothic One é a mais próxima), **Montserrat** para textos e **Yuji Syuku** para a logomarca. |
| RNF07 | Localização | Interface em português do Brasil; datas no formato `dd/mm/aaaa`; semana começando na segunda-feira nos gráficos semanais. |
| RNF08 | Manutenibilidade | Código em **TypeScript**; tipos de domínio centralizados (`frontend/src/types`); **camada de services** como único acesso a dados, permitindo trocar os mocks pela API sem alterar telas; dados de exemplo e `seed.sql` gerados da mesma fonte. |
| RNF09 | Segurança e isolamento | Dados **isolados por escola** (filtro por `escola_id` e chaves compostas no banco); permissões verificadas **no servidor**; senhas com hash (bcrypt/argon2); token com expiração; HTTPS em produção; validação de toda entrada *(backend)*. |
| RNF10 | Privacidade | Tratar dados pessoais (inclusive de menores) conforme a **LGPD**: coletar apenas o necessário, restringir acesso por perfil e não expor dados em URLs ou logs. |
| RNF11 | Integridade | Nenhum dado histórico é apagado (desativação lógica); operações compostas (graduação, avaliação, chamada) em transação *(backend)*. |
| RNF12 | Compatibilidade | Versões atuais (duas últimas) de **Chrome, Edge, Firefox e Safari**, no desktop, Android e iOS. |

---

## 3. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | A progressão de faixas é: **Branca → Azul → Amarela → Laranja → Verde → Roxa → Marrom → Preta**. |
| RN02 | O aluno aprende as **técnicas da faixa atual** e avança para a próxima faixa após cumprir os conhecimentos exigidos (a decisão de graduar é do professor; o progresso no currículo serve de apoio). |
| RN03 | As faixas **Marrom e Preta não têm conteúdo definido**: o sistema exibe "Conteúdo ainda não definido pela academia" e **não permite** cadastrar categorias ou técnicas nelas. |
| RN04 | **Excluir um aluno** é uma **desativação lógica**: o cadastro e todo o histórico (frequência, graduações, avaliações) são preservados, e o aluno pode ser reativado. |
| RN05 | **Técnicas não são apagadas**, apenas desativadas (e podem ser reativadas). Excluir uma categoria desativa a categoria e todas as suas técnicas. |
| RN06 | A **graduação** registra a faixa anterior e a nova faixa, e **atualiza a faixa atual** do aluno. A nova faixa deve ser superior à atual na progressão (não é possível retroceder). A faixa do aluno só muda por graduação (exceto a faixa inicial no cadastro). |
| RN07 | O **currículo** é organizado por **faixa → categorias → técnicas**, cada nível com uma **ordem** definida pela escola. Novos itens entram no fim da lista. |
| RN08 | Somente **Administrador** e **Professor** podem criar, editar, reordenar ou desativar itens do currículo. |
| RN09 | Os **dados são isolados por escola**: um usuário nunca vê nem altera dados de outra escola (exceto o Administrador, que pode selecionar qualquer escola). |
| RN10 | A **frequência é única por aluno e data**: registrar de novo na mesma data atualiza o registro existente. |
| RN11 | As **notas** das avaliações vão de **1 a 5**, uma por critério; a média da avaliação é a média simples das notas. |
| RN12 | O **progresso** do aluno é o percentual de técnicas **ativas** da faixa atual em que ele tem nível "Domina". |
| RN13 | Uma turma pode não ter idade máxima ("sem limite"); a idade máxima, quando existe, não pode ser menor que a mínima; cada horário termina depois de começar. |
| RN14 | Um aluno pode ficar **sem turma**; a chamada de uma turma considera apenas os alunos **ativos** dela. |
| RN15 | O **Administrador** é global (não pertence a uma escola); **Professor** e **Aluno** pertencem a exatamente uma escola; cada usuário Aluno está ligado a um cadastro de aluno. |
| RN16 | Escolas, turmas, tipos de premiação e critérios de avaliação também são **desativados**, nunca apagados. Apenas uma **concessão** de premiação lançada por engano pode ser removida. |

---

## 4. Perfis de acesso e permissões

| Perfil | Descrição |
|---|---|
| **Administrador** | Coordenação geral. Acessa **todas as escolas** e é o único que gerencia escolas. Tem todas as permissões de Professor em qualquer escola. |
| **Professor** | Gerencia o dia a dia **da própria escola**. Não acessa dados de outras escolas. |
| **Aluno** | **Somente leitura** da própria evolução ("Minha evolução"). Não vê dados de outros alunos. |

Legenda: **V** = ver · **C** = criar · **E** = editar · **D** = desativar/excluir · **Sem acesso** = o perfil não vê a funcionalidade.

| Funcionalidade | Administrador | Professor | Aluno |
|---|---|---|---|
| Selecionar escola | Todas | Só a própria (fixa) | Só a própria (fixa) |
| Gestão de escolas | V C E D | V (só a própria) | Sem acesso |
| Dashboard | V | V | Sem acesso |
| Alunos (lista e cadastro) | V C E D | V C E D | V (só os próprios dados) |
| Perfil do aluno | V | V | V (só o próprio) |
| Turmas e horários | V C E D | V C E D | V |
| Frequência (chamada) | V C E | V C E | V (só a própria) |
| Graduações | V C | V C | V (só as próprias) |
| Acompanhamento técnico | V C E | V C E | V (só o próprio) |
| Currículo (categorias e técnicas) | V C E D + reordenar | V C E D + reordenar | V |
| Avaliações de desempenho | V C | V C | V (só as próprias) |
| Critérios de avaliação | V | V | V |
| Tipos de premiação | V C E D | V C E D | V |
| Concessão de premiações | V C D | V C D | V (só as próprias) |
| Relatórios e impressão | V | V | Sem acesso |
| Minha evolução | Sem acesso | Sem acesso | V |

Observações:

- **Professor** tem todas essas permissões **apenas na própria escola**; tentar acessar outra escola resulta em "sem permissão".
- **Aluno** nunca cria, edita ou desativa nada.
- Critérios de avaliação são exibidos, mas ainda não há tela nem endpoint para editá-los (são definidos nos dados da escola).
- No protótipo, as permissões são simuladas no front-end; no sistema final, o **servidor** deve validá-las em toda requisição (ver `backend/README.md`, seção 4).
