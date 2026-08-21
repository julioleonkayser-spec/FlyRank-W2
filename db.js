const Database = require("better-sqlite3");

// SQLite is just a file on disk - no separate server to install or run.
// This file is created automatically the first time the app runs.
const db = new Database("tasks.db");

// Stage 0: create the table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

// Stage 0: seed 3 example tasks, but only the very first time (empty table)
const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  insert.run("Buy groceries", 0);
  insert.run("Finish assignment", 0);
  insert.run("Walk the dog", 1);
}

module.exports = db;
