//! Platform-neutral automatic-chest facade.
//!
//! Windows keeps the original region/message implementation. macOS exposes
//! the same IPC contract but reports that chest automation is unavailable until
//! a target-specific Accessibility adapter is implemented. The clicker itself
//! is fully native on macOS and does not depend on this module.

#[cfg(target_os = "windows")]
#[path = "chest_windows.rs"]
mod platform;

#[cfg(target_os = "macos")]
#[path = "chest_macos.rs"]
mod platform;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
#[path = "chest_stub.rs"]
mod platform;

pub use platform::{ensure_dpi_aware, relaunch_as_admin, ChestController, ChestSnapshot};
