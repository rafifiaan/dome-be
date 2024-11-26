// src/db/connection.js
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Kysely, PostgresDialect } from 'kysely';
import * as schema from './dbSchema';
import { users } from './dbSchemaKysely';

// Drizzle ORM Configuration
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const drizzleDb = drizzle(pool, { schema });

// Kysely Configuration
export const kyselyDb = new Kysely({
  dialect: new PostgresDialect({
    pool,
  }),
  schema: { users },
});
