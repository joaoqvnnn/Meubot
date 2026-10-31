const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const file of files) {
      console.log('[migrate] aplicando', file);
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    }
    await client.query('COMMIT');
    console.log('[migrate] concluído');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[migrate] erro', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
migrate();
