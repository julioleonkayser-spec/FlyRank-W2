const { pool } = require("./db");

// This module is the ONLY place that knows tasks live in Postgres.
// server.js calls these functions and never writes a line of SQL itself.
// Swapping to another database again would mean rewriting this file alone.
//
// Every query uses $1-style placeholders (parameterized queries): values are
// sent to Postgres separately from the SQL text, so user input can never be
// executed as SQL.

async function listTasks() {
  const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
  return rows;
}

async function getTask(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0] ?? null;
}

async function createTask(title) {
  // RETURNING * hands back the row Postgres just wrote - including the id it
  // assigned - so we don't need a second query to read it.
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title, false]
  );
  return rows[0];
}

async function updateTask(id, { title, done }) {
  // COALESCE keeps the existing value when a field wasn't sent in the body,
  // so PUT can change the title, the done flag, or both.
  const { rows } = await pool.query(
    `UPDATE tasks
        SET title = COALESCE($1, title),
            done  = COALESCE($2, done)
      WHERE id = $3
      RETURNING *`,
    [title ?? null, done ?? null, id]
  );
  return rows[0] ?? null;
}

async function deleteTask(id) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  // rowCount is 0 when no row matched - that's how the route knows to 404.
  return result.rowCount > 0;
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
