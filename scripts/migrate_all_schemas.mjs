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

async function migrateAll() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const schemas = [
      'supabase_schema.sql',
      'supabase_schema_extended.sql',
      'supabase_schema_final.sql',
      'supabase_schema_submissions.sql'
    ];

    for (const schemaFile of schemas) {
      console.log(`Executing ${schemaFile}...`);
      const schemaPath = path.resolve(__dirname, `../${schemaFile}`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log(`${schemaFile} executed successfully.`);
    }

    console.log('🎉 All schemas applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrateAll();
