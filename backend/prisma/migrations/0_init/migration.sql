-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "perfil_usuario" AS ENUM ('administrador', 'professor', 'aluno');

-- CreateEnum
CREATE TYPE "nivel_tecnica" AS ENUM ('iniciante', 'em_desenvolvimento', 'domina');

-- CreateEnum
CREATE TYPE "tipo_premiacao" AS ENUM ('destaque_mes', 'frequencia', 'campeonato', 'evolucao', 'outro');

-- CreateTable
CREATE TABLE "escolas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(150) NOT NULL,
    "cidade" VARCHAR(120) NOT NULL DEFAULT '',
    "endereco" VARCHAR(200) NOT NULL DEFAULT '',
    "telefone" VARCHAR(30) NOT NULL DEFAULT '',
    "responsavel" VARCHAR(150) NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas" (
    "id" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(40) NOT NULL,
    "ordem" SMALLINT NOT NULL,
    "cor" CHAR(7) NOT NULL,
    "cor_texto" CHAR(7) NOT NULL,
    "conteudo_definido" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senha_hash" VARCHAR(255),
    "perfil" "perfil_usuario" NOT NULL,
    "aluno_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "idade_minima" SMALLINT NOT NULL,
    "idade_maxima" SMALLINT,
    "professor_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_turma" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "turma_id" UUID NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fim" TIME(6) NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "turma_id" UUID,
    "nome" VARCHAR(150) NOT NULL,
    "data_nascimento" DATE,
    "faixa_id" VARCHAR(20) NOT NULL DEFAULT 'branca',
    "telefone" VARCHAR(30) NOT NULL DEFAULT '',
    "responsavel" VARCHAR(150) NOT NULL DEFAULT '',
    "observacoes" TEXT NOT NULL DEFAULT '',
    "data_ingresso" DATE NOT NULL DEFAULT CURRENT_DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequencias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "faixa_anterior_id" VARCHAR(20) NOT NULL,
    "nova_faixa_id" VARCHAR(20) NOT NULL,
    "data" DATE NOT NULL,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graduacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_curriculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "faixa_id" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_curriculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecnicas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecnicas_aluno" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "tecnica_id" UUID NOT NULL,
    "nivel" "nivel_tecnica" NOT NULL DEFAULT 'iniciante',
    "observacoes" TEXT NOT NULL DEFAULT '',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tecnicas_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios_avaliacao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criterios_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "avaliador_id" UUID,
    "data" DATE NOT NULL,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao_notas" (
    "avaliacao_id" UUID NOT NULL,
    "criterio_id" UUID NOT NULL,
    "nota" SMALLINT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_notas_pkey" PRIMARY KEY ("avaliacao_id","criterio_id")
);

-- CreateTable
CREATE TABLE "premiacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "tipo" "tipo_premiacao" NOT NULL DEFAULT 'outro',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premiacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premiacoes_aluno" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "escola_id" UUID NOT NULL,
    "premiacao_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premiacoes_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faixas_nome_key" ON "faixas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "faixas_ordem_key" ON "faixas"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_email" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_escola" ON "usuarios"("escola_id");

-- CreateIndex
CREATE INDEX "idx_turmas_escola" ON "turmas"("escola_id") WHERE (ativo);

-- CreateIndex
CREATE UNIQUE INDEX "uq_turmas_id_escola" ON "turmas"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_horarios_turma" ON "horarios_turma"("turma_id");

-- CreateIndex
CREATE INDEX "idx_alunos_escola_ativo" ON "alunos"("escola_id", "ativo");

