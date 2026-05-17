use crate::commands::character::sync_character_level;
use crate::db::{insert_activity, DbState};
use crate::models::{CategoryRow, CreateQuestPayload, Quest, ToggleQuestResult};
use crate::xp::enrich_category;
use tauri::State;

fn row_to_quest(r: &rusqlite::Row) -> rusqlite::Result<Quest> {
    Ok(Quest {
        id: r.get(0)?,
        title: r.get(1)?,
        bucket: r.get(2)?,
        cat_id: r.get(3)?,
        xp_reward: r.get(4)?,
        rarity: r.get(5)?,
        done: r.get::<_, i64>(6)? != 0,
        created_at: r.get(7)?,
    })
}

#[tauri::command]
pub fn get_quests(state: State<DbState>, bucket: String) -> Result<Vec<Quest>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, bucket, cat_id, xp_reward, rarity, done, created_at
             FROM quests WHERE bucket = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let quests = stmt
        .query_map(rusqlite::params![bucket], row_to_quest)
        .map_err(|e| e.to_string())?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;
    Ok(quests)
}

#[tauri::command]
pub fn create_quest(
    state: State<DbState>,
    payload: CreateQuestPayload,
) -> Result<Quest, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO quests (title, bucket, cat_id, xp_reward, rarity)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            payload.title,
            payload.bucket,
            payload.cat_id,
            payload.xp_reward,
            payload.rarity
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let quest = conn
        .query_row(
            "SELECT id, title, bucket, cat_id, xp_reward, rarity, done, created_at
             FROM quests WHERE id = ?1",
            rusqlite::params![id],
            row_to_quest,
        )
        .map_err(|e| e.to_string())?;
    Ok(quest)
}

#[tauri::command]
pub fn toggle_quest(
    app: tauri::AppHandle,
    state: State<DbState>,
    quest_id: i64,
) -> Result<ToggleQuestResult, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let quest = conn
        .query_row(
            "SELECT id, title, bucket, cat_id, xp_reward, rarity, done, created_at
             FROM quests WHERE id = ?1",
            rusqlite::params![quest_id],
            row_to_quest,
        )
        .map_err(|e| e.to_string())?;

    let (xp_delta, new_done) = if quest.done {
        conn.execute(
            "DELETE FROM completions WHERE rowid = (
               SELECT MAX(rowid) FROM completions WHERE quest_id = ?1
             )",
            rusqlite::params![quest_id],
        )
        .map_err(|e| e.to_string())?;
        (-quest.xp_reward, false)
    } else {
        conn.execute(
            "INSERT INTO completions (quest_id, xp_earned) VALUES (?1, ?2)",
            rusqlite::params![quest_id, quest.xp_reward],
        )
        .map_err(|e| e.to_string())?;
        (quest.xp_reward, true)
    };

    conn.execute(
        "UPDATE quests SET done = ?1 WHERE id = ?2",
        rusqlite::params![new_done as i64, quest_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE categories SET xp = MAX(0, xp + ?1) WHERE id = ?2",
        rusqlite::params![xp_delta, quest.cat_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE character SET total_xp = MAX(0, total_xp + ?1),
           updated_at = datetime('now') WHERE id = 1",
        rusqlite::params![xp_delta],
    )
    .map_err(|e| e.to_string())?;

    let cat_row: CategoryRow = conn
        .query_row(
            "SELECT id, element, rune, stat, xp, level FROM categories WHERE id = ?1",
            rusqlite::params![quest.cat_id],
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
        rusqlite::params![category_after.level, quest.cat_id],
    )
    .map_err(|e| e.to_string())?;

    let char_before_level: i64 = conn
        .query_row(
            "SELECT level FROM character WHERE id = 1",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let character_after = sync_character_level(&conn).map_err(|e| e.to_string())?;
    let level_up = character_after.level > char_before_level;

    let msg = if new_done {
        format!("Ukończono: {} (+{} XP)", quest.title, quest.xp_reward)
    } else {
        format!("Cofnięto: {}", quest.title)
    };
    let xp_logged = if new_done { Some(quest.xp_reward) } else { None };
    insert_activity(&conn, &msg, xp_logged, "quest").map_err(|e| e.to_string())?;

    if level_up {
        let _ = crate::notifications::notify_level_up(&app, character_after.level);
    }

    let updated_quest = conn
        .query_row(
            "SELECT id, title, bucket, cat_id, xp_reward, rarity, done, created_at
             FROM quests WHERE id = ?1",
            rusqlite::params![quest_id],
            row_to_quest,
        )
        .map_err(|e| e.to_string())?;

    Ok(ToggleQuestResult {
        quest: updated_quest,
        xp_delta,
        category_after,
        character_after,
        level_up,
    })
}

#[tauri::command]
pub fn delete_quest(state: State<DbState>, quest_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM completions WHERE quest_id = ?1",
        rusqlite::params![quest_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM quests WHERE id = ?1",
        rusqlite::params![quest_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
