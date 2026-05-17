use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

pub fn notify_level_up(app: &AppHandle, level: i64) -> Result<(), tauri_plugin_notification::Error> {
    app.notification()
        .builder()
        .title("Arcanum — Level Up!")
        .body(format!("Osiągnąłeś poziom {}!", level))
        .show()
}
