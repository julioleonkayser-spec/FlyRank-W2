const { Pool } = require("pg");

// The connection string never lives in the code. It comes from the environment:
// from .env when running locally, from compose.yaml when running in Docker.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env (cp .env.example .env) and try again."
  );
  process.exit(1);
}

// A pool keeps a small set of reusable connections instead of opening a new
// one per request. Every query in taskRepository.js goes through this pool.
const pool = new Pool({ connectionString });

// When the whole stack starts at once, Postgres may still be booting while the
// API is already up. Retry briefly instead of crashing on the first attempt.
async function waitForDatabase(attempts = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.log(`Database not ready yet (attempt ${attempt}/${attempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Create the table if it is missing, then seed 3 example tasks - but only the
// very first time, when the table is still empty.
async function initDb() {
  await waitForDatabase();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const client = await pool.connect();
  try {
    // A transaction so seeding is all-or-nothing: either all three example
    // tasks land, or none do. No half-seeded database.
    await client.query("BEGIN");

    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM tasks");

    if (rows[0].count === 0) {
      await client.query(
        "INSERT INTO tasks (title, done) VALUES ($1, $2), ($3, $4), ($5, $6)",
        ["Buy groceries", false, "Finish assignment", false, "Walk the dog", true]
      );
      console.log("Seeded 3 example tasks (first run).");
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
