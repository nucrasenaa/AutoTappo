//! Native macOS chest status adapter.
//!
//! The Windows version can address WuwaTappo's private `DesktopCatInput`
//! window and its Win32 region. macOS has no equivalent private-window
//! message channel. Do not synthesize arbitrary screen clicks here: that
//! would steal the user's focus and could click the wrong application.
//!
//! The IPC surface remains available so the UI gives an explicit, safe status
//! instead of silently claiming that auto-open-chest works.

use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

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
            state: "unsupported".into(),
            detail: "macOS native build: auto-open-chest is not available yet".into(),
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
        if let Ok(mut snapshot) = self.snapshot.lock() {
            snapshot.enabled = on;
            snapshot.state = "unsupported".into();
            snapshot.detail = if on {
                "macOS native build: auto-open-chest needs a target-specific Accessibility adapter"
                    .into()
            } else {
                "Auto-open-chest is disabled on macOS native build".into()
            };
        }
    }

    pub fn status(&self) -> ChestSnapshot {
        self.snapshot
            .lock()
            .map(|snapshot| snapshot.clone())
            .unwrap_or_else(|_| ChestSnapshot::default())
    }

    pub fn start_worker(&self) {
        // Intentionally no worker: a no-op status is safer than clicking the
        // frontmost application when the target adapter is unavailable.
    }
}

pub fn ensure_dpi_aware() {}

pub fn relaunch_as_admin() -> Result<(), String> {
    Err("macOS does not require administrator elevation for AutoTappo".into())
}
