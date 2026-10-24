/**
 * Tipos de domínio do HajimeTech, documentados em JSDoc.
 *
 * Espelham as tabelas de backend/prisma/schema.prisma (nomes em camelCase no
 * front, snake_case no banco). A API devolve objetos neste formato; a conversão
 * fica em backend/src/lib/mapeadores.js.
 *
 * Este arquivo não exporta código: serve de referência e permite que o editor
 * mostre os campos de cada objeto. Para usar um tipo num comentário JSDoc:
 *   @param {import('../types').Aluno} aluno
 */

/* ---------------------------------------------------------------- Básicos */

/** @typedef {string} ID Identificador UUID. */
/** @typedef {string} DataISO Data no formato AAAA-MM-DD. */
/** @typedef {string} DataHoraISO Data e hora no formato ISO 8601. */

/* ---------------------------------------------------------------- Faixas */

/**
 * @typedef {'branca' | 'azul' | 'amarela' | 'laranja' | 'verde' | 'roxa' | 'marrom' | 'preta'} FaixaId
 */

/**
 * @typedef {Object} Faixa
 * @property {FaixaId} id
 * @property {string} nome
 * @property {number} ordem Posição na progressão (1 = Branca ... 8 = Preta).
 * @property {string} cor Cor real da faixa, usada em badges e gráficos.
 * @property {string} corTexto Cor de texto com contraste acessível sobre `cor`.
 * @property {boolean} conteudoDefinido Falso quando a academia ainda não definiu o conteúdo (Marrom e Preta).
 */

/* ---------------------------------------------------------------- Escolas e usuários */

/**
 * @typedef {Object} Escola
 * @property {ID} id
 * @property {string} nome
 * @property {string} cidade
 * @property {string} endereco
 * @property {string} telefone
 * @property {string} responsavel
 * @property {boolean} ativo
 * @property {DataHoraISO} criadoEm
 * @property {DataHoraISO} atualizadoEm
 */

/** @typedef {'administrador' | 'professor' | 'aluno'} Perfil */

/**
 * @typedef {Object} Usuario
 * @property {ID} id
 * @property {ID | null} escolaId Nulo para administradores globais.
 * @property {string} nome
 * @property {string} email
 * @property {Perfil} perfil
 * @property {ID | null} alunoId Preenchido apenas para o perfil aluno.
 * @property {boolean} ativo
 */

/* ---------------------------------------------------------------- Turmas */

/** @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6} DiaSemana 0 = domingo ... 6 = sábado. */

/**
 * @typedef {Object} HorarioTurma
 * @property {ID} id
 * @property {ID} turmaId
 * @property {DiaSemana} diaSemana
 * @property {string} horaInicio HH:MM
 * @property {string} horaFim HH:MM
 */

/**
 * @typedef {Object} Turma
 * @property {ID} id
 * @property {ID} escolaId
 * @property {string} nome
 * @property {number} idadeMinima
 * @property {number | null} idadeMaxima Nulo quando não há limite.
 * @property {ID | null} professorId
 * @property {boolean} ativo
 * @property {HorarioTurma[]} horarios
 * @property {DataHoraISO} criadoEm
 * @property {DataHoraISO} atualizadoEm
 */

/* ---------------------------------------------------------------- Alunos */

/**
 * @typedef {Object} Aluno
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID | null} turmaId
 * @property {string} nome
 * @property {DataISO} dataNascimento Texto vazio quando não informada.
 * @property {FaixaId} faixaId
 * @property {string} telefone
 * @property {string} responsavel
 * @property {string} observacoes
 * @property {DataISO} dataIngresso
 * @property {boolean} ativo "Excluir" apenas marca como falso.
 * @property {DataHoraISO} criadoEm
 * @property {DataHoraISO} atualizadoEm
 */

/* ---------------------------------------------------------------- Frequência e graduações */

/**
 * @typedef {Object} Frequencia
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} alunoId
 * @property {ID} turmaId
 * @property {DataISO} data
 * @property {boolean} presente
 */

