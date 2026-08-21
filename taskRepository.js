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

module.exports = { listTasks, getTask };
