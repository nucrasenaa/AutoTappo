<p align="center">
  <img src="web/logo.png" width="100" height="100" alt="AutoTappo Logo" style="border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 242, 254, 0.4);">
  <h1 align="center">AutoTappo</h1>
  <p align="center">
    <strong>《鸣潮》官方桌宠 WuwaTappo 智能后台挂机助手</strong>
  </p>
  <p align="center">
    后台静默连点 · 绝对不抢鼠标 · 打字切屏零干扰 · 极轻量托盘守护
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%2F11%20%7C%20macOS%20ARM64-0078D4" alt="Platform">
  <img src="https://img.shields.io/badge/Release-免安装绿色单文件-brightgreen" alt="Release">
  <img src="https://img.shields.io/badge/License-MIT-orange" alt="License">
</p>

---

玩《鸣潮》桌面桌宠（WuwaTappo），想要累积点击数解锁更多表情、看小宠物快乐拍桌，但手点实在太累；开市面上的普通按键精灵或鼠标连点器，鼠标指针疯狂乱晃、窗口抢焦点，根本没法正常办公、写代码或玩其他游戏。

**AutoTappo 就是为了彻底解决这个痛点：**
**后台安静挂机，绝不抢鼠标、绝不影响打字，你正常用你的电脑，它在后台替你默默刷满点击数。**

---

## ✨ 核心特性

- 🐾 **纯后台静默挂机**
  采用底层虚拟扩展信号驱动，**不抢占窗口焦点、不在任何文本框产生乱码字符**。你可以全屏看视频、打游戏或写文档，桌宠在后台持续累加有效点击。

- 🖱️ **绝对 0 鼠标干涉**
  彻底杜绝鼠标乱晃、光标闪烁或静止消失问题。无论你在做精细绘图还是 FPS 瞄准，鼠标手感保持 100% 原生纯净。

- 🤝 **智能礼貌避让**
  - **打字与输入法保护**：只要你敲击键盘、或者按下 `Shift` 切换中英文，程序毫秒级静默暂停，绝不卡键、绝不吞字；
  - **鼠标拖拽与划词保护**：当你按住鼠标左键/右键选中文字、拖动窗口时自动礼貌避让，绝不打断你的手势。

- 🛡️ **专治桌宠乱跑与消失**
  完美规避桌宠官方内置的热键冲突（避开 F8 切屏、F9 老板键隐藏），绝不会让你挂着挂着桌宠突然失踪或跳到其他屏幕上。

- 🎁 **自动开箱（Windows / macOS 原生协作）**
  累计点击数解锁的宝箱冷却一到，自动替你点掉，不用再盯着桌宠等倒计时。开箱全程走官方界面的真实点击，不伪造任何网络请求，安全可控；面板上实时显示左右两个宝箱的状态（就绪 / 冷却中）与累计开启次数。

  > macOS 原生版通过每用户 Unix socket 通知 **Wuwa Tappo Global Mac**，由目标应用自己的前端判断就绪并调用官方开箱流程；不会向当前前台应用发送盲目鼠标点击。

- 📊 **会话点击与状态看板**
  直观显示本次挂机已发送的连点次数，支持一键清零与速度切换；桌宠底栏原生同步显示累计总分，双端状态清晰互补。

- 🖥️ **轻量托盘常驻**
  支持 Windows 系统托盘与 macOS 菜单栏常驻。关闭面板时自动释放界面渲染内存（后台常驻仅占用极少系统资源）。

---

## 📥 下载安装

