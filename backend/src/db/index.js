import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

/*
 * Colunas DATE chegam como texto 'AAAA-MM-DD'. Sem isso o driver converte
 * para Date do JavaScript e o fuso horário pode trocar o dia.
 */
types.setTypeParser(1082, (valor) => valor);

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://hajimetech:hajimetech@localhost:5433/hajimetech',

  // Máximo de conexões simultâneas com o banco (padrão do driver: 10).
  max: Number(process.env.DB_POOL_MAX) || 10,

  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
});

/*
 * Executa `fn` dentro de uma transação. Se `fn` lançar erro, tudo é desfeito.
 * `fn` recebe o client da conexão; use `client.query` dentro dela.
 */
export async function transacao(fn) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
