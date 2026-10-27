<p align="center">
  <img src="web/logo.png" width="100" height="100" alt="AutoTappo logo">
  <h1 align="center">AutoTappo</h1>
  <p align="center"><strong>WuwaTappo background click assistant</strong></p>
  <p align="center">Quiet background clicking · No mouse movement · No focus stealing · Lightweight tray/menu-bar app</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%2F11%20%7C%20macOS%20ARM64-0078D4" alt="Platform">
  <img src="https://img.shields.io/badge/macOS-release-v0.2.0--macos-brightgreen" alt="macOS release">
  <img src="https://img.shields.io/badge/License-MIT-orange" alt="License">
</p>

> **Repository:** [github.com/nucrasenaa/AutoTappo](https://github.com/nucrasenaa/AutoTappo)

# English

AutoTappo is a lightweight background assistant for the WuwaTappo desktop pet. It sends clicks without moving the physical pointer, stealing focus, or typing phantom characters into text fields.

## Features

- **Background automation** — keeps clicking while you work, watch videos, or use another app.
- **No physical mouse movement** — the real pointer stays where you left it.
- **Input-aware pausing** — pauses politely while you type, switch input methods, drag, or select text.
- **Auto Chest** — opens ready chests through the target app's own chest flow.
- **Tray/menu-bar mode** — runs quietly with a compact control panel.
- **macOS native ARM64** — built with the native macOS backend; no Wine, CrossOver, or virtual machine.

## Download

Download the latest release from [Releases](https://github.com/nucrasenaa/AutoTappo/releases/latest).

| File | Platform | Notes |
| --- | --- | --- |
| `AutoTappo_0.2.0_aarch64.dmg` | macOS Apple Silicon | Native ARM64 DMG for M1/M2/M3/M4 |
| `AutoTappo.exe` | Windows | Portable build, when published |
| `AutoTappo_x64-setup.exe` | Windows | Installer build, when published |

### macOS requirements

- macOS 13 or later
- Apple Silicon Mac (M1, M2, M3, or M4)
- Updated **Wuwa Tappo Global Mac 1.0.0** for Auto Chest
- The user must be logged in to Wuwa Tappo before chest automation can run

### macOS permissions

Enable these permissions for the installed applications:

1. **System Settings → Privacy & Security → Input Monitoring**
   - `AutoTappo`
   - `Wuwa Tappo Global Mac`
2. **System Settings → Privacy & Security → Accessibility**
   - Enable `AutoTappo` if macOS asks for it.
3. Quit and reopen both apps after changing permissions.

The Wuwa Tappo companion must be the updated macOS build. The old target app does not expose the local automation bridge.

## Quick start

1. Open **Wuwa Tappo Global Mac** and complete login.
2. Open **AutoTappo**.
3. Grant the macOS permissions listed above.
4. Turn on **Auto Chest** if chest automation is needed.
5. Press **Start automation** or `F6`.
6. Press `F6` again to pause. `Esc` exits the assistant.

The Auto Chest panel should show the target app as connected. It will wait when a chest is covered, cooling down, or the target app is not ready.

## Build from source

### Windows

```bash
git clone https://github.com/nucrasenaa/AutoTappo.git
cd AutoTappo
cargo install tauri-cli --version "^2.0"
cargo tauri dev
cargo tauri build
```

### macOS native

```bash
xcode-select --install
brew install rustup
rustup-init -y

git clone https://github.com/nucrasenaa/AutoTappo.git
cd AutoTappo
cargo install tauri-cli --version "^2.0"
cargo tauri build
```

Build output:

- App: `src-tauri/target/release/bundle/macos/AutoTappo.app`
- DMG: `src-tauri/target/release/bundle/dmg/AutoTappo_*_aarch64.dmg`

The macOS clicker uses CoreGraphics and is selected separately from the Windows backend with `#[cfg(target_os = "macos")]`.

## FAQ

### Does AutoTappo type into text fields?
No. The macOS backend uses non-printing input events and pauses around user input.

### Why does Auto Chest show disconnected?
Start the updated Wuwa Tappo companion first, complete login, then restart AutoTappo. Also verify that both apps have Input Monitoring permission.

### Why does Auto Chest not open anything?
AutoTappo must be running, Auto Chest must be enabled, and Wuwa Tappo must be logged in with enough accumulated clicks for the next chest. A logged-out target app cannot open a chest through its official flow.

### Does macOS require Wine or CrossOver?
No. The macOS build is native ARM64.

### Is the physical mouse moved?
No. AutoTappo does not move the user's physical pointer.

## Disclaimer

This project is a personal desktop automation assistant. WuwaTappo, Wuthering Waves, character artwork, and related assets belong to their respective rights holders. Use it responsibly and at your own risk.

---

# ภาษาไทย

AutoTappo คือโปรแกรมช่วยกดคลิกเบื้องหลังสำหรับสัตว์เลี้ยงเดสก์ท็อป **WuwaTappo** โดยไม่ขยับเมาส์จริง ไม่แย่งโฟกัสหน้าต่าง และไม่พิมพ์อักขระแปลก ๆ ลงในช่องข้อความ

## ฟีเจอร์หลัก

- **ทำงานเบื้องหลัง** — ปล่อยให้กดคลิกขณะทำงาน ดูวิดีโอ หรือใช้แอปอื่นได้
- **ไม่ขยับเมาส์จริง** — ตำแหน่งเคอร์เซอร์ของผู้ใช้ไม่เปลี่ยน
- **หยุดอย่างสุภาพเมื่อผู้ใช้กำลังใช้งาน** — หยุดชั่วคราวระหว่างพิมพ์ เปลี่ยนภาษา ลากหน้าต่าง หรือเลือกข้อความ
- **เปิดกล่องอัตโนมัติ** — สั่งให้แอปเป้าหมายใช้ขั้นตอนเปิดกล่องของตัวเอง
- **ทำงานบนเมนูบาร์/ถาดระบบ** — ปิดหน้าต่างแล้วให้ทำงานต่อเบื้องหลังได้
- **macOS Native ARM64** — ไม่ต้องใช้ Wine, CrossOver หรือ Virtual Machine

## ดาวน์โหลด

ดาวน์โหลดรุ่นล่าสุดจากหน้า [Releases](https://github.com/nucrasenaa/AutoTappo/releases/latest)

| ไฟล์ | ระบบ | รายละเอียด |
| --- | --- | --- |
| `AutoTappo_0.2.0_aarch64.dmg` | macOS Apple Silicon | DMG สำหรับ M1/M2/M3/M4 |
| `AutoTappo.exe` | Windows | รุ่น Portable เมื่อมีการเผยแพร่ |
| `AutoTappo_x64-setup.exe` | Windows | รุ่นติดตั้ง เมื่อมีการเผยแพร่ |

### ความต้องการของ macOS

- macOS 13 ขึ้นไป
- Mac Apple Silicon รุ่น M1, M2, M3 หรือ M4
- ต้องใช้ **Wuwa Tappo Global Mac 1.0.0** รุ่นที่มี bridge สำหรับ Auto Chest
- ต้อง Login ใน Wuwa Tappo ก่อน จึงจะเปิดกล่องอัตโนมัติได้

### การอนุญาตบน macOS

ไปที่ **System Settings → Privacy & Security** แล้วเปิดสิทธิ์ให้แอปที่ติดตั้ง:

1. **Input Monitoring**
   - `AutoTappo`
   - `Wuwa Tappo Global Mac`
2. **Accessibility**
   - เปิดให้ `AutoTappo` หาก macOS ขอสิทธิ์
3. หลังเปลี่ยนสิทธิ์ ให้ Quit และเปิดทั้งสองแอปใหม่

ต้องใช้ Wuwa Tappo companion รุ่น macOS ที่อัปเดตแล้ว เพราะรุ่นเก่าไม่มี local automation bridge

## วิธีใช้งานอย่างรวดเร็ว

1. เปิด **Wuwa Tappo Global Mac** และ Login ให้สำเร็จ
2. เปิด **AutoTappo**
3. เปิดสิทธิ์ macOS ตามรายการด้านบน
4. เปิดสวิตช์ **Auto Chest** หากต้องการเปิดกล่องอัตโนมัติ
5. กด **Start automation** หรือกด `F6`
6. กด `F6` อีกครั้งเพื่อหยุดชั่วคราว และกด `Esc` เพื่อออก

ในการเปิดกล่องอัตโนมัติ แผง Auto Chest ต้องแสดงว่าเชื่อมต่อกับแอปเป้าหมายแล้ว โปรแกรมจะรอหากกล่องยังไม่พร้อม ถูกบัง อยู่ในช่วง Cooldown หรือยัง Login ไม่สำเร็จ

## Build จาก Source

### Windows

```bash
git clone https://github.com/nucrasenaa/AutoTappo.git
cd AutoTappo
cargo install tauri-cli --version "^2.0"
cargo tauri dev
cargo tauri build
```

### macOS Native

```bash
xcode-select --install
brew install rustup
rustup-init -y

git clone https://github.com/nucrasenaa/AutoTappo.git
cd AutoTappo
cargo install tauri-cli --version "^2.0"
cargo tauri build
```

ไฟล์ที่ได้:

- App: `src-tauri/target/release/bundle/macos/AutoTappo.app`
- DMG: `src-tauri/target/release/bundle/dmg/AutoTappo_*_aarch64.dmg`

ฝั่ง macOS ใช้ CoreGraphics และแยกจาก backend ของ Windows ด้วย `#[cfg(target_os = "macos")]`

## คำถามที่พบบ่อย

### โปรแกรมพิมพ์ตัวอักษรแปลก ๆ ลงช่องข้อความไหม?
ไม่พิมพ์ครับ ฝั่ง macOS ใช้ input event ที่ไม่ใช่ตัวอักษร และหยุดชั่วคราวเมื่อผู้ใช้กำลังพิมพ์

### ทำไม Auto Chest ขึ้นว่าไม่เชื่อมต่อ?
เปิด Wuwa Tappo companion รุ่นใหม่ก่อน Login ให้สำเร็จ แล้วเปิด AutoTappo ใหม่ ตรวจสอบด้วยว่าเปิด Input Monitoring ให้ทั้งสองแอปแล้ว

### ทำไม Auto Chest ยังไม่เปิดกล่อง?
ต้องกด Start automation, เปิด Auto Chest, Login ใน Wuwa Tappo และมีจำนวนคลิกสะสมเพียงพอสำหรับกล่องถัดไป หากยังไม่ได้ Login แอปจะไม่สามารถเรียกขั้นตอนเปิดกล่องทางการได้

### macOS ต้องใช้ Wine หรือ CrossOver ไหม?
ไม่ต้องใช้ รุ่น macOS เป็น Native ARM64

### โปรแกรมขยับเมาส์จริงหรือไม่?
ไม่ขยับเมาส์จริง และไม่เปลี่ยนตำแหน่งเคอร์เซอร์ของผู้ใช้

## ข้อจำกัดความรับผิดชอบ

โปรเจกต์นี้เป็นเครื่องมือช่วยทำงานอัตโนมัติบนเดสก์ท็อปสำหรับการใช้งานส่วนบุคคล ชื่อ WuwaTappo, Wuthering Waves, ภาพตัวละคร และทรัพย์สินที่เกี่ยวข้องเป็นของเจ้าของลิขสิทธิ์แต่ละราย ผู้ใช้ควรใช้งานอย่างรับผิดชอบและยอมรับความเสี่ยงด้วยตนเอง
