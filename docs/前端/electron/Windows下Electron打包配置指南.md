# Windows 下 Electron 打包配置

> electron-vite + electron-builder，package.json / electron-builder.yml / winCodeSign 三板斧

## 项目结构

```text
.
├── build/                         图标等打包资源
├── resources/                     应用资源
├── src/
│   ├── main/                      主进程
│   ├── preload/                   预加载
│   └── renderer/                  渲染进程（Vue）
├── electron.vite.config.ts
├── electron-builder.yml           打包配置 ← 核心
└── package.json
```

## package.json 脚本

```json
{
  "scripts": {
    "postinstall": "electron-builder install-app-deps",
    "dev": "electron-vite dev",
    "build": "npm run typecheck && electron-vite build",
    "build:unpack": "npm run build && electron-builder --dir",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
  }
}
```

| 命令 | 输出 | 用途 |
| --- | --- | --- |
| `pnpm build` | `out/` | 编译，不打包 |
| `pnpm build:unpack` | `dist/win-unpacked/` | 免安装绿色版，本地验证 |
| `pnpm build:win` | `dist/xxx-setup.exe` | NSIS 安装包 |

## electron-builder.yml

electron-builder.yml 常见配置详解

```yaml
# =====================================================================
# 1. 基础应用信息配置
# =====================================================================
appId: "com.brainhealth.app"          # 应用程序唯一标识，对应 Windows 注册表和 Mac Bundle ID
productName: "标题"                # 安装后的应用快捷方式名称、软件名称

# =====================================================================
# 2. 文件打包与构建目录控制
# =====================================================================
directories:
  buildResources: "build"             # 指定打包构建资源（如图标、plist、nsh脚本）的存放目录
  output: "dist"                      # 打包完成后，生成的安装包存放的目录（默认就是 dist）

# 核心优化：定义哪些文件不需要被打包进最终的安装包中（黑名单机制）
# 使用 ! 前缀代表“排除”，能显著减小安装包体积并防止源码泄露
files:
  - "!**/.vscode/*"                   # 排除 IDE 配置文件
  - "!src/*"                          # 排除前端未编译的纯源码
  - "!electron.vite.config.{js,ts,mjs,cjs}" # 排除编译配置文件
  - "!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}" # 排除规范文件
  - "!{.env,.env.*,.npmrc,pnpm-lock.yaml}" # 排除敏感的环境变量及包管理器锁定文件
  - "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}" # 排除 TypeScript 配置文件

# 指定不压缩进 asar 虚拟文件系统的资源。通常存放外部调用的 .exe、.dll 或较大的多媒体资源
asarUnpack:
  - "resources/**"

# =====================================================================
# 3. Windows (Win) 系统打包配置
# =====================================================================
win:
  executableName: "name"      # 编译出的 .exe 主程序文件名（不带.exe后缀）
  icon: "resources/icon.png"          # 软件安装后以及在任务栏显示的图标
  target:
    - target: "nsis"                  # 指定打包目标为 NSIS 安装程序
      arch:
        - "x64"                       # 构建 64 位架构
        - "ia32"                      # 构建 32 位架构（如果需要兼容老电脑）

# =====================================================================
# 4. NSIS 安装向导配置（结合自定义 installer.nsh）
# =====================================================================
nsis:
  artifactName: "${name}-${version}-setup.${ext}" # 生成的安装包命名格式 (例如: brain-health-1.0.0-setup.exe)
  shortcutName: "${productName}"                  # 桌面及开始菜单快捷方式的名称
  uninstallDisplayName: "${productName}"          # 在 Windows “控制面板 -> 卸载程序”中显示的软件名称
  createDesktopShortcut: "always"                 # 是否总是创建桌面快捷方式
  oneClick: false                                 # 核心：关闭一键安装，启用标准的下一步向导模式
  perMachine: true                                # 核心：允许用户选择“为所有计算机用户安装”或“仅为当前用户安装”
  allowToChangeInstallationDirectory: true        # 核心：允许用户在向导中点击“浏览”自定义安装路径
  include: "build/installer.nsh"                  # 核心：引入你写的自定义 NSIS 补丁逻辑（比如开机自启页面）

# =====================================================================
# 5. macOS 系统打包配置
# =====================================================================
mac:
  icon: "resources/icon.png"                        # Mac 应用图标 (.icns 或高分辨率 .png)
  entitlementsInherit: "build/entitlements.mac.plist" # 继承的沙盒权限配置文件
  extendInfo:
    # 苹果隐私合规：当软件需要调用系统敏感权限时，弹窗提示用户的文案说明
    NSCameraUsageDescription: "Application requests access to the device's camera."          # 申请摄像头
    NSMicrophoneUsageDescription: "Application requests access to the device's microphone."  # 申请麦克风
    NSDocumentsFolderUsageDescription: "Application requests access to the user's Documents folder."   # 申请文档目录
    NSDownloadsFolderUsageDescription: "Application requests access to the user's Downloads folder."   # 申请下载目录
  notarize: false # 是否开启苹果官方公证 (如果没有付费的苹果开发者账号，这里必须设为 false)

# macOS 独有的磁盘映像 (.dmg) 安装包配置
dmg:
  artifactName: "${name}-${version}.${ext}"          # 生成的 .dmg 文件命名格式

# =====================================================================
# 6. Linux 系统打包配置
# =====================================================================
linux:
  icon: "resources/icon.png"
  target:
    - "AppImage"                      # 打包出免安装单文件格式
    - "deb"                           # 打包出 Ubuntu/Debian 体系格式
    - "snap"                          # 打包出通用沙盒格式
  maintainer: "electronjs.org"        # 维护者信息
  category: "Utility"                 # 软件在 Linux 应用市场中的分类（工具类）

# Linux AppImage 专有命名格式配置
appImage:
  artifactName: "${name}-${version}.${ext}"

# =====================================================================
# 7. 全局通用与发布高级配置
# =====================================================================
npmRebuild: false # 打包前是否重新强制编译 C++ 原生模块。设为 false 可以大幅缩短打包时间

# 电子软件自动更新（Auto-updater）的服务器配置
publish:
  provider: "generic"                         # 通用文件服务器模式
  url: "https://example.com/auto-updates"     # 软件检查更新的线上远程服务器地址

# 国内打包提速核心：指定 Electron 运行报文的下载镜像源，防止因为连接国外 GitHub 缓慢而导致打包卡死
electronDownload:
  mirror: "https://npmmirror.com/mirrors/electron/" # 切换为阿里云（淘宝）提供的 Electron 国内镜像源
```

