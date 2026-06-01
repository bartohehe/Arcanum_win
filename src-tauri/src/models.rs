use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryRow {
    pub id: String,
    pub element: String,
    pub rune: String,
    pub stat: String,
    pub xp: i64,
    pub level: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub element: String,
    pub rune: String,
    pub stat: String,
    pub xp: i64,
    pub level: i64,
    pub xp_in_level: i64,
    pub xp_to_next: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Character {
    pub id: i64,
    pub name: String,
    pub class: String,
    pub total_xp: i64,
    pub level: i64,
    pub xp_in_level: i64,
    pub xp_to_next: i64,
    pub categories: Vec<Category>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Quest {
    pub id: i64,
    pub title: String,
    pub bucket: String,
    pub cat_id: String,
    pub xp_reward: i64,
    pub rarity: String,
    pub done: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuestPayload {
    pub title: String,
    pub bucket: String,
    pub cat_id: String,
    pub xp_reward: i64,
    pub rarity: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToggleQuestResult {
    pub quest: Quest,
    pub xp_delta: i64,
    pub category_after: Category,
    pub character_after: Character,
    pub level_up: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Habit {
    pub id: i64,
    pub name: String,
    pub cat_id: String,
    pub xp_per_check: i64,
    pub streak: i64,
    pub logged_today: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateHabitPayload {
    pub name: String,
    pub cat_id: String,
    pub xp_per_check: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToggleHabitResult {
    pub habit: Habit,
    pub xp_delta: i64,
    pub category_after: Category,
    pub character_after: Character,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HabitLogDay {
    pub date: String,
    pub habit_ids: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogLine {
    pub id: i64,
    pub time: String,
    pub message: String,
    pub xp: Option<i64>,
    pub source: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NegativeHabit {
    pub id: i64,
    pub name: String,
    pub cat_id: String,
    pub xp_block: i64,
    pub penalty_xp: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NegativeHabitWithStatus {
    pub id: i64,
    pub name: String,
    pub cat_id: String,
    pub xp_block: i64,
    pub penalty_xp: i64,
    pub created_at: String,
    pub logged_today: bool,
    pub bad_streak: i64,
    pub penalty_active: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateNegativeHabitPayload {
    pub name: String,
    pub cat_id: String,
    pub xp_block: i64,
    pub penalty_xp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToggleNegativeHabitResult {
    pub habit: NegativeHabitWithStatus,
    pub penalty_applied: bool,
    pub bonus_blocked: bool,
    pub bonus_unblocked: bool,
    pub penalty_reversed: bool,
    pub xp_delta: i64,
    pub category_after: Category,
    pub character_after: Character,
}