/**
 * @typedef {Object} Graduacao
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} alunoId
 * @property {FaixaId} faixaAnteriorId
 * @property {FaixaId} novaFaixaId
 * @property {DataISO} data
 * @property {string} observacoes
 * @property {DataHoraISO} criadoEm
 */

/* ---------------------------------------------------------------- Currículo */

/**
 * @typedef {Object} CategoriaCurriculo
 * @property {ID} id
 * @property {ID} escolaId
 * @property {FaixaId} faixaId
 * @property {string} nome
 * @property {string} descricao
 * @property {number} ordem
 * @property {boolean} ativo
 */

/**
 * @typedef {Object} Tecnica
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} categoriaId
 * @property {string} nome
 * @property {string} descricao
 * @property {number} ordem
 * @property {boolean} ativo Técnicas nunca são apagadas, apenas desativadas.
 */

/** @typedef {CategoriaCurriculo & { tecnicas: Tecnica[] }} CategoriaComTecnicas */

/** @typedef {'iniciante' | 'em_desenvolvimento' | 'domina'} NivelTecnica */

/**
 * @typedef {Object} TecnicaAluno
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} alunoId
 * @property {ID} tecnicaId
 * @property {NivelTecnica} nivel
 * @property {string} observacoes
 * @property {DataHoraISO} atualizadoEm
 */

/* ---------------------------------------------------------------- Avaliações */

/**
 * @typedef {Object} CriterioAvaliacao
 * @property {ID} id
 * @property {ID} escolaId
 * @property {string} nome
 * @property {string} descricao
 * @property {number} ordem
 * @property {boolean} ativo
 */

/**
 * @typedef {Object} NotaCriterio
 * @property {ID} criterioId
 * @property {number} nota De 1 a 5.
 */

/**
 * @typedef {Object} Avaliacao
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} alunoId
 * @property {ID | null} avaliadorId
 * @property {DataISO} data
 * @property {string} observacoes
 * @property {NotaCriterio[]} notas
 * @property {DataHoraISO} criadoEm
 */

/* ---------------------------------------------------------------- Premiações */

/** @typedef {'destaque_mes' | 'frequencia' | 'campeonato' | 'evolucao' | 'outro'} TipoPremiacao */

/**
 * @typedef {Object} Premiacao
 * @property {ID} id
 * @property {ID} escolaId
 * @property {string} nome
 * @property {string} descricao
 * @property {TipoPremiacao} tipo
 * @property {boolean} ativo
 */

/**
 * @typedef {Object} PremiacaoAluno
 * @property {ID} id
 * @property {ID} escolaId
 * @property {ID} premiacaoId
 * @property {ID} alunoId
 * @property {DataISO} data
 * @property {string} descricao
 */

/* ---------------------------------------------------------------- Painel */

/**
 * @typedef {Object} FiltroDashboard
 * @property {number} periodoDias Tamanho do período em dias (ex.: 30, 90, 180).
 * @property {ID | null} turmaId Nulo = todas as turmas.
 */

/**
 * @typedef {Object} IndicadorComparado
 * @property {number} atual
 * @property {number} anterior
 * @property {number | null} variacao Variação percentual (nula se não houver base de comparação).
 */

/**
 * @typedef {Object} Dashboard
 * @property {IndicadorComparado} alunosAtivos
 * @property {IndicadorComparado} presencas
 * @property {IndicadorComparado} taxaPresenca
 * @property {IndicadorComparado} graduacoes
 * @property {{ faixaId: FaixaId, nome: string, cor: string, total: number }[]} porFaixa
 * @property {{ turmaId: ID, nome: string, total: number }[]} porTurma
 * @property {{ semana: DataISO, presencas: number, faltas: number }[]} evolucaoFrequencia
 * @property {(Graduacao & { alunoNome: string })[]} graduacoesRecentes
 * @property {(PremiacaoAluno & { alunoNome: string, premiacaoNome: string, tipo: TipoPremiacao })[]} premiacoesRecentes
 * @property {{ alunoId: ID, nome: string, faixaId: FaixaId, presencas: number }[]} maisAssiduos
 */

export {};
