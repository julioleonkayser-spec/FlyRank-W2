const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const db = require("./db");

const app = express();
const PORT = 3000;

// Lets Express read a JSON body and turn it into req.body
app.use(express.json());

// SQLite stores "done" as 0/1 - convert a database row to the API's shape
function toApiTask(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

// Stage 1: front door - describes the API
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

// Stage 1: health check - real companies use this to check a server is alive
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Stage 1: Read - list all tasks, straight from the database
app.get("/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks").all();
  res.json(rows.map(toApiTask));
});

// Stage 1: Read - get a single task by id from the database
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!row) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(toApiTask(row));
});

// Stage 2: Create - insert a new row into the database
app.post("/tasks", (req, res) => {
  const { title } = req.body ?? {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const info = db
  .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
  .run(title.trim(), 0);

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);

  res.status(201).json(toApiTask(row));
});

// Stage 3: Update - replace a task's title and/or done with an UPDATE query
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

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

  const newTitle = titleProvided ? title.trim() : existing.title;
  const newDone = doneProvided ? (done ? 1 : 0) : existing.done;

  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, id);

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(toApiTask(updated));
});

// Stage 3: Delete - remove a row with a DELETE query
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.status(204).send();
});

// Stage 5: Swagger UI - interactive docs at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
