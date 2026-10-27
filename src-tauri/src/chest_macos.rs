//! Native macOS chest adapter.
//!
//! Native WuwaTappo Global Mac owns the chest state and API session. AutoTappo
//! therefore sends a narrowly-scoped per-user Unix-socket command to that app;
//! the target frontend validates readiness and performs its own `openChest`
//! flow. No blind screen-wide click or focus stealing is used.

use serde::Serialize;
use serde_json::json;
use std::env;
use std::io::Write;
use std::os::unix::net::UnixStream;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

const TARGET_IDENTIFIER: &str = "dev.w33d.wuwatappo.global.mac";
const RETRY_INTERVAL: Duration = Duration::from_secs(2);

#[derive(Clone, Serialize)]
pub struct ChestSnapshot {
    pub enabled: bool,
    pub elevated: bool,
    pub state: String,
    pub detail: String,
    pub left: String,
    pub right: String,
    pub opens_ok: u32,
    pub opens_failed: u32,
    pub last_event_unix: u64,
}

impl Default for ChestSnapshot {
    fn default() -> Self {
        Self {
            enabled: false,
            elevated: false,
            state: "idle".into(),
            detail: "Start WuwaTappo Global Mac to connect Auto Chest".into(),
            left: "—".into(),
            right: "—".into(),
            opens_ok: 0,
            opens_failed: 0,
            last_event_unix: 0,
        }
    }
}

pub struct ChestController {
    pub shutdown: Arc<AtomicBool>,
    enabled: Arc<AtomicBool>,
    snapshot: Arc<Mutex<ChestSnapshot>>,
}

fn socket_path() -> Option<PathBuf> {
    let home = env::var_os("HOME")?;
    Some(
        PathBuf::from(home)
            .join("Library/Application Support")
            .join(TARGET_IDENTIFIER)
            .join("autotappo.sock"),
    )
}

fn send_command(enabled: bool) -> Result<(), String> {
    let path = socket_path().ok_or_else(|| "HOME is unavailable".to_string())?;
    let mut stream = UnixStream::connect(&path)
        .map_err(|error| format!("WuwaTappo socket unavailable: {error}"))?;
    stream
        .set_write_timeout(Some(Duration::from_millis(500)))
        .map_err(|error| error.to_string())?;
    let payload = json!({
        "command": "set_auto_chest",
        "enabled": enabled,
    });
    writeln!(stream, "{payload}").map_err(|error| error.to_string())
}

fn update_snapshot(snapshot: &Mutex<ChestSnapshot>, enabled: bool, result: Result<(), String>) {
    let Ok(mut state) = snapshot.lock() else {
        return;
    };
    state.enabled = enabled;
    state.elevated = true;
    state.last_event_unix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    match result {
        Ok(()) if enabled => {
            state.state = "relay-enabled".into();
            state.detail =
                "Connected to WuwaTappo Global Mac; the target app manages chest opening".into();
            state.left = "Managed by target app".into();
            state.right = "Managed by target app".into();
        }
        Ok(()) => {
            state.state = "idle".into();
            state.detail = "Auto Chest disabled".into();
            state.left = "—".into();
            state.right = "—".into();
        }
        Err(error) if enabled => {
            state.state = "no-target".into();
            state.detail = format!("WuwaTappo Global Mac is not connected: {error}");
            state.left = "—".into();
            state.right = "—".into();
        }
        Err(error) => {
            state.state = "error".into();
            state.detail = format!("Failed to disable Auto Chest: {error}");
        }
    }
}

impl ChestController {
    pub fn new() -> Self {
        Self {
            shutdown: Arc::new(AtomicBool::new(false)),
            enabled: Arc::new(AtomicBool::new(false)),
            snapshot: Arc::new(Mutex::new(ChestSnapshot::default())),
        }
    }

    pub fn set_enabled(&self, on: bool) {
        self.enabled.store(on, Ordering::Release);
        if !on {
            update_snapshot(&self.snapshot, false, send_command(false));
        } else if let Ok(mut state) = self.snapshot.lock() {
            state.enabled = true;
            state.state = "connecting".into();
            state.detail = "Connecting to WuwaTappo Global Mac…".into();
        }
    }

    pub fn status(&self) -> ChestSnapshot {
        self.snapshot
            .lock()
            .map(|snapshot| snapshot.clone())
            .unwrap_or_else(|_| ChestSnapshot::default())
    }

    pub fn start_worker(&self) {
        let enabled = Arc::clone(&self.enabled);
        let shutdown = Arc::clone(&self.shutdown);
        let snapshot = Arc::clone(&self.snapshot);
        thread::Builder::new()
            .name("autotappo-macos-chest".into())
            .spawn(move || {
                while !shutdown.load(Ordering::Acquire) {
                    if enabled.load(Ordering::Acquire) {
                        update_snapshot(&snapshot, true, send_command(true));
                    }
                    thread::sleep(RETRY_INTERVAL);
                }
            })
            .expect("could not start macOS chest bridge");
    }
}

pub fn ensure_dpi_aware() {}

pub fn relaunch_as_admin() -> Result<(), String> {
    Err("macOS does not require administrator elevation for AutoTappo".into())
}
