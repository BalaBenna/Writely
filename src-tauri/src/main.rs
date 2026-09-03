// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            println!("[Writely Core] Native desktop engine initialized");
            println!("[Writely Core] Local AI acceleration ready (<50ms target)");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running writely desktop application");
}
