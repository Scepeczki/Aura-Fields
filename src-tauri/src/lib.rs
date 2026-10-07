// Aura Fields jako aplikacja: okno z grą z katalogu web/ i aktualizacje z wydań na GitHubie.
//
// Aktualizacja idzie w trzech krokach, które gra wywołuje z paska (web/desktop.js):
// update_check → update_download (zdarzenia „update-progress”) → update_install.
// Paczka jest sprawdzana podpisem (klucz publiczny w tauri.conf.json) przed instalacją.
//
// Tryb pomocnika dla instalatora: `--fetch-latest <plik.exe>` pobiera nowszy instalator
// (też ze sprawdzeniem podpisu) i zapisuje go pod podaną ścieżką.
// Kod wyjścia: 0 pobrano, 2 brak nowszej wersji, 3 błąd lub brak sieci.

use std::sync::Mutex;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_updater::{Update, UpdaterExt};

const FETCH_ARG: &str = "--fetch-latest";

#[derive(Default)]
struct Pending {
    update: Option<Update>,
    bytes: Option<Vec<u8>>,
}

#[derive(Default)]
struct Updates(Mutex<Pending>);

#[derive(Serialize)]
struct UpdateInfo {
    version: String,
    current: String,
    notes: Option<String>,
}

#[derive(Clone, Serialize)]
struct Progress {
    got: u64,
    total: Option<u64>,
}

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

#[tauri::command]
fn app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
async fn update_check(app: AppHandle, state: State<'_, Updates>) -> Result<Option<UpdateInfo>, String> {
    let found = app.updater().map_err(err)?.check().await.map_err(err)?;
    let mut p = state.0.lock().unwrap();
    let info = found.as_ref().map(|u| UpdateInfo {
        version: u.version.clone(),
        current: u.current_version.clone(),
        notes: u.body.clone(),
    });
    // pobrana już paczka zostaje, jeśli to wciąż ta sama wersja
    let same = matches!((&p.update, &found), (Some(a), Some(b)) if a.version == b.version);
    if !same {
        p.bytes = None;
    }
    p.update = found;
    Ok(info)
}

#[tauri::command]
async fn update_download(app: AppHandle, state: State<'_, Updates>) -> Result<(), String> {
    let update = {
        let p = state.0.lock().unwrap();
        if p.bytes.is_some() {
            return Ok(());
        }
        p.update.clone().ok_or("Brak aktualizacji do pobrania")?
    };
    let mut got = 0u64;
    let bytes = update
        .download(
            |chunk, total| {
                got += chunk as u64;
                let _ = app.emit("update-progress", Progress { got, total });
            },
            || {},
        )
        .await
        .map_err(err)?;
    state.0.lock().unwrap().bytes = Some(bytes);
    Ok(())
}

#[tauri::command]
fn update_install(app: AppHandle, state: State<'_, Updates>) -> Result<(), String> {
    let (update, bytes) = {
        let mut p = state.0.lock().unwrap();
        let bytes = p.bytes.take().ok_or("Aktualizacja nie jest jeszcze pobrana")?;
        (p.update.take().ok_or("Brak aktualizacji")?, bytes)
    };
    // Na Windows uruchamia instalator (tryb z paskiem postępu) i zamyka grę;
    // instalator po skończeniu otwiera ją ponownie.
    update.install(bytes).map_err(err)?;
    app.restart();
}

async fn fetch_latest(app: &AppHandle, out: &str) -> Result<bool, String> {
    // instalator czeka na wynik z okienkiem „Sprawdzanie…”, więc przy kiepskiej sieci lepiej
    // szybko zainstalować wersję wbudowaną (gra i tak zaproponuje potem aktualizację)
    let updater = app
        .updater_builder()
        .timeout(Duration::from_secs(45))
        .build()
        .map_err(err)?;
    let Some(update) = updater.check().await.map_err(err)? else {
        return Ok(false);
    };
    let bytes = update.download(|_, _| {}, || {}).await.map_err(err)?;
    std::fs::write(out, bytes).map_err(err)?;
    Ok(true)
}

fn main_window(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("Aura Fields")
        .inner_size(1360.0, 860.0)
        .min_inner_size(720.0, 520.0)
        .center()
        .maximized(true)
        // przeciąganie w grze (linie, półki) to HTML5 drag & drop, a nie upuszczanie plików
        .disable_drag_drop_handler()
        .build()?;
    Ok(())
}

pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    let fetch_to = args
        .iter()
        .position(|a| a == FETCH_ARG)
        .and_then(|i| args.get(i + 1).cloned());

    let mut builder = tauri::Builder::default();
    if fetch_to.is_none() {
        // drugie uruchomienie pokazuje już otwarte okno zamiast drugiej kopii gry
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Updates::default())
        .invoke_handler(tauri::generate_handler![
            app_version,
            update_check,
            update_download,
            update_install
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            match fetch_to.clone() {
                Some(out) => {
                    tauri::async_runtime::spawn(async move {
                        let code = match fetch_latest(&handle, &out).await {
                            Ok(true) => 0,
                            Ok(false) => 2,
                            Err(_) => 3,
                        };
                        handle.exit(code);
                    });
                }
                None => main_window(&handle)?,
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("nie udało się uruchomić Aura Fields");
}
