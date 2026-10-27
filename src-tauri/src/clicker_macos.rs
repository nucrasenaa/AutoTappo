//! Native macOS clicker backend.
//!
//! macOS has no Windows virtual-key API. This backend uses CoreGraphics HID
//! events instead, so it does not move the pointer or take focus. Posting
//! synthetic keyboard events requires Accessibility permission. The phantom
//! keys are F17..F20 because macOS exposes those as non-printing function keys.

use rand::Rng;
use std::ffi::c_void;
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU64, AtomicU8, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

const KCG_HID_EVENT_TAP: u32 = 0;
const KCG_EVENT_SOURCE_STATE_COMBINED_SESSION: i32 = 0;

// macOS virtual key codes for F17, F18, F19 and F20.
const PHANTOM_KEYS: [u16; 4] = [64, 79, 80, 90];

// The web UI stores Windows VK values for compatibility with the original app.
pub const DEFAULT_HOTKEY_VK: i32 = 0x75; // F6

#[derive(Debug, Clone, Copy)]
pub struct SpeedConfig {
    pub min_interval_ms: u64,
    pub max_interval_ms: u64,
    pub min_hold_ms: u64,
    pub max_hold_ms: u64,
}

pub fn get_speed_config(mode: u8) -> SpeedConfig {
    match mode {
        1 => SpeedConfig {
            min_interval_ms: 35,
            max_interval_ms: 55,
            min_hold_ms: 15,
            max_hold_ms: 25,
        },
        2 => SpeedConfig {
            min_interval_ms: 18,
            max_interval_ms: 26,
            min_hold_ms: 10,
            max_hold_ms: 18,
        },
        _ => SpeedConfig {
            min_interval_ms: 70,
            max_interval_ms: 125,
            min_hold_ms: 16,
            max_hold_ms: 32,
        },
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

    pub fn start_worker(&self) {
        let running = Arc::clone(&self.running);
        let speed_mode = Arc::clone(&self.speed_mode);
        let total_sent = Arc::clone(&self.total_sent);
        let hotkey_vk = Arc::clone(&self.hotkey_vk);
        let shutdown = Arc::clone(&self.shutdown);

        thread::Builder::new()
            .name("autotappo-macos-clicker".into())
            .spawn(move || {
                if !post_event_access_available() {
                    eprintln!(concat!(
                        "[AutoTappo] macOS Accessibility permission is required to post keys. ",
                        "Enable AutoTappo in System Settings > Privacy & Security > Accessibility."
                    ));
                }

                let mut rng = rand::thread_rng();
                let mut last_hotkey_down = false;
                let mut last_user_active_time = Instant::now() - Duration::from_secs(1);

                while !shutdown.load(Ordering::Relaxed) {
                    let current_vk = hotkey_vk.load(Ordering::Relaxed);
                    let cur_hotkey_down = current_vk
                        .try_into()
                        .ok()
                        .and_then(mac_key_code)
                        .is_some_and(is_key_down);

                    if cur_hotkey_down && !last_hotkey_down {
                        let prev = running.fetch_xor(true, Ordering::SeqCst);
                        log_state_change(!prev);
                        thread::sleep(Duration::from_millis(200));
                    }
                    last_hotkey_down = cur_hotkey_down;

                    if running.load(Ordering::Relaxed) {
                        let now = Instant::now();
                        if is_user_actively_operating() {
                            last_user_active_time = now;
                            thread::sleep(Duration::from_millis(20));
                            continue;
                        }
                        if now.duration_since(last_user_active_time) < Duration::from_millis(180) {
                            thread::sleep(Duration::from_millis(20));
                            continue;
                        }

                        let key = PHANTOM_KEYS[rng.gen_range(0..PHANTOM_KEYS.len())];
                        let cfg = get_speed_config(speed_mode.load(Ordering::Relaxed));
                        let hold_ms = rng.gen_range(cfg.min_hold_ms..=cfg.max_hold_ms);
                        post_key(key, true);
                        thread::sleep(Duration::from_millis(hold_ms));
                        post_key(key, false);
                        total_sent.fetch_add(1, Ordering::Relaxed);

                        if rng.gen_bool(0.03) {
                            thread::sleep(Duration::from_millis(rng.gen_range(250..=400)));
                        } else {
                            thread::sleep(Duration::from_millis(
                                rng.gen_range(cfg.min_interval_ms..=cfg.max_interval_ms),
                            ));
                        }
                    } else {
                        thread::sleep(Duration::from_millis(40));
                    }
                }
            })
            .expect("failed to start AutoTappo macOS clicker thread");
    }
}

fn log_state_change(running: bool) {
    println!(
        "[AutoTappo] {}",
        if running {
            "automation started"
        } else {
            "automation paused"
        }
    );
}

fn is_key_down(key: u16) -> bool {
    unsafe { CGEventSourceKeyState(KCG_EVENT_SOURCE_STATE_COMBINED_SESSION, key) }
}

fn is_user_actively_operating() -> bool {
    // Mouse buttons: left, right and middle.
    [0u16, 1, 2].into_iter().any(is_key_down)
        // Shift, Control, Option and Command, both sides.
        || [56u16, 60, 59, 62, 58, 61, 55, 54]
            .into_iter()
            .any(is_key_down)
        // Letters A-Z and digits 0-9. These are the keys that can affect
        // ordinary text entry or input-method switching.
        || (0u16..=47).any(is_key_down)
        || is_key_down(49) // Space
        || is_key_down(51) // Backspace
        || is_key_down(36) // Return
}

fn post_event_access_available() -> bool {
    if unsafe { CGPreflightPostEventAccess() } {
        return true;
    }
    unsafe { CGRequestPostEventAccess() }
}

fn post_key(key: u16, down: bool) {
    let event = unsafe { CGEventCreateKeyboardEvent(std::ptr::null_mut(), key, down) };
    if event.is_null() {
        eprintln!("[AutoTappo] CoreGraphics could not create a keyboard event");
        return;
    }
    unsafe {
        CGEventPost(KCG_HID_EVENT_TAP, event);
        CFRelease(event);
    }
}

/// Convert the Windows VK values emitted by the existing frontend to macOS
/// hardware key codes. Keeping this boundary means existing localStorage and
/// the UI do not need a platform-specific fork.
fn mac_key_code(vk: u16) -> Option<u16> {
    let code = match vk {
        0x70..=0x7b => {
            [122, 120, 99, 118, 96, 97, 98, 100, 101, 109, 103, 111][(vk - 0x70) as usize]
        }
        0x41..=0x5a => [
            0, 11, 8, 2, 14, 3, 5, 4, 34, 38, 40, 37, 46, 45, 31, 35, 12, 15, 1, 17, 32, 9, 13, 7,
            16, 6,
        ][(vk - 0x41) as usize],
        0x30..=0x39 => [29, 18, 19, 20, 21, 23, 22, 26, 28, 25][(vk - 0x30) as usize],
        0x24 => 115, // Home
        0x23 => 119, // End
        0x21 => 116, // PageUp
        0x22 => 121, // PageDown
        0x2d => 114, // Insert / Help on macOS keyboards
        0x2e => 117, // Delete
        0x13 => 113, // Pause-like function key
        0x91 => 71,  // NumLock
        _ => return None,
    };
    Some(code)
}

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightPostEventAccess() -> bool;
    fn CGRequestPostEventAccess() -> bool;
    fn CGEventSourceKeyState(state: i32, key: u16) -> bool;
    fn CGEventCreateKeyboardEvent(source: *mut c_void, key: u16, down: bool) -> *mut c_void;
    fn CGEventPost(tap: u32, event: *mut c_void);
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFRelease(object: *mut c_void);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_function_keys_and_default_hotkey() {
        assert_eq!(mac_key_code(0x70), Some(122));
        assert_eq!(mac_key_code(DEFAULT_HOTKEY_VK as u16), Some(97));
        assert_eq!(mac_key_code(0x7b), Some(111));
    }

    #[test]
    fn maps_text_keys_without_using_ascii_as_hardware_code() {
        assert_eq!(mac_key_code('A' as u16), Some(0));
        assert_eq!(mac_key_code('Z' as u16), Some(6));
        assert_eq!(mac_key_code('0' as u16), Some(29));
    }

    #[test]
    fn unsupported_virtual_keys_fail_closed() {
        assert_eq!(mac_key_code(0x10), None);
        assert_eq!(mac_key_code(0xffff), None);
    }
}
