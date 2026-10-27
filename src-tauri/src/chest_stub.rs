//! Fallback chest backend for unsupported desktop targets.

use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

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

pub struct ChestController {
    pub shutdown: Arc<AtomicBool>,
}

impl ChestController {
    pub fn new() -> Self {
        Self {
            shutdown: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn set_enabled(&self, _: bool) {}
    pub fn start_worker(&self) {}

    pub fn status(&self) -> ChestSnapshot {
        ChestSnapshot {
            enabled: false,
            elevated: false,
            state: "unsupported".into(),
            detail: "Auto-open-chest is unsupported on this target".into(),
            left: "—".into(),
            right: "—".into(),
            opens_ok: 0,
            opens_failed: 0,
            last_event_unix: 0,
        }
    }
}

pub fn ensure_dpi_aware() {}

pub fn relaunch_as_admin() -> Result<(), String> {
    Err("administrator elevation is unsupported on this target".into())
}
