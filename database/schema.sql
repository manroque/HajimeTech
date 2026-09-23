-- =============================================================================
-- HajimeTech: esquema do banco de dados (PostgreSQL 14+)
-- =============================================================================
-- Convenções:
--   * Chaves primárias UUID (gen_random_uuid), exceto `faixas`, tabela global
--     identificada por um slug legível ('branca', 'azul', ...).
--   * Toda tabela de dados tem `escola_id` → isolamento por escola (multi-escola).
--     O backend DEVE filtrar todas as consultas por escola_id.
--   * Soft delete: coluna `ativo`. Alunos, técnicas, categorias, turmas,
--     escolas e premiações nunca são apagados fisicamente.
--   * `criado_em` / `atualizado_em` em todas as tabelas; `atualizado_em` é
--     mantido pelo gatilho `definir_atualizado_em()`.
--   * Chaves estrangeiras compostas (id, escola_id) garantem que um registro
--     só referencie dados da MESMA escola.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
CREATE TYPE perfil_usuario  AS ENUM ('administrador', 'professor', 'aluno');
CREATE TYPE nivel_tecnica   AS ENUM ('iniciante', 'em_desenvolvimento', 'domina');
CREATE TYPE tipo_premiacao  AS ENUM ('destaque_mes', 'frequencia', 'campeonato', 'evolucao', 'outro');

-- -----------------------------------------------------------------------------
-- Gatilho genérico de atualizado_em
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION definir_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- escolas
-- -----------------------------------------------------------------------------
CREATE TABLE escolas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(150) NOT NULL,
  cidade        VARCHAR(120) NOT NULL DEFAULT '',
  endereco      VARCHAR(200) NOT NULL DEFAULT '',
  telefone      VARCHAR(30)  NOT NULL DEFAULT '',
  responsavel   VARCHAR(150) NOT NULL DEFAULT '',
  ativo         BOOLEAN      NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- faixas (tabela global com a progressão Branca → Preta)
-- -----------------------------------------------------------------------------
CREATE TABLE faixas (
  id                VARCHAR(20) PRIMARY KEY,
  nome              VARCHAR(40) NOT NULL UNIQUE,
  ordem             SMALLINT    NOT NULL UNIQUE CHECK (ordem BETWEEN 1 AND 20),
  cor               CHAR(7)     NOT NULL,                -- ex.: #1D4ED8
  cor_texto         CHAR(7)     NOT NULL,
  conteudo_definido BOOLEAN     NOT NULL DEFAULT true,   -- false para Marrom e Preta
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID REFERENCES escolas(id),             -- NULL = administrador global
  nome          VARCHAR(150)   NOT NULL,
  email         VARCHAR(180)   NOT NULL,
  senha_hash    VARCHAR(255),                            -- preenchido pelo backend (bcrypt/argon2)
  perfil        perfil_usuario NOT NULL,
  aluno_id      UUID,                                    -- FK adicionada após criar `alunos`
  ativo         BOOLEAN        NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT ck_usuarios_escola CHECK (perfil = 'administrador' OR escola_id IS NOT NULL),
  CONSTRAINT ck_usuarios_aluno  CHECK ((perfil = 'aluno') = (aluno_id IS NOT NULL))
);

-- -----------------------------------------------------------------------------
-- turmas e horarios_turma
-- -----------------------------------------------------------------------------
CREATE TABLE turmas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID         NOT NULL REFERENCES escolas(id),
  nome          VARCHAR(100) NOT NULL,
  idade_minima  SMALLINT     NOT NULL CHECK (idade_minima >= 0),
  idade_maxima  SMALLINT     CHECK (idade_maxima IS NULL OR idade_maxima >= idade_minima),
  professor_id  UUID         REFERENCES usuarios(id),
  ativo         BOOLEAN      NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_turmas_id_escola UNIQUE (id, escola_id)
);

CREATE TABLE horarios_turma (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id      UUID        NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  dia_semana    SMALLINT    NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0 = domingo
  hora_inicio   TIME        NOT NULL,
  hora_fim      TIME        NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_horario_intervalo CHECK (hora_fim > hora_inicio)
);

-- -----------------------------------------------------------------------------
-- alunos
-- -----------------------------------------------------------------------------
CREATE TABLE alunos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       UUID         NOT NULL REFERENCES escolas(id),
  turma_id        UUID,
  nome            VARCHAR(150) NOT NULL,
  data_nascimento DATE,
  faixa_id        VARCHAR(20)  NOT NULL DEFAULT 'branca' REFERENCES faixas(id),
  telefone        VARCHAR(30)  NOT NULL DEFAULT '',
  responsavel     VARCHAR(150) NOT NULL DEFAULT '',
  observacoes     TEXT         NOT NULL DEFAULT '',
  data_ingresso   DATE         NOT NULL DEFAULT CURRENT_DATE,
  ativo           BOOLEAN      NOT NULL DEFAULT true,     -- "Excluir" = ativo := false
  criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_alunos_id_escola UNIQUE (id, escola_id),
  CONSTRAINT fk_alunos_turma FOREIGN KEY (turma_id, escola_id)
    REFERENCES turmas (id, escola_id)
);
-- Se a turma for removida, o aluno fica sem turma (turma_id NULL). Isso é tratado pelo backend.

ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id);

