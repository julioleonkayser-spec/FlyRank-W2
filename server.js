const express = require("express");

const app = express();
const PORT = 3000;

// Lets Express read a JSON body and turn it into req.body
app.use(express.json());

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

// Stage 3: Create - add a new task
app.post("/tasks", (req, res) => {
  const { title } = req.body ?? {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);

  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
