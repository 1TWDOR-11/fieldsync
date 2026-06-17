const { createClient } = require('@libsql/client');
const path = require('path');

const db = createClient({
  url: process.env.DATABASE_URL || `file:${path.join(__dirname, '..', 'fieldsync.db')}`
});

async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'field',
      lead_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_departments (
      user_id INTEGER REFERENCES users(id),
      department_id INTEGER REFERENCES departments(id),
      PRIMARY KEY (user_id, department_id)
    );
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#1A6FFF',
      lead_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      segment TEXT DEFAULT 'Outros',
      status TEXT NOT NULL DEFAULT 'prospect',
      needs TEXT,
      service TEXT,
      responsible_id INTEGER REFERENCES users(id),
      attachments TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER REFERENCES clients(id),
      team TEXT NOT NULL DEFAULT 'operational',
      status TEXT NOT NULL DEFAULT 'planning',
      start_date TEXT,
      end_date TEXT,
      description TEXT,
      progress INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      objective TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      project_id INTEGER REFERENCES projects(id),
      location TEXT,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS occurrences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES tasks(id),
      user_id INTEGER REFERENCES users(id),
      description TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      assigned_to INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS occurrence_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      occurrence_id INTEGER REFERENCES occurrences(id),
      user_id INTEGER REFERENCES users(id),
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { db, initDb };
