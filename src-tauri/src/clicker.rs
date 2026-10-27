//! Platform-neutral clicker facade.
//!
//! The original project was Windows-only. Keep the proven Win32 backend in
//! `clicker_windows.rs` and provide a native CoreGraphics backend for macOS.

#[cfg(target_os = "windows")]
#[path = "clicker_windows.rs"]
mod platform;

#[cfg(target_os = "macos")]
#[path = "clicker_macos.rs"]
mod platform;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
#[path = "clicker_stub.rs"]
mod platform;

#[allow(unused_imports)]
pub use platform::{get_speed_config, ClickerController, SpeedConfig, DEFAULT_HOTKEY_VK};
