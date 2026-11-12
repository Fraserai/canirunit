mod scanner;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scanner::scan_machine,
            scanner::check_runtime,
            scanner::get_disk_space,
            scanner::get_gpu_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running CanIRunAI");
}
