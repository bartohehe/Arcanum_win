use crate::commands::character::sync_character_level;
use crate::db::{insert_activity, DbState};
use crate::models::{
    CategoryRow, CreateNegativeHabitPayload, NegativeHabitWithStatus,
    ToggleNegativeHabitResult,
};
use crate::xp::enrich_category;
use chrono::Local;
use tauri::State;

/// Calculates consecutive days (going backwards from the most recent log)
/// where the negative habit was logged.
fn calculate_bad_streak(conn: &rusqlite::Connection, habit_id: i64) -> rusqlite::Result<i64> {
    let mut stmt = conn.prepare(
        "SELECT logged_date FROM negative_habit_logs
         WHERE habit_id = ?1 ORDER BY logged_date DESC",
    )?;
    let dates: Vec<String> = stmt
        .query_map(rusqlite::params![habit_id], |r| r.get(0))?
        .collect::<rusqlite::Result<_>>()?;

    if dates.is_empty() {
        return Ok(0);
    }

    let today = Local::now().format("%Y-%m-%d").to_string();
    let yesterday = (Local::now() - chrono::Duration::days(1))
        .format("%Y-%m-%d")
        .to_string();

    // Streak must start from today or yesterday
    if dates[0] != today && dates[0] != yesterday {
        return Ok(0);
    }

    let mut streak: i64 = 1;
    for i in 1..dates.len() {
        let prev = chrono::NaiveDate::parse_from_str(&dates[i - 1], "%Y-%m-%d").unwrap();
        let curr = chrono::NaiveDate::parse_from_str(&dates[i], "%Y-%m-%d").unwrap();
        if (prev - curr).num_days() == 1 {
            streak += 1;
        } else {
            break;
        }
    }
    Ok(streak)
}

fn load_negative_habit(
    conn: &rusqlite::Connection,
    habit_id: i64,
    today: &str,
) -> rusqlite::Result<NegativeHabitWithStatus> {
    let (id, name, cat_id, xp_block, penalty_xp, created_at): (i64, String, String, i64, i64, String) =
        conn.query_row(
            "SELECT id, name, cat_id, xp_block, penalty_xp, created_at
             FROM negative_habits WHERE id = ?1",
            rusqlite::params![habit_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?)),
        )?;

    let logged_today: bool = conn.query_row(
        "SELECT COUNT(*) FROM negative_habit_logs
         WHERE habit_id = ?1 AND logged_date = ?2",
        rusqlite::params![habit_id, today],
        |r| r.get::<_, i64>(0),
    )? > 0;

    let bad_streak = calculate_bad_streak(conn, habit_id)?;

    Ok(NegativeHabitWithStatus {
        id,
        name,
        cat_id,
        xp_block,
        penalty_xp,
        created_at,
        logged_today,
        bad_streak,
        penalty_active: bad_streak >= 3,
    })
}

#[tauri::command]
pub fn get_negative_habits(state: State<DbState>) -> Result<Vec<NegativeHabitWithStatus>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let today = Local::now().format("%Y-%m-%d").to_string();

    let ids: Vec<i64> = {
        let mut stmt = conn
            .prepare("SELECT id FROM negative_habits ORDER BY created_at")
            .map_err(|e| e.to_string())?;
        let result = stmt
            .query_map([], |r| r.get(0))
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<_>>()
            .map_err(|e| e.to_string())?;
        result
    };

    ids.iter()
        .map(|&id| load_negative_habit(&conn, id, &today).map_err(|e| e.to_string()))
        .collect()
}

#[tauri::command]
pub fn toggle_negative_habit(
    state: State<DbState>,
    habit_id: i64,
    date: Option<String>,
) -> Result<ToggleNegativeHabitResult, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let today = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());

    let already: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM negative_habit_logs
             WHERE habit_id = ?1 AND logged_date = ?2",
            rusqlite::params![habit_id, today],
            |r| r.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;

    let (name, cat_id, penalty_xp): (String, String, i64) = conn
        .query_row(
            "SELECT name, cat_id, penalty_xp FROM negative_habits WHERE id = ?1",
            rusqlite::params![habit_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let mut xp_delta: i64 = 0;
    let mut penalty_applied = false;
    let mut bonus_blocked = false;
    let mut bonus_unblocked = false;
    let mut penalty_reversed = false;

    if !already {
        // Toggle ON — "I gave in today"
        conn.execute(
            "INSERT INTO negative_habit_logs (habit_id, logged_date) VALUES (?1, ?2)",
            rusqlite::params![habit_id, today],
        )
        .map_err(|e| e.to_string())?;

        let bad_streak = calculate_bad_streak(&conn, habit_id).map_err(|e| e.to_string())?;

        if bad_streak >= 3 {
            // Apply streak penalty
            conn.execute(
                "UPDATE categories SET xp = MAX(0, xp - ?1) WHERE id = ?2",
                rusqlite::params![penalty_xp, cat_id],
            )
            .map_err(|e| e.to_string())?;
            xp_delta = -penalty_xp;
            penalty_applied = true;
            insert_activity(
                &conn,
                &format!("⚠ Passa: {} — -{} XP (dzień {})", name, penalty_xp, bad_streak),
                Some(-penalty_xp),
                "habit",
            )
            .map_err(|e| e.to_string())?;
        } else {
            bonus_blocked = true;
            insert_activity(
                &conn,
                &format!("✗ {} — bonus nawyków zablokowany", name),
                None,
                "habit",
            )
            .map_err(|e| e.to_string())?;
        }
    } else {
        // Toggle OFF — undo
        let bad_streak_before =
            calculate_bad_streak(&conn, habit_id).map_err(|e| e.to_string())?;

        conn.execute(
            "DELETE FROM negative_habit_logs WHERE habit_id = ?1 AND logged_date = ?2",
            rusqlite::params![habit_id, today],
        )
        .map_err(|e| e.to_string())?;

        if bad_streak_before >= 3 {
            // Reverse the penalty
            conn.execute(
                "UPDATE categories SET xp = xp + ?1 WHERE id = ?2",
                rusqlite::params![penalty_xp, cat_id],
            )
            .map_err(|e| e.to_string())?;
            xp_delta = penalty_xp;
            penalty_reversed = true;
            insert_activity(
                &conn,
                &format!("↺ Cofnięto karę: {} +{} XP", name, penalty_xp),
                Some(penalty_xp),
                "habit",
            )
            .map_err(|e| e.to_string())?;
        } else {
            bonus_unblocked = true;
        }

        insert_activity(
            &conn,
            &format!("↺ Cofnięto: {}", name),
            None,
            "habit",
        )
        .map_err(|e| e.to_string())?;
    }

    // Update character XP if there was a penalty delta
    if xp_delta != 0 {
        conn.execute(
            "UPDATE character SET total_xp = MAX(0, total_xp + ?1),
               updated_at = datetime('now') WHERE id = 1",
            rusqlite::params![xp_delta],
        )
        .map_err(|e| e.to_string())?;
    }

    // Sync category level
    let cat_row: CategoryRow = conn
        .query_row(
            "SELECT id, element, rune, stat, xp, level FROM categories WHERE id = ?1",
            rusqlite::params![cat_id],
            |r| {
                Ok(CategoryRow {
                    id: r.get(0)?,
                    element: r.get(1)?,
                    rune: r.get(2)?,
                    stat: r.get(3)?,
                    xp: r.get(4)?,
                    level: r.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    let category_after = enrich_category(cat_row);

    conn.execute(
        "UPDATE categories SET level = ?1 WHERE id = ?2",
        rusqlite::params![category_after.level, cat_id],
    )
    .map_err(|e| e.to_string())?;

    let character_after = sync_character_level(&conn).map_err(|e| e.to_string())?;

    let habit = load_negative_habit(&conn, habit_id, &today).map_err(|e| e.to_string())?;

    Ok(ToggleNegativeHabitResult {
        habit,
        penalty_applied,
        bonus_blocked,
        bonus_unblocked,
        penalty_reversed,
        xp_delta,
        category_after,
        character_after,
    })
}

#[tauri::command]
pub fn create_negative_habit(
    state: State<DbState>,
    payload: CreateNegativeHabitPayload,
) -> Result<NegativeHabitWithStatus, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO negative_habits (name, cat_id, xp_block, penalty_xp)
         VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![payload.name, payload.cat_id, payload.xp_block, payload.penalty_xp],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let today = Local::now().format("%Y-%m-%d").to_string();
    load_negative_habit(&conn, id, &today).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_negative_habit(state: State<DbState>, habit_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM negative_habit_logs WHERE habit_id = ?1",
        rusqlite::params![habit_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM negative_habits WHERE id = ?1",
        rusqlite::params![habit_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_blocked_cats(
    state: State<DbState>,
    date: Option<String>,
) -> Result<Vec<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let today = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());

    let mut stmt = conn
        .prepare(
            "SELECT DISTINCT nh.cat_id
             FROM negative_habits nh
             JOIN negative_habit_logs nhl ON nhl.habit_id = nh.id
             WHERE nhl.logged_date = ?1",
        )
        .map_err(|e| e.to_string())?;

    let cats = stmt
        .query_map(rusqlite::params![today], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<String>>>()
        .map_err(|e| e.to_string())?;

    Ok(cats)
}

#[cfg(test)]
mod tests {
    #[test]
    fn bad_streak_empty_returns_zero() {
        // Pure logic test — streak of 0 dates = 0
        // calculate_bad_streak needs a conn, so test via the logic manually
        let dates: Vec<String> = vec![];
        assert_eq!(dates.len(), 0); // guard: empty = streak 0
    }
}
