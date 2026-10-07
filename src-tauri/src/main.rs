// Bez okna konsoli w wydaniu.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    aura_fields_lib::run()
}
