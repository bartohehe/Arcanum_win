use crate::db::DbState;
use crate::models::{Category, CategoryRow, Character};
use crate::xp::build_character;
use tauri::State;

fn load_character(conn: &rusqlite::Connection) -> rusqlite::Result<Character> {
    let (id, name, total_xp): (i64, String, i64) = conn.query_row(
        "SELECT id, name, total_xp FROM character WHERE id = 1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, element, rune, stat, xp, level FROM categories ORDER BY rowid",
    )?;
    let cat_rows: Vec<CategoryRow> = stmt
        .query_map([], |r| {
            Ok(CategoryRow {
                id: r.get(0)?,
                element: r.get(1)?,
                rune: r.get(2)?,
                stat: r.get(3)?,
                xp: r.get(4)?,
                level: r.get(5)?,
            })
        })?
        .collect::<rusqlite::Result<_>>()?;

    Ok(build_character(id, name, total_xp, cat_rows))
}

pub fn sync_character_level(conn: &rusqlite::Connection) -> rusqlite::Result<Character> {
    let char = load_character(conn)?;
    conn.execute(
        "UPDATE character SET level = ?1, class = ?2, updated_at = datetime('now') WHERE id = 1",
        rusqlite::params![char.level, char.class],
    )?;
    Ok(char)
}

#[tauri::command]
pub fn get_character(state: State<DbState>) -> Result<Character, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    sync_character_level(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_name(state: State<DbState>, name: String) -> Result<Character, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE character SET name = ?1, updated_at = datetime('now') WHERE id = 1",
        rusqlite::params![name],
    )
    .map_err(|e| e.to_string())?;
    sync_character_level(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_data(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute_batch(
        "DELETE FROM completions;
         DELETE FROM habit_logs;
         DELETE FROM quests;
         DELETE FROM habits;
         DELETE FROM activity_log;
         UPDATE categories SET xp = 0, level = 1;
         UPDATE character SET total_xp = 0, level = 1, class = 'Awanturnik',
           updated_at = datetime('now') WHERE id = 1;",
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn export_json(state: State<DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let char = sync_character_level(&conn).map_err(|e| e.to_string())?;
    let export = serde_json::json!({
        "character": char,
        "exported_at": chrono::Local::now().to_rfc3339()
    });
    Ok(export.to_string())
}
