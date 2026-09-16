CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS academias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  papel VARCHAR(30) NOT NULL CHECK (papel IN ('admin','professor')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  nome VARCHAR(100) NOT NULL,
  horario VARCHAR(80) NOT NULL,
  faixa_etaria VARCHAR(80),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE,
  faixa_atual VARCHAR(40) NOT NULL DEFAULT 'Branca',
  telefone VARCHAR(30),
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS frequencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(aluno_id, data)
);
CREATE TABLE IF NOT EXISTS graduacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  faixa_anterior VARCHAR(40),
  nova_faixa VARCHAR(40) NOT NULL,
  data_graduacao DATE NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS acompanhamento_tecnico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  tecnica VARCHAR(150) NOT NULL,
  nivel VARCHAR(30) NOT NULL CHECK(nivel IN ('A desenvolver','Em evolução','Consolidada')),
  observacao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS curriculo_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id),
  faixa VARCHAR(40) NOT NULL,
  kyu_dan VARCHAR(30),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_por UUID REFERENCES usuarios(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS curriculo_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES curriculo_categorias(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_curriculo_cat_academia_faixa ON curriculo_categorias(academia_id, faixa, ordem);
CREATE INDEX IF NOT EXISTS idx_curriculo_item_categoria ON curriculo_itens(categoria_id, ordem);

INSERT INTO academias(id,nome) VALUES ('00000000-0000-0000-0000-000000000001','Academia Hajime') ON CONFLICT DO NOTHING;
INSERT INTO usuarios(id,academia_id,nome,email,papel) VALUES ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','Sensei Ana','sensei@hajime.local','admin') ON CONFLICT DO NOTHING;
INSERT INTO turmas(id,academia_id,nome,horario,faixa_etaria) VALUES
('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000001','Infantil','Terça e Quinta — 18:00','6 a 12 anos'),
('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000001','Juvenil','Terça e Quinta — 19:00','13 a 17 anos'),
('00000000-0000-0000-0000-000000000203','00000000-0000-0000-0000-000000000001','Adulto','Segunda e Quarta — 20:00','18+ anos') ON CONFLICT DO NOTHING;

INSERT INTO curriculo_categorias(academia_id,faixa,kyu_dan,nome,descricao,ordem,criado_por)
SELECT '00000000-0000-0000-0000-000000000001', x.faixa, x.kyu, x.nome, 'Categoria inicial editável pela academia.', x.ordem, '00000000-0000-0000-0000-000000000101'
FROM (VALUES
('Azul','6º Kyu','Nage Waza',1),('Azul','6º Kyu','Ashi Waza',2),
('Amarela','5º Kyu','Nage Waza',1),('Laranja','4º Kyu','Nage Waza',1),
('Verde','3º Kyu','Nage Waza',1),('Roxa','2º Kyu','Nage Waza',1)
) x(faixa,kyu,nome,ordem)
WHERE NOT EXISTS (SELECT 1 FROM curriculo_categorias c WHERE c.academia_id='00000000-0000-0000-0000-000000000001' AND c.faixa=x.faixa AND c.nome=x.nome);
