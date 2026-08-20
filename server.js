const express = require("express");

const app = express();
const PORT = 3000;

// Stage 0: Hello, server
app.get("/", (req, res) => {
  res.send("Hello, this is the Task API server!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
