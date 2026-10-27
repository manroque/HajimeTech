# #23 Como o front foi pensado

| Campo | Valor |
|---|---|
| Número | [#23](https://github.com/manroque/HajimeTech/issues/23) |
| Tipo | Documentação |
| Área | Frontend, Documentação |
| Etiquetas | documentation, frontend |
| Situação | Resolvida no PR #25 |
| Aberta em | 23/10/2026 |

[Voltar ao índice](README.md)

## Contexto

Este registro explica como o frontend foi planejado, para quem entrar no projeto entender as decisões antes de mexer no código. Os desenhos estão na seção 2 de `docs/arquitetura.md`.

## Como o front foi pensado

**1. Telas primeiro, com dados simulados**

O front foi construído antes da API existir. Para isso, toda busca de dados passou por uma camada de services (`frontend/src/services`) que, no início, respondia com dados simulados. Quando a API ficou pronta (#5 e #6), bastou trocar o corpo dessas funções pelas chamadas reais. Nenhuma tela precisou ser reescrita.

**2. Camadas com uma responsabilidade cada**

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Telas | `pages` | Montar a página, controlar formulários e filtros |
| Componentes | `components` | Peças reaproveitáveis: layout, gráficos, botões, campos, modais |
| Estado global | `contexts` | Usuário logado (`AuthContext`) e escola selecionada (`EscolaContext`) |
| Acesso a dados | `services` | Única porta de entrada para a API |
| Tipos | `types` | Formato de cada entidade, igual ao banco |
| Regras de tela | `utils` | Formatação e matriz de permissões |

**3. Várias escolas desde o início**

Toda tela lê a escola do `EscolaContext` e a passa para os services. O administrador escolhe a escola; professor e aluno ficam presos à sua.

**4. Permissões declaradas num só lugar**

`utils/permissoes.js` diz o que cada perfil pode fazer. As telas perguntam `pode('editarCurriculo')` e escondem o que não é permitido. A garantia real fica no servidor.

**5. Pensado para quem não é da área**

* Cada gráfico tem título simples e uma frase dizendo o que ele mostra.
* Números grandes comparados com o período anterior ("+12% em relação ao mês anterior").
* Faixas sempre com a cor real e o nome escrito.
* Mensagens de erro em português, prontas para o usuário.

**6. Identidade visual e acessibilidade nos componentes base**

Cores, fontes e espaçamentos ficam em `styles/tokens.css` (vermelho, azul e branco, com contraste AA). Os componentes de `components/ui` já trazem rótulos, foco visível, mensagens de erro ligadas aos campos e modais acessíveis, então cada tela nova herda esse cuidado.

**7. Regras do domínio visíveis na interface**

* Excluir aluno pede confirmação e explica que nada é apagado.
* Marrom e Preta mostram "Conteúdo ainda não definido pela academia".
* A graduação sugere a próxima faixa e mostra quanto do currículo o aluno já domina.

## Arquivos de referência

* `docs/arquitetura.md` (seção 2)
* `frontend/src/services/index.js`, `frontend/src/types/index.js`, `frontend/src/utils/permissoes.js`, `frontend/src/components/ui/index.jsx`

## Critérios de aceite

* [x] Decisões do front registradas
* [x] Desenho das camadas em `docs/arquitetura.md`

## Relacionadas

* #24 (arquitetura do projeto)
* #6 (integração com a API)
