const express = require("express");

const app = express();
const PORT = 3000;

// Stage 2: our "database" - just a list in memory, gone on restart
let tasks = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Finish assignment", done: false },
  { id: 3, title: "Walk the dog", done: true },
];
let nextId = 4;

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

// Stage 2: Read - list all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// Stage 2: Read - get a single task by id
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
