import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

export const initDb = async () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        gender TEXT,
        generation TEXT,
        personality_type TEXT,
        current_goal TEXT,
        mode TEXT,
        tariff TEXT DEFAULT 'FREE',
        wheel_scores TEXT,
        state TEXT DEFAULT 'START',
        language_code TEXT DEFAULT 'ru',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        role TEXT,
        content TEXT,
        summary TEXT,
        message_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY,
        user_a_id INTEGER REFERENCES users(id),
        user_b_id INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('SQLite Database initialized');
  } catch (err) {
    console.error('Error initializing SQLite database', err);
  }
};

export default db;
