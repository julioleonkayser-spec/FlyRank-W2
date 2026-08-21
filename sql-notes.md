# Stage 4 — exploring the database directly

I opened `tasks.db` outside the app (once with `sqlite-web` as a GUI viewer, once with a raw script standing in for a SQL console) and ran the queries from the assignment directly against the file. The API server was running the whole time and was **not restarted** between any of these steps.

## Starting state — `GET /tasks` via the API

```json
[
  {"id":1,"title":"Buy groceries","done":false},
  {"id":2,"title":"Finish assignment","done":false},
  {"id":3,"title":"Walk the dog","done":true}
]
```

## Queries run directly against `tasks.db`

**List every task**

```sql
SELECT * FROM tasks;
```

```
[
  { id: 1, title: 'Buy groceries', done: 0 },
  { id: 2, title: 'Finish assignment', done: 0 },
  { id: 3, title: 'Walk the dog', done: 1 }
]
```

**Show only completed tasks**

```sql
SELECT * FROM tasks WHERE done = 1;
```

```
[ { id: 3, title: 'Walk the dog', done: 1 } ]
```

**Count all tasks**

```sql
SELECT COUNT(*) FROM tasks;
```

```
{ 'COUNT(*)': 3 }
```

**Mark every task as completed**

```sql
UPDATE tasks SET done = 1;
```

```
rows changed: 3
```

Immediately after running this — without touching the server or the code — I called the live API again:

```
GET /tasks
[{"id":1,"title":"Buy groceries","done":true},{"id":2,"title":"Finish assignment","done":true},{"id":3,"title":"Walk the dog","done":true}]
```

All three tasks flipped to `done: true` in the API response. The server never re-read a file or reran any setup code — it queries the database fresh on every request, so a change made completely outside the app shows up the moment you ask for it again.

**Delete all completed tasks**

```sql
DELETE FROM tasks WHERE done = 1;
```

```
rows deleted: 3
```

```
GET /tasks
[]
```

Since the previous `UPDATE` had marked everything as done, this deleted every row — a good reminder that `UPDATE`/`DELETE` without a narrow enough `WHERE` clause affects every matching row, not just the one you're thinking about.

## Takeaway

The API has no idea whether its data was changed by a `POST` request or by someone editing the database file directly. That's the whole point of Assignment 2: the database is the single source of truth, and the API is just a window into it.
