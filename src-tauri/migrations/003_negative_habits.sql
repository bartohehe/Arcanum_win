CREATE TABLE IF NOT EXISTS negative_habits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  cat_id       TEXT NOT NULL REFERENCES categories(id),
  xp_block     INTEGER NOT NULL DEFAULT 15,
  penalty_xp   INTEGER NOT NULL DEFAULT 30,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS negative_habit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id    INTEGER NOT NULL REFERENCES negative_habits(id),
  logged_date TEXT NOT NULL,
  logged_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(habit_id, logged_date)
);
