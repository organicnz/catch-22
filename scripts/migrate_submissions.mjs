import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Using the connection string from migrate.mjs
const connectionString = 'postgresql://postgres.wcoaqlglwxwceqktpckt:[REDACTED_DB_PW]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const schemaPath = path.resolve(__dirname, '../supabase_schema_submissions.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing submissions schema...');
    await client.query(schemaSql);
    console.log('Submissions schema executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