-- -----------------------------------------------------------------------------
-- frequencias
-- -----------------------------------------------------------------------------
CREATE TABLE frequencias (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID        NOT NULL REFERENCES escolas(id),
  aluno_id      UUID        NOT NULL,
  turma_id      UUID        NOT NULL,
  data          DATE        NOT NULL,
  presente      BOOLEAN     NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_frequencia_aluno_data UNIQUE (aluno_id, data),
  CONSTRAINT fk_frequencias_aluno FOREIGN KEY (aluno_id, escola_id) REFERENCES alunos (id, escola_id),
  CONSTRAINT fk_frequencias_turma FOREIGN KEY (turma_id, escola_id) REFERENCES turmas (id, escola_id)
);

-- -----------------------------------------------------------------------------
-- graduacoes
-- -----------------------------------------------------------------------------
CREATE TABLE graduacoes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         UUID        NOT NULL REFERENCES escolas(id),
  aluno_id          UUID        NOT NULL,
  faixa_anterior_id VARCHAR(20) NOT NULL REFERENCES faixas(id),
  nova_faixa_id     VARCHAR(20) NOT NULL REFERENCES faixas(id),
  data              DATE        NOT NULL,
  observacoes       TEXT        NOT NULL DEFAULT '',
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_graduacao_faixas CHECK (faixa_anterior_id <> nova_faixa_id),
  CONSTRAINT fk_graduacoes_aluno FOREIGN KEY (aluno_id, escola_id) REFERENCES alunos (id, escola_id)
);
-- Regra: ao inserir uma graduação, o backend atualiza alunos.faixa_id na mesma transação.

-- -----------------------------------------------------------------------------
-- categorias_curriculo e tecnicas
-- -----------------------------------------------------------------------------
CREATE TABLE categorias_curriculo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID         NOT NULL REFERENCES escolas(id),
  faixa_id      VARCHAR(20)  NOT NULL REFERENCES faixas(id),
  nome          VARCHAR(150) NOT NULL,
  descricao     TEXT         NOT NULL DEFAULT '',
  ordem         INTEGER      NOT NULL DEFAULT 1 CHECK (ordem >= 1),
  ativo         BOOLEAN      NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_categorias_id_escola UNIQUE (id, escola_id)
);

CREATE TABLE tecnicas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID         NOT NULL REFERENCES escolas(id),
  categoria_id  UUID         NOT NULL,
  nome          VARCHAR(150) NOT NULL,
  descricao     TEXT         NOT NULL DEFAULT '',
  ordem         INTEGER      NOT NULL DEFAULT 1 CHECK (ordem >= 1),
  ativo         BOOLEAN      NOT NULL DEFAULT true,      -- técnicas são desativadas, nunca apagadas
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_tecnicas_id_escola UNIQUE (id, escola_id),
  CONSTRAINT fk_tecnicas_categoria FOREIGN KEY (categoria_id, escola_id)
    REFERENCES categorias_curriculo (id, escola_id)
);

-- Impede cadastrar currículo em faixas cujo conteúdo não foi definido (Marrom e Preta).
CREATE OR REPLACE FUNCTION validar_faixa_com_conteudo() RETURNS trigger AS $$
BEGIN
  IF NOT (SELECT conteudo_definido FROM faixas WHERE id = NEW.faixa_id) THEN
    RAISE EXCEPTION 'O conteúdo da faixa % ainda não foi definido pela academia.', NEW.faixa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categorias_faixa_definida
  BEFORE INSERT OR UPDATE OF faixa_id ON categorias_curriculo
  FOR EACH ROW EXECUTE FUNCTION validar_faixa_com_conteudo();

-- -----------------------------------------------------------------------------
-- tecnicas_aluno (acompanhamento técnico)
-- -----------------------------------------------------------------------------
CREATE TABLE tecnicas_aluno (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID          NOT NULL REFERENCES escolas(id),
  aluno_id      UUID          NOT NULL,
  tecnica_id    UUID          NOT NULL,
  nivel         nivel_tecnica NOT NULL DEFAULT 'iniciante',
  observacoes   TEXT          NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT uq_tecnica_aluno UNIQUE (aluno_id, tecnica_id),
  CONSTRAINT fk_tecnicas_aluno_aluno   FOREIGN KEY (aluno_id, escola_id)   REFERENCES alunos (id, escola_id),
  CONSTRAINT fk_tecnicas_aluno_tecnica FOREIGN KEY (tecnica_id, escola_id) REFERENCES tecnicas (id, escola_id)
);

