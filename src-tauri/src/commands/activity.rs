use crate::db::DbState;
use crate::models::LogLine;
use tauri::State;

#[tauri::command]
pub fn get_activity_log(state: State<DbState>, limit: i64) -> Result<Vec<LogLine>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, time, message, xp, source FROM activity_log
             ORDER BY id DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![limit], |r| {
            Ok(LogLine {
                id: r.get(0)?,
                time: r.get(1)?,
                message: r.get(2)?,
                xp: r.get(3)?,
                source: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<_>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}
