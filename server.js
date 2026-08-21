// Loads DATABASE_URL from .env when running locally. Inside Docker the value
// comes from compose.yaml instead, and dotenv leaves it alone.
require("dotenv").config({ quiet: true });

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const { pool, initDb } = require("./db");
const tasks = require("./taskRepository");

const app = express();
const PORT = process.env.PORT || 3000;

// Lets Express read a JSON body and turn it into req.body
app.use(express.json());

// Front door - describes the API
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

// Health check - also asks the database a trivial question, so this endpoint
// says "ok" only when the API AND its database are actually reachable.
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// Read - list all tasks
app.get("/tasks", async (req, res) => {
  res.json(await tasks.listTasks());
});

// Read - get a single task by id
app.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const task = await tasks.getTask(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// Create - add a new task
app.post("/tasks", async (req, res) => {
  const { title } = req.body ?? {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title.trim(), false]
  );

  res.status(201).json(rows[0]);
});

// Update - change a task's title and/or done flag
app.put("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body ?? {};

  const titleProvided = title !== undefined;
  const doneProvided = done !== undefined;

  if (!titleProvided && !doneProvided) {
    return res.status(400).json({ error: "provide at least title or done to update" });
  }
  if (titleProvided && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }
  if (doneProvided && typeof done !== "boolean") {
    return res.status(400).json({ error: "done must be true or false" });
  }

  const { rows } = await pool.query(
    `UPDATE tasks
        SET title = COALESCE($1, title),
            done  = COALESCE($2, done)
      WHERE id = $3
      RETURNING *`,
    [titleProvided ? title.trim() : null, doneProvided ? done : null, id]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(rows[0]);
});

// Delete - remove a task
app.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.status(204).send();
});

// Swagger UI - interactive docs at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Anything a route throws lands here, as JSON rather than an HTML stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Create the table and seed it before accepting any traffic.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not start: database is unreachable.");
    console.error(err.message);
    process.exit(1);
  });
