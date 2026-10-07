DROP TABLE entries;
--> statement-breakpoint
CREATE TABLE shots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club TEXT NOT NULL,
  distance INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'straight', 'right')),
  created_at INTEGER NOT NULL
);