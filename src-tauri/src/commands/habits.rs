use crate::commands::character::sync_character_level;
use crate::db::{insert_activity, DbState};
use crate::models::{CategoryRow, CreateHabitPayload, Habit, HabitLogDay, ToggleHabitResult};
use crate::xp::enrich_category;
use chrono::Local;
use tauri::State;

fn calculate_streak(conn: &rusqlite::Connection, habit_id: i64) -> rusqlite::Result<i64> {
    let mut stmt = conn.prepare(
        "SELECT logged_date FROM habit_logs WHERE habit_id = ?1 ORDER BY logged_date DESC",
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

    if dates[0] != today && dates[0] != yesterday {
        return Ok(0);
    }

    let mut streak: i64 = 1;
    for i in 1..dates.len() {
        let prev =
            chrono::NaiveDate::parse_from_str(&dates[i - 1], "%Y-%m-%d").unwrap();
        let curr =
            chrono::NaiveDate::parse_from_str(&dates[i], "%Y-%m-%d").unwrap();
        if (prev - curr).num_days() == 1 {
            streak += 1;
        } else {
            break;
        }
    }
    Ok(streak)
}

fn load_habit(
    conn: &rusqlite::Connection,
    habit_id: i64,
    today: &str,
) -> rusqlite::Result<Habit> {
    let (id, name, cat_id, xp_per_check): (i64, String, String, i64) = conn.query_row(
        "SELECT id, name, cat_id, xp_per_check FROM habits WHERE id = ?1",
        rusqlite::params![habit_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
    )?;
    let logged_today: bool = conn.query_row(
        "SELECT COUNT(*) FROM habit_logs WHERE habit_id = ?1 AND logged_date = ?2",
        rusqlite::params![habit_id, today],
        |r| r.get::<_, i64>(0),
    )? > 0;
    let streak = calculate_streak(conn, habit_id)?;
    Ok(Habit {
        id,
        name,
        cat_id,
        xp_per_check,
        streak,
        logged_today,
    })
}

#[tauri::command]
pub fn get_habits(state: State<DbState>) -> Result<Vec<Habit>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let today = Local::now().format("%Y-%m-%d").to_string();
    let mut stmt = conn
        .prepare("SELECT id FROM habits ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let ids: Vec<i64> = stmt
        .query_map([], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<_>>()
        .map_err(|e| e.to_string())?;
    drop(stmt);
    ids.iter()
        .map(|&id| load_habit(&conn, id, &today).map_err(|e| e.to_string()))
        .collect()
}

#[tauri::command]
pub fn create_habit(
    state: State<DbState>,
    payload: CreateHabitPayload,
) -> Result<Habit, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO habits (name, cat_id, xp_per_check) VALUES (?1, ?2, ?3)",
        rusqlite::params![payload.name, payload.cat_id, payload.xp_per_check],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let today = Local::now().format("%Y-%m-%d").to_string();
    load_habit(&conn, id, &today).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_habit(
    state: State<DbState>,
    habit_id: i64,
    date: Option<String>,
) -> Result<ToggleHabitResult, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let today = date.unwrap_or_else(|| Local::now().format("%Y-%m-%d").to_string());

    let already: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM habit_logs WHERE habit_id = ?1 AND logged_date = ?2",
            rusqlite::params![habit_id, today],
            |r| r.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
        > 0;

    let (xp_per_check, cat_id, habit_name): (i64, String, String) = conn
        .query_row(
            "SELECT xp_per_check, cat_id, name FROM habits WHERE id = ?1",
            rusqlite::params![habit_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    // Check shadow block — if the category has an active negative-habit log today,
    // we still record the habit completion (for streak) but grant zero XP.
    let shadow_blocked: bool = if !already {
        conn.query_row(
            "SELECT COUNT(*) FROM negative_habits nh
             JOIN negative_habit_logs nhl ON nhl.habit_id = nh.id
             WHERE nh.cat_id = ?1 AND nhl.logged_date = ?2",
            rusqlite::params![cat_id, today],
            |r| r.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())?
            > 0
    } else {
        false
    };

    let xp_delta = if already {
        conn.execute(
            "DELETE FROM habit_logs WHERE habit_id = ?1 AND logged_date = ?2",
            rusqlite::params![habit_id, today],
        )
        .map_err(|e| e.to_string())?;
        -xp_per_check
    } else {
        conn.execute(
            "INSERT INTO habit_logs (habit_id, logged_date) VALUES (?1, ?2)",
            rusqlite::params![habit_id, today],
        )
        .map_err(|e| e.to_string())?;
        if shadow_blocked { 0 } else { xp_per_check }
    };

    // Only update XP when there is a net change
    if xp_delta != 0 {
        conn.execute(
            "UPDATE categories SET xp = MAX(0, xp + ?1) WHERE id = ?2",
            rusqlite::params![xp_delta, cat_id],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE character SET total_xp = MAX(0, total_xp + ?1),
               updated_at = datetime('now') WHERE id = 1",
            rusqlite::params![xp_delta],
        )
        .map_err(|e| e.to_string())?;
    }

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

    let msg = if already {
        format!("Nawyk '{}' cofnięty", habit_name)
    } else if shadow_blocked {
        format!("✗ Zablokowane: {} (Pokusa aktywna)", habit_name)
    } else {
        format!("✓ {} (+{} XP)", habit_name, xp_per_check)
    };
    let xp_logged = if xp_delta != 0 { Some(xp_delta) } else { None };
    insert_activity(&conn, &msg, xp_logged, "habit").map_err(|e| e.to_string())?;

    let habit = load_habit(&conn, habit_id, &today).map_err(|e| e.to_string())?;
    Ok(ToggleHabitResult {
        habit,
        xp_delta,
        category_after,
        character_after,
    })
}

#[tauri::command]
pub fn delete_habit(state: State<DbState>, habit_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM habit_logs WHERE habit_id = ?1",
        rusqlite::params![habit_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM habits WHERE id = ?1",
        rusqlite::params![habit_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_habit_log(state: State<DbState>, days: i64) -> Result<Vec<HabitLogDay>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let offset = format!("-{} days", days);
    let mut stmt = conn
        .prepare(
            "SELECT logged_date, habit_id FROM habit_logs
             WHERE logged_date >= date('now', ?1)
             ORDER BY logged_date DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, i64)> = stmt
        .query_map(rusqlite::params![offset], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<_>>()
        .map_err(|e| e.to_string())?;

    let mut map: std::collections::BTreeMap<String, Vec<i64>> =
        std::collections::BTreeMap::new();
    for (date, habit_id) in rows {
        map.entry(date).or_default().push(habit_id);
    }
    Ok(map
        .into_iter()
        .rev()
        .map(|(date, habit_ids)| HabitLogDay { date, habit_ids })
        .collect())
}
