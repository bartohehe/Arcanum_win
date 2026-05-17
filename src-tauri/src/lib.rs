#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;
mod notifications;
mod xp;

use db::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("no app data dir");
            std::fs::create_dir_all(&app_data_dir)?;
            let conn = db::open_and_migrate(&app_data_dir)
                .expect("failed to open/migrate database");
            app.manage(DbState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::character::get_character,
            commands::character::update_name,
            commands::character::reset_data,
            commands::character::export_json,
            commands::quests::get_quests,
            commands::quests::create_quest,
            commands::quests::toggle_quest,
            commands::quests::delete_quest,
            commands::habits::get_habits,
            commands::habits::create_habit,
            commands::habits::toggle_habit,
            commands::habits::delete_habit,
            commands::habits::get_habit_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
