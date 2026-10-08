import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Carrega database/seed.sql (gerado por frontend/scripts/gerar-seed.ts) se o banco estiver vazio
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
});
