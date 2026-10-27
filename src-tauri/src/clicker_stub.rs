//! Fallback backend for unsupported desktop targets.

use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU64, AtomicU8};
use std::sync::Arc;

pub const DEFAULT_HOTKEY_VK: i32 = 0x75;

#[derive(Debug, Clone, Copy)]
pub struct SpeedConfig {
    pub min_interval_ms: u64,
    pub max_interval_ms: u64,
    pub min_hold_ms: u64,
    pub max_hold_ms: u64,
}

pub fn get_speed_config(_: u8) -> SpeedConfig {
    SpeedConfig {
        min_interval_ms: 70,
        max_interval_ms: 125,
        min_hold_ms: 16,
        max_hold_ms: 32,
    }
}

pub struct ClickerController {
    pub running: Arc<AtomicBool>,
    pub speed_mode: Arc<AtomicU8>,
    pub total_sent: Arc<AtomicU64>,
    pub hotkey_vk: Arc<AtomicI32>,
    pub shutdown: Arc<AtomicBool>,
}

impl ClickerController {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            speed_mode: Arc::new(AtomicU8::new(0)),
            total_sent: Arc::new(AtomicU64::new(0)),
            hotkey_vk: Arc::new(AtomicI32::new(DEFAULT_HOTKEY_VK)),
            shutdown: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start_worker(&self) {}
}