-- CreateIndex
CREATE INDEX "idx_alunos_escola_turma" ON "alunos"("escola_id", "turma_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_alunos_id_escola" ON "alunos"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_frequencias_escola_data" ON "frequencias"("escola_id", "data");

-- CreateIndex
CREATE INDEX "idx_frequencias_turma_data" ON "frequencias"("turma_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "uq_frequencia_aluno_data" ON "frequencias"("aluno_id", "data");

-- CreateIndex
CREATE INDEX "idx_graduacoes_aluno" ON "graduacoes"("aluno_id", "data" DESC);

-- CreateIndex
CREATE INDEX "idx_graduacoes_escola_data" ON "graduacoes"("escola_id", "data" DESC);

-- CreateIndex
CREATE INDEX "idx_categorias_escola_faixa" ON "categorias_curriculo"("escola_id", "faixa_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categorias_id_escola" ON "categorias_curriculo"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_tecnicas_categoria" ON "tecnicas"("categoria_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tecnicas_id_escola" ON "tecnicas"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_tecnicas_aluno_aluno" ON "tecnicas_aluno"("aluno_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tecnica_aluno" ON "tecnicas_aluno"("aluno_id", "tecnica_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_criterios_id_escola" ON "criterios_avaliacao"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_aluno" ON "avaliacoes"("aluno_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "uq_avaliacoes_id_escola" ON "avaliacoes"("id", "escola_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_premiacoes_id_escola" ON "premiacoes"("id", "escola_id");

-- CreateIndex
CREATE INDEX "idx_premiacoes_aluno_aluno" ON "premiacoes_aluno"("aluno_id");

-- CreateIndex
CREATE INDEX "idx_premiacoes_aluno_escola" ON "premiacoes_aluno"("escola_id", "data" DESC);

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuarios_aluno" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "horarios_turma" ADD CONSTRAINT "horarios_turma_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_faixa_id_fkey" FOREIGN KEY ("faixa_id") REFERENCES "faixas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "fk_alunos_turma" FOREIGN KEY ("turma_id", "escola_id") REFERENCES "turmas"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "fk_frequencias_aluno" FOREIGN KEY ("aluno_id", "escola_id") REFERENCES "alunos"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "fk_frequencias_turma" FOREIGN KEY ("turma_id", "escola_id") REFERENCES "turmas"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "graduacoes" ADD CONSTRAINT "graduacoes_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "graduacoes" ADD CONSTRAINT "fk_graduacoes_aluno" FOREIGN KEY ("aluno_id", "escola_id") REFERENCES "alunos"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "graduacoes" ADD CONSTRAINT "graduacoes_faixa_anterior_id_fkey" FOREIGN KEY ("faixa_anterior_id") REFERENCES "faixas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "graduacoes" ADD CONSTRAINT "graduacoes_nova_faixa_id_fkey" FOREIGN KEY ("nova_faixa_id") REFERENCES "faixas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categorias_curriculo" ADD CONSTRAINT "categorias_curriculo_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categorias_curriculo" ADD CONSTRAINT "categorias_curriculo_faixa_id_fkey" FOREIGN KEY ("faixa_id") REFERENCES "faixas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnicas" ADD CONSTRAINT "tecnicas_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnicas" ADD CONSTRAINT "fk_tecnicas_categoria" FOREIGN KEY ("categoria_id", "escola_id") REFERENCES "categorias_curriculo"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnicas_aluno" ADD CONSTRAINT "tecnicas_aluno_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnicas_aluno" ADD CONSTRAINT "fk_tecnicas_aluno_aluno" FOREIGN KEY ("aluno_id", "escola_id") REFERENCES "alunos"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnicas_aluno" ADD CONSTRAINT "fk_tecnicas_aluno_tecnica" FOREIGN KEY ("tecnica_id", "escola_id") REFERENCES "tecnicas"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "criterios_avaliacao" ADD CONSTRAINT "criterios_avaliacao_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "fk_avaliacoes_aluno" FOREIGN KEY ("aluno_id", "escola_id") REFERENCES "alunos"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacao_notas" ADD CONSTRAINT "avaliacao_notas_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacao_notas" ADD CONSTRAINT "avaliacao_notas_criterio_id_fkey" FOREIGN KEY ("criterio_id") REFERENCES "criterios_avaliacao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "premiacoes" ADD CONSTRAINT "premiacoes_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "premiacoes_aluno" ADD CONSTRAINT "premiacoes_aluno_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escolas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "premiacoes_aluno" ADD CONSTRAINT "fk_premiacoes_aluno_premiacao" FOREIGN KEY ("premiacao_id", "escola_id") REFERENCES "premiacoes"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "premiacoes_aluno" ADD CONSTRAINT "fk_premiacoes_aluno_aluno" FOREIGN KEY ("aluno_id", "escola_id") REFERENCES "alunos"("id", "escola_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- =============================================================================
-- Escrito à mão: o que o Prisma não representa no schema.prisma
-- =============================================================================

-- Extensão usada pelo seed de demonstração (crypt/gen_salt para os hashes bcrypt).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CHECKs -----------------------------------------------------------------------
ALTER TABLE "faixas"
  ADD CONSTRAINT "faixas_ordem_check" CHECK (ordem BETWEEN 1 AND 20);

ALTER TABLE "usuarios"
  ADD CONSTRAINT "ck_usuarios_escola" CHECK (perfil = 'administrador' OR escola_id IS NOT NULL),
  ADD CONSTRAINT "ck_usuarios_aluno"  CHECK ((perfil = 'aluno') = (aluno_id IS NOT NULL));

ALTER TABLE "turmas"
  ADD CONSTRAINT "turmas_idade_minima_check" CHECK (idade_minima >= 0),
  ADD CONSTRAINT "turmas_check" CHECK (idade_maxima IS NULL OR idade_maxima >= idade_minima);

ALTER TABLE "horarios_turma"
  ADD CONSTRAINT "horarios_turma_dia_semana_check" CHECK (dia_semana BETWEEN 0 AND 6), -- 0 = domingo
  ADD CONSTRAINT "ck_horario_intervalo" CHECK (hora_fim > hora_inicio);

ALTER TABLE "graduacoes"
  ADD CONSTRAINT "ck_graduacao_faixas" CHECK (faixa_anterior_id <> nova_faixa_id);

ALTER TABLE "categorias_curriculo"
  ADD CONSTRAINT "categorias_curriculo_ordem_check" CHECK (ordem >= 1);

ALTER TABLE "tecnicas"
  ADD CONSTRAINT "tecnicas_ordem_check" CHECK (ordem >= 1);

ALTER TABLE "avaliacao_notas"
  ADD CONSTRAINT "avaliacao_notas_nota_check" CHECK (nota BETWEEN 1 AND 5);

-- Índice por expressão (busca de alunos por nome) ------------------------------
CREATE INDEX "idx_alunos_nome" ON "alunos" (escola_id, lower(nome));

-- Gatilho genérico de atualizado_em -------------------------------------------
CREATE OR REPLACE FUNCTION definir_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
