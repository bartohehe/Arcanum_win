use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn open_and_migrate(app_data_dir: &std::path::Path) -> Result<Connection> {
    let db_path = app_data_dir.join("arcanum.db");
    let conn = Connection::open(db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    let version: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;

    if version < 1 {
        let sql = format!(
            "BEGIN;\n{}\nCOMMIT;",
            include_str!("../migrations/001_initial.sql")
        );
        conn.execute_batch(&sql)?;
        conn.execute_batch("PRAGMA user_version = 1;")?;
    }
    if version < 2 {
        let sql = format!(
            "BEGIN;\n{}\nCOMMIT;",
            include_str!("../migrations/002_skill_nodes.sql")
        );
        conn.execute_batch(&sql)?;
        conn.execute_batch("PRAGMA user_version = 2;")?;
    }

    Ok(conn)
}

pub fn insert_activity(
    conn: &Connection,
    message: &str,
    xp: Option<i64>,
    source: &str,
) -> Result<()> {
    conn.execute(
        "INSERT INTO activity_log (message, xp, source) VALUES (?1, ?2, ?3)",
        rusqlite::params![message, xp, source],
    )?;
    conn.execute(
        "DELETE FROM activity_log WHERE id NOT IN (
           SELECT id FROM activity_log ORDER BY id DESC LIMIT 200
         )",
        [],
    )?;
    Ok(())
}
