import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE_PATH = process.env.DATABASE_FILE || path.resolve(process.cwd(), 'data', 'inkcheck.db');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(buffer);
    } catch (e) {
      console.warn('Could not read existing database file, creating a fresh one:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database:', err);
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params as SqlValue[]);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const db = await getDb();
  if (params.length === 0) {
    db.run(sql);
  } else {
    const stmt = db.prepare(sql);
    try {
      stmt.run(params as SqlValue[]);
    } finally {
      stmt.free();
    }
  }
  const changesRes = db.exec('SELECT changes() as c;');
  const changes = (changesRes[0]?.values[0]?.[0] as number) || 0;
  saveDb();
  return { changes };
}
