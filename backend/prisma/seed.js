/*
 * Carrega os dados de demonstração (database/seed.sql) se o banco estiver vazio.
 * Executado por `npm run db:seed` (prisma db seed) e pelo serviço `migrate`
 * do database/docker-compose.yml. Se já houver faixas, não faz nada.
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const arquivo = new URL('../../database/seed.sql', import.meta.url);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query('SELECT EXISTS (SELECT 1 FROM faixas) AS populado');

  if (rows[0].populado) {
    console.log('Banco já populado, seed ignorado.');
  } else {
    // O arquivo tem seu próprio BEGIN/COMMIT.
    await client.query(await readFile(arquivo, 'utf8'));
    console.log('Seed carregado (database/seed.sql).');
  }
} finally {
  await client.end();
}