-- -----------------------------------------------------------------------------
-- criterios_avaliacao, avaliacoes e avaliacao_notas
-- -----------------------------------------------------------------------------
CREATE TABLE criterios_avaliacao (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID         NOT NULL REFERENCES escolas(id),
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT         NOT NULL DEFAULT '',
  ordem         INTEGER      NOT NULL DEFAULT 1,
  ativo         BOOLEAN      NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_criterios_id_escola UNIQUE (id, escola_id)
);

CREATE TABLE avaliacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID        NOT NULL REFERENCES escolas(id),
  aluno_id      UUID        NOT NULL,
  avaliador_id  UUID        REFERENCES usuarios(id),
  data          DATE        NOT NULL,
  observacoes   TEXT        NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_avaliacoes_id_escola UNIQUE (id, escola_id),
  CONSTRAINT fk_avaliacoes_aluno FOREIGN KEY (aluno_id, escola_id) REFERENCES alunos (id, escola_id)
);

-- Uma nota (1 a 5) por critério em cada avaliação.
CREATE TABLE avaliacao_notas (
  avaliacao_id  UUID        NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  criterio_id   UUID        NOT NULL REFERENCES criterios_avaliacao(id),
  nota          SMALLINT    NOT NULL CHECK (nota BETWEEN 1 AND 5),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (avaliacao_id, criterio_id)
);

-- -----------------------------------------------------------------------------
-- premiacoes e premiacoes_aluno
-- -----------------------------------------------------------------------------
CREATE TABLE premiacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID           NOT NULL REFERENCES escolas(id),
  nome          VARCHAR(120)   NOT NULL,
  descricao     TEXT           NOT NULL DEFAULT '',
  tipo          tipo_premiacao NOT NULL DEFAULT 'outro',
  ativo         BOOLEAN        NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT uq_premiacoes_id_escola UNIQUE (id, escola_id)
);

CREATE TABLE premiacoes_aluno (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     UUID        NOT NULL REFERENCES escolas(id),
  premiacao_id  UUID        NOT NULL,
  aluno_id      UUID        NOT NULL,
  data          DATE        NOT NULL,
  descricao     TEXT        NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_premiacoes_aluno_premiacao FOREIGN KEY (premiacao_id, escola_id) REFERENCES premiacoes (id, escola_id),
  CONSTRAINT fk_premiacoes_aluno_aluno     FOREIGN KEY (aluno_id, escola_id)     REFERENCES alunos (id, escola_id)
);

-- -----------------------------------------------------------------------------
-- Índices (consultas sempre filtradas por escola)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_usuarios_escola          ON usuarios (escola_id);
CREATE INDEX idx_turmas_escola            ON turmas (escola_id) WHERE ativo;
CREATE INDEX idx_horarios_turma           ON horarios_turma (turma_id);
CREATE INDEX idx_alunos_escola_ativo      ON alunos (escola_id, ativo);
CREATE INDEX idx_alunos_escola_turma      ON alunos (escola_id, turma_id);
CREATE INDEX idx_alunos_nome              ON alunos (escola_id, lower(nome));
CREATE INDEX idx_frequencias_escola_data  ON frequencias (escola_id, data);
CREATE INDEX idx_frequencias_turma_data   ON frequencias (turma_id, data);
CREATE INDEX idx_graduacoes_aluno         ON graduacoes (aluno_id, data DESC);
CREATE INDEX idx_graduacoes_escola_data   ON graduacoes (escola_id, data DESC);
CREATE INDEX idx_categorias_escola_faixa  ON categorias_curriculo (escola_id, faixa_id, ordem);
CREATE INDEX idx_tecnicas_categoria       ON tecnicas (categoria_id, ordem);
CREATE INDEX idx_tecnicas_aluno_aluno     ON tecnicas_aluno (aluno_id);
CREATE INDEX idx_avaliacoes_aluno         ON avaliacoes (aluno_id, data);
CREATE INDEX idx_premiacoes_aluno_escola  ON premiacoes_aluno (escola_id, data DESC);
CREATE INDEX idx_premiacoes_aluno_aluno   ON premiacoes_aluno (aluno_id);

-- -----------------------------------------------------------------------------
-- Gatilhos de atualizado_em
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  tabela TEXT;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'escolas', 'faixas', 'usuarios', 'turmas', 'horarios_turma', 'alunos',
    'frequencias', 'graduacoes', 'categorias_curriculo', 'tecnicas',
    'tecnicas_aluno', 'criterios_avaliacao', 'avaliacoes', 'avaliacao_notas',
    'premiacoes', 'premiacoes_aluno'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_atualizado_em BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em()', tabela);
  END LOOP;
END;
$$;