简易版本:

```yml
appId: com.example.my-app
productName: my-app
directories:
  buildResources: build
  output: dist

files:
  - out/**/*
  - "!out/main/node_modules/**/*"

win:
  executableName: my-app
  icon: build/icon.ico          # 必须 .ico 格式
  target:
    - target: nsis
      arch:
        - x64

nsis:
  artifactName: ${name}-${version}-setup.${ext}
  shortcutName: ${productName}
  uninstallDisplayName: ${productName}
  createDesktopShortcut: always
  createStartMenuShortcut: true
  oneClick: false               # false = 走安装向导，允许选目录
  perMachine: true              # true = Program Files，false = AppData
  allowToChangeInstallationDirectory: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  deleteAppDataOnUninstall: true

mac:
  icon: build/icon.icns
  target:
    - target: dmg
      arch:
        - x64
        - arm64

linux:
  icon: build/icons
  target:
    - target: AppImage
      arch: [x64]
    - target: snap
      arch: [x64]
    - target: deb
      arch: [x64]
```

### NSIS 关键参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `oneClick` | `true` | `false` 才会出现安装向导 |
| `perMachine` | `false` | 机器级装到 Program Files，用户级装到 AppData |
| `allowToChangeInstallationDirectory` | `false` | 前提是 `oneClick: false` |
| `deleteAppDataOnUninstall` | `false` | 卸载时删不删 AppData |

## winCodeSign 预处理

> 首次 `pnpm build:win` 大概率这里卡住，提前手动搞。

1. 下载：`https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z`
2. 解压到：`C:\Users\<用户名>\AppData\Local\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\`

nsis 同理：`nsis-3.0.4.1.7z` → `Cache\nsis\nsis-3.0.4.1\`

> 版本号以实际报错为准。

## 常见问题

**winCodeSign / nsis 下载失败**

手动下载放到对应缓存目录。

**native 模块报错（better-sqlite3 等）**

```bash
npx electron-builder install-app-deps
```

**打包体积太大**

- `files` 里排除 `node_modules`、源码、测试文件
- 大文件（wasm 等）用 `extraResources` 别打进 asar

**Windows Defender 误报**

没签名代码的正常现象。买 EV Code Signing Certificate，在 `electron-builder.yml` 配 `win.certificateFile` + `win.certificatePassword`。
