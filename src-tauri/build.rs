fn main() {
    println!("cargo:rerun-if-changed=../web");
    println!("cargo:rerun-if-changed=icons");
    println!("cargo:rerun-if-changed=tauri.conf.json");

    #[cfg(target_os = "windows")]
    {
        // Embed the original Windows manifest only in Windows builds.
        let windows = tauri_build::WindowsAttributes::new()
            .app_manifest(include_str!("AutoTappo.exe.manifest"));
        let attrs = tauri_build::Attributes::new().windows_attributes(windows);
        tauri_build::try_build(attrs).expect("failed to run tauri-build");
    }

    #[cfg(not(target_os = "windows"))]
    tauri_build::try_build(tauri_build::Attributes::new()).expect("failed to run tauri-build");
}
