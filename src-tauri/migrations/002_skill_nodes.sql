CREATE TABLE IF NOT EXISTS skill_nodes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id       TEXT NOT NULL REFERENCES categories(id),
  name         TEXT NOT NULL,
  description  TEXT,
  req_xp       INTEGER NOT NULL,
  parent_id    INTEGER REFERENCES skill_nodes(id),
  unlocked_at  TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  key          TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  xp_bonus     INTEGER NOT NULL DEFAULT 0,
  unlocked_at  TEXT
);
