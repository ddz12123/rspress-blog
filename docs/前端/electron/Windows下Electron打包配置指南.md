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