前往本仓库的 [**Releases**](https://github.com/To0Ru/AutoTappo/releases/latest) 页面下载最新版本：

| 文件 | 类型 | 说明 |
| :--- | :---: | :--- |
| `AutoTappo.exe` | **绿色免安装版** | **推荐**。单文件双击即用，不写系统注册表，随开随走 |
| `AutoTappo_x64-setup.exe` | **安装包版** | 传统向导安装，带开始菜单与快捷方式，无需管理员权限 |

> **系统要求**：Windows 10 / 11（64位）

### macOS 原生版（Apple Silicon）

本分支已加入不依赖 Wine/CrossOver/虚拟机的 macOS ARM64 backend：

- macOS 13 或更新版本，Apple Silicon（M1/M2/M3/M4）
- 下载 `AutoTappo_0.2.0_aarch64.dmg`，打开后将 `AutoTappo.app` 拖入“应用程序”
- 在“系统设置 → 隐私与安全性”中允许 AutoTappo 的 **辅助功能**；如需全局按键状态检测，也允许 **输入监控**
- macOS backend 使用 CoreGraphics 非打印功能键，不移动鼠标、不抢焦点
- 自动开箱需要同时安装更新后的 **Wuwa Tappo Global Mac 1.0.0**；AutoTappo 与目标应用之间使用权限为 `0600` 的本地 Unix socket
- macOS 面板底部可切换“隐藏 Dock 图标”；隐藏后仍可通过菜单栏托盘图标打开面板，偏好会保存在本机

---

## 🚀 快速上手

1. **启动程序**：Windows 双击 `AutoTappo.exe`；macOS 打开 `AutoTappo.app`，默认常驻托盘/菜单栏；
2. **快捷键控制**：

   | 按键 | 功能 | 说明 |
   | :---: | :---: | :--- |
   | **`F6`** | **启动 / 暂停** | 全局热键，在任何全屏/后台界面随时开启或暂停挂机 |
   | **`F10`** | **备用启停** | 与 F6 相同功能，方便不同键盘布局选择 |
   | **`Esc`** | **退出程序** | 快速安全退出挂机程序 |

3. **托盘菜单使用**：
   - **左键单击托盘图标**：唤出 / 隐藏控制面板看板；
   - **右键托盘图标**：
     - `显示面板`：查看当前累计有效总点击数与运行状态
     - `启动 / 暂停`：一键切换挂机状态
     - `退出`：彻底退出后台守护
   - *提示：直接点击面板右上角的「✕ 关闭」，程序会自动最小化收进托盘继续后台守护，不会中断挂机。*

4. **开启自动开箱**：
   - 在面板【自动开箱】卡片右侧拨动开关即可启用；
   - macOS 先启动 **Wuwa Tappo Global Mac** 并完成登录，再打开 AutoTappo；
   - 卡片会实时显示左右宝箱状态：<span>就绪</span>（橙色）、<span>冷却中</span>（蓝色）；
   - 桌宠被其他窗口盖住、或正在被拖动时，程序会自动等你露出桌宠，不会乱点。

> **Windows 管理员权限**：从 v0.2.0 起，程序**双击即以管理员权限运行**（会弹一次系统的 UAC 确认框，点「是」即可）。
> 这是因为鸣潮桌宠官方程序本身固定以管理员运行，自动开箱需要同等权限才能点击它。挂机连点本身并不需要管理员，但为了开箱可用，程序统一提权，省去你手动右键的麻烦。

---

## 🛠️ 从源码构建 (Build from Source)

如果你希望自行审查代码并从源代码编译，可以按照以下步骤构建：

### Windows

#### 1. 前置依赖准备
- **Rust 编译环境**：安装 [Rustup](https://rustup.rs/)（选择 `stable-x86_64-pc-windows-msvc`）；
- **C++ 构建工具**：安装 Visual Studio 2022 生成工具（含 C++ 桌面开发套件）；
- **WebView2 运行时**：Windows 10 / 11 系统默认已自带。

#### 2. 获取代码与安装 Tauri CLI
```bash
# 克隆仓库
git clone https://github.com/To0Ru/AutoTappo.git
cd autotappo

# 安装 Tauri v2 命令行工具（如尚未安装）
cargo install tauri-cli --version "^2.0"
```

#### 3. 本地调试与开发
```bash
# 启动开发调试模式（支持前端热更新与控制台日志）
cargo tauri dev
```

#### 4. 生产打包发行
```bash
# 构建高度优化的 Release 单文件 EXE 与安装包
cargo tauri build
```
编译生成的最终产物位于：
- **绿色单文件**：`src-tauri/target/release/AutoTappo.exe`
- **安装包**：`src-tauri/target/release/bundle/nsis/AutoTappo_*_x64-setup.exe`

### macOS 原生构建

```bash
xcode-select --install
brew install rustup
rustup-init -y

git clone https://github.com/To0Ru/AutoTappo.git
cd AutoTappo
npx --yes @tauri-apps/cli@^2 build
```

输出文件：

- **应用**：`src-tauri/target/release/bundle/macos/AutoTappo.app`
- **DMG**：`src-tauri/target/release/bundle/dmg/AutoTappo_*_aarch64.dmg`

macOS 的 `clicker_macos.rs` ใช้ CoreGraphics แทน Win32 API และแยกจาก
backend Windows ด้วย `#[cfg(target_os = "...")]`; จึง build เป็น ARM64 native ได้โดยไม่ต้องใช้ Wine หรือ CrossOver.

---

## ❓ 常见问题 (FAQ)

#### Q: 会影响我在浏览器、Word、微信里打字吗？
**不会。** 程序内置了物理输入侦测，只要检测到你正在键盘打字，或者单按 `Shift` 切换中英文，后台会自动暂停发包，等待你打字结束才继续工作。

#### Q: 挂机时我的桌宠为什么有时候不动？
桌宠官方机制规定每满 999 次点击会随机触发一次表情气泡上浮。在正常挂机时，宠物会保持有节奏的拍桌动作，并同步累计数据。

#### Q: 需要以管理员身份运行吗？
**需要，程序会自动处理。** 从 v0.2.0 起，双击 `AutoTappo.exe` 就会弹出 UAC 确认框，点「是」即以管理员权限运行。

原因：鸣潮桌宠官方程序本身固定以管理员身份运行，向它投递点击需要同等级权限，否则会被系统拦截。**挂机连点本身不需要管理员**，但为了自动开箱可用，程序统一提权，省去手动右键的麻烦。

> 如果你只用挂机连点、不需要自动开箱，也可以在旧版（v0.1.0）上使用免提权版本。

#### Q: macOS 自动开箱为什么显示未连接？
请先启动更新后的 **Wuwa Tappo Global Mac 1.0.0** 并进入主桌宠窗口；AutoTappo 会自动重试连接。旧版 Wuwa Tappo 没有本地控制桥接，因此不会工作。

#### Q: macOS 需要管理员权限吗？
不需要管理员权限，但必须在系统设置中授予辅助功能权限，否则 CoreGraphics 不允许发送合成按键事件。

#### Q: 自动开箱会封号吗？
不会。AutoTappo 不发送伪造的网络请求；macOS 由 Wuwa Tappo 自己执行现有的官方前端开箱流程，Windows 仍使用桌宠界面的定向点击。

#### Q: 自动开箱会不会影响我正在用的窗口？
不会。程序从不移动真实鼠标指针，也不用抢焦点的方式点击；桌宠被其他窗口盖住时会自动等待，绝不乱点。

---

## ⚖️ 免责声明

本工具仅为个人学习与桌面挂机辅助软件，不修改游戏内存数据，不包含任何联机破坏性功能。所有与《鸣潮》相关的角色形象、素材版权均归库洛游戏（Kuro Games）所有。
