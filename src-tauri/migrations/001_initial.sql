CREATE TABLE IF NOT EXISTS character (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  name        TEXT NOT NULL DEFAULT 'Awanturnik',
  class       TEXT NOT NULL DEFAULT 'Awanturnik',
  total_xp    INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  element     TEXT NOT NULL,
  rune        TEXT NOT NULL,
  stat        TEXT NOT NULL,
  xp          INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  bucket       TEXT NOT NULL CHECK(bucket IN ('daily','weekly','epic')),
  cat_id       TEXT NOT NULL REFERENCES categories(id),
  xp_reward    INTEGER NOT NULL DEFAULT 50,
  rarity       TEXT NOT NULL CHECK(rarity IN ('common','rare','epic','legendary')) DEFAULT 'common',
  done         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id     INTEGER NOT NULL REFERENCES quests(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  xp_earned    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  cat_id       TEXT NOT NULL REFERENCES categories(id),
  xp_per_check INTEGER NOT NULL DEFAULT 15,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id    INTEGER NOT NULL REFERENCES habits(id),
  logged_date TEXT NOT NULL,
  logged_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(habit_id, logged_date)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  time        TEXT NOT NULL DEFAULT (datetime('now')),
  message     TEXT NOT NULL,
  xp          INTEGER,
  source      TEXT
);

INSERT OR IGNORE INTO character (id) VALUES (1);

INSERT OR IGNORE INTO categories (id, element, rune, stat) VALUES
  ('health',  'Ogień',    '火', 'STR'),
  ('finance', 'Ziemia',   '土', 'WIS'),
  ('habit',   'Woda',     '水', 'CON'),
  ('learn',   'Powietrze','風', 'INT'),
  ('work',    'Metal',    '金', 'DEX'),
  ('social',  'Duch',     '心', 'CHA');
