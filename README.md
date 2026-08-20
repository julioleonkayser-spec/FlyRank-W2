# Task API — my first CRUD API

A small backend API that manages a to-do list: create, read, update, and delete tasks — the four CRUD operations. Built with **Node.js** and **Express**. Data is stored **in memory only** (a plain array in the code), so it resets every time the server restarts — there's no database yet, that's next week's lesson.

Interactive docs are available through **Swagger UI**, generated from a hand-written OpenAPI spec (`openapi.json`).

## How to run it

```bash
npm install
npm start
```

The server starts on **http://localhost:3000**. Visit `http://localhost:3000/docs` for interactive Swagger docs.

## Endpoints

| Method | Path | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/` | API description | 200 | — |
| GET | `/health` | Health check | 200 | — |
| GET | `/tasks` | List all tasks | 200 | — |
| GET | `/tasks/:id` | Get one task | 200 | 404 if id doesn't exist |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) | 201 | 400 if title missing/empty |
| PUT | `/tasks/:id` | Update a task's title and/or `done` | 200 | 400 invalid body, 404 unknown id |
| DELETE | `/tasks/:id` | Delete a task | 204 | 404 if id doesn't exist |

## Example: creating a task

```
curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
```

```
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40
ETag: W/"28-PpSBYV7i68cXyGc7AhjVpkZkY5Q"
Date: Thu, 20 Aug 2026 04:40:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Buy milk","done":false}
```

## Swagger UI

`/docs` lists all five endpoints and lets you run the full CRUD cycle with "Try it out" — no curl needed.

![Swagger UI screenshot](swagger-screenshot.png)

## The mortality experiment

Create a task, restart the server (`Ctrl+C` then `npm start` again), then `GET /tasks`. The task you added is gone — only the 3 seed tasks come back. Everything lives in a JavaScript array in `server.js`; when the process exits, that memory is freed and nothing is written to disk. This is exactly why Week 3 introduces a real database: anything worth keeping needs to live somewhere that survives the process ending.

## Project structure

```
server.js       # the whole API — routes, validation, in-memory data
openapi.json    # hand-written OpenAPI spec that powers Swagger UI at /docs
package.json
```

## Stages (git history)

Each stage was committed separately as it was built and tested:

1. Hello server
2. Root + health endpoints
3. Read endpoints (list, single, 404)
4. Create endpoint with validation
5. Update + delete endpoints (full CRUD)
6. Swagger UI at `/docs`
7. This README
