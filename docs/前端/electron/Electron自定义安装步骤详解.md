# Electron 自定义安装步骤详解

> electron-builder + NSIS，从"一键装完"到"像正经软件一样安装"

## 为什么需要自定义安装

electron-builder 默认的 NSIS 安装行为是 **一键安装**（`oneClick: true`）：用户双击 exe，直接装到 `AppData` 目录，没有任何选项。

对于个人小工具这没问题，但商业软件或团队工具通常需要：

- ✅ 让用户选择安装目录
- ✅ 设置开机自启动
- ✅ 创建桌面 / 开始菜单快捷方式
- ✅ 自定义安装界面（Logo、许可协议）
- ✅ 注册自定义协议（`myapp://`）
- ✅ 安装完成后的自定义操作

## 基础配置：开启安装向导

第一步，把 `oneClick` 关掉，开启完整的安装向导：

```yml
# electron-builder.yml
appId: com.example.my-app
productName: MyApp

win:
  icon: build/icon.ico
  target:
    - target: nsis
      arch: [x64]

nsis:
  oneClick: false                          # 关闭一键安装，启用安装向导
  perMachine: true                         # 安装到 Program Files（需管理员权限）
  allowToChangeInstallationDirectory: true # 允许用户自选安装目录
  createDesktopShortcut: always            # 始终创建桌面快捷方式
  createStartMenuShortcut: true            # 创建开始菜单快捷方式
  shortcutName: MyApp                      # 快捷方式显示名称
  installerIcon: build/icon.ico            # 安装包图标
  uninstallerIcon: build/icon.ico          # 卸载程序图标
  installerHeaderIcon: build/icon.ico      # 安装向导头部图标
  deleteAppDataOnUninstall: true           # 卸载时清理 AppData
  artifactName: ${name}-${version}-setup.${ext}
```

### perMachine vs perUser

| 参数 | 安装位置 | 权限要求 | 适用场景 |
|------|----------|----------|----------|
| `perMachine: true` | `C:\Program Files\` | 需要管理员 | 企业软件、共享电脑 |
| `perMachine: false` | `C:\Users\<user>\AppData\` | 不需要 | 个人工具、免管理员场景 |

如果想让用户自己选，可以设置 `allowElevation: true`：

```yml
nsis:
  perMachine: false
  allowElevation: true  # 允许用户在安装时提升权限切换到 Program Files
```

## 设置开机自启动

开机自启有两种实现方式，根据需求选择。

### 方式一：Electron API（推荐）

在主进程中通过 `app.setLoginItemSettings` 控制，灵活且跨平台：

```ts
// src/main/index.ts
import { app } from 'electron'

// 设置开机自启
function setAutoLaunch(enable: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    // Windows 下以隐藏方式启动（配合窗口逻辑可以实现启动到托盘）
    args: enable ? ['--hidden'] : []
  })
}

// 查询当前状态
function getAutoLaunchStatus(): boolean {
  return app.getLoginItemSettings().openAtLogin
}
```

在渲染进程中通过 IPC 调用：

```ts
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status')
})
```

```ts
// src/main/index.ts
ipcMain.handle('set-auto-launch', (_event, enable: boolean) => {
  setAutoLaunch(enable)
})

ipcMain.handle('get-auto-launch-status', () => {
  return getAutoLaunchStatus()
})
```

```ts
// 渲染进程 - 设置页面组件
const isAutoLaunch = await window.electronAPI.getAutoLaunchStatus()

// 用户切换开关
async function toggleAutoLaunch(enable: boolean) {
  await window.electronAPI.setAutoLaunch(enable)
}
```

### 方式二：NSIS 安装时写注册表

在安装阶段直接写入注册表，用户装完就自动开机启动。需要自定义 NSIS 脚本：

```shell
# build/installer.nsh
!macro customInstall
  ; 写注册表设置开机自启
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
    "${PRODUCT_NAME}" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend

!macro customUnInstall
  ; 卸载时移除开机自启
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
    "${PRODUCT_NAME}"
!macroend
```

```yml
# electron-builder.yml
nsis:
  include: build/installer.nsh  # 引入自定义 NSIS 脚本
```

> 💡 推荐**方式一**，因为用户可以在应用设置中随时开关。方式二适合"默认必须自启"的场景。

### 隐藏启动 + 托盘模式

开机自启通常配合"启动到系统托盘"使用：

```ts
// src/main/index.ts
import { app, BrowserWindow, Tray, Menu } from 'electron'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createTray() {
  tray = new Tray('build/tray-icon.png')
  tray.setToolTip('MyApp')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '退出', click: () => app.quit() }
  ]))
  tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(() => {
  createTray()

  const isHidden = process.argv.includes('--hidden')

  mainWindow = new BrowserWindow({
    show: !isHidden,   // 如果带 --hidden 参数，创建窗口但不显示
    // ... 其他配置
  })

  // 点击关闭按钮时隐藏到托盘而不是退出
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })
})
```

## 自定义安装界面

### 添加许可协议

```yml
# electron-builder.yml
nsis:
  license: build/license.txt          # 纯文本协议文件
  # 或者用富文本
  # license: build/license.rtf
```

在 `build/` 目录下创建 `license.txt`：

```text
最终用户许可协议 (EULA)

本软件受版权保护。安装和使用本软件即表示您同意以下条款：

1. 许可授予
   我们授予您非排他性的使用许可...

2. 使用限制
   您不得对本软件进行反编译...

（根据实际需求编写）
```

### 多语言安装界面

NSIS 默认英文界面，想要中文或多语言：

```yml
nsis:
  language: 2052          # 简体中文的 LCID
  # 如果需要多语言选择
  multiLanguageInstaller: true
```

常用语言 LCID：

| 语言 | LCID |
|------|------|
| 简体中文 | 2052 |
| 繁体中文 | 1028 |
| 英语 | 1033 |
| 日语 | 1041 |

### 自定义安装页面（高级）

通过自定义 NSIS 脚本可以添加完整的安装页面，例如增加"勾选项"页面：

```shell
# build/installer.nsh
!include "MUI2.nsh"
!include "nsDialogs.nsh"

Var Checkbox_AutoStart
Var Checkbox_DesktopIcon
Var CheckState_AutoStart
Var CheckState_DesktopIcon

; 创建自定义安装页面
!macro customPageAfterChangeDir
  ; 在选择目录后插入自定义页面
  Page custom CustomOptionsPage CustomOptionsPageLeave
!macroend

Function CustomOptionsPage
  !insertmacro MUI_HEADER_TEXT "安装选项" "请选择附加安装选项"

  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateCheckbox} 0 0 100% 12u "开机自动启动"
  Pop $Checkbox_AutoStart
  ${NSD_Check} $Checkbox_AutoStart   ; 默认勾选

  ${NSD_CreateCheckbox} 0 20u 100% 12u "创建桌面快捷方式"
  Pop $Checkbox_DesktopIcon
  ${NSD_Check} $Checkbox_DesktopIcon ; 默认勾选

  nsDialogs::Show
FunctionEnd

Function CustomOptionsPageLeave
  ${NSD_GetState} $Checkbox_AutoStart $CheckState_AutoStart
  ${NSD_GetState} $Checkbox_DesktopIcon $CheckState_DesktopIcon
FunctionEnd

!macro customInstall
  ; 根据勾选状态执行操作
  ${If} $CheckState_AutoStart == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" \
      "${PRODUCT_NAME}" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${EndIf}

  ${If} $CheckState_DesktopIcon == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${EndIf}
!macroend
```

## 注册自定义协议

让系统识别 `myapp://xxx` 链接并打开你的应用：

### electron-builder 配置

```yml
# electron-builder.yml
protocols:
  - name: MyApp Protocol
    schemes:
      - myapp
```

### 主进程处理协议

```ts
// src/main/index.ts
import { app } from 'electron'

// 设置为默认协议处理器
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('myapp', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('myapp')
}

// Windows 下处理协议调用（单实例模式）
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // commandLine 是个数组，最后一个元素通常是协议 URL
    const url = commandLine.find(arg => arg.startsWith('myapp://'))
    if (url) {
      handleProtocolUrl(url)
    }

    // 如果窗口最小化了，恢复并聚焦
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function handleProtocolUrl(url: string) {
  // 解析 myapp://action/param 并执行对应逻辑
  const parsed = new URL(url)
  console.log('协议调用:', parsed.hostname, parsed.pathname)
  // 比如 myapp://open/document?id=123
}
```

## 安装完成后的操作

### 安装后自动启动应用

```yml
nsis:
  runAfterFinish: true   # 安装完成后运行应用（默认就是 true）
```

### NSIS 脚本：安装后执行自定义操作

```shell
# build/installer.nsh
!macro customInstall
  ; 创建应用数据目录
  CreateDirectory "$APPDATA\${PRODUCT_NAME}"

  ; 写入初始配置文件
  FileOpen $0 "$APPDATA\${PRODUCT_NAME}\config.json" w
  FileWrite $0 '{"initialized": true, "version": "${VERSION}"}'
  FileClose $0

  ; 注册防火墙规则（需要管理员权限）
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="${PRODUCT_NAME}" dir=in action=allow program="$INSTDIR\${APP_EXECUTABLE_FILENAME}" enable=yes'
!macroend
```

## 卸载时清理

```shell
# build/installer.nsh
!macro customUnInstall
  ; 移除开机自启注册表
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"

  ; 删除应用数据
  RMDir /r "$APPDATA\${PRODUCT_NAME}"

  ; 移除防火墙规则
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="${PRODUCT_NAME}"'

  ; 清理注册表中的协议注册
  DeleteRegKey HKCU "Software\Classes\myapp"
!macroend
```

## 完整配置示例

一个包含所有自定义安装功能的 `electron-builder.yml`：

```yml
appId: com.example.my-app
productName: MyApp
directories:
  buildResources: build
  output: dist

files:
  - out/**/*
  - "!out/main/node_modules/**/*"

protocols:
  - name: MyApp Protocol
    schemes:
      - myapp

win:
  executableName: my-app
  icon: build/icon.ico
  target:
    - target: nsis
      arch: [x64]
  # 请求管理员权限（写 Program Files 和注册表需要）
  requestedExecutionLevel: requireAdministrator

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  allowElevation: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: MyApp
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  deleteAppDataOnUninstall: true
  license: build/license.txt
  language: 2052
  include: build/installer.nsh
  runAfterFinish: true
  artifactName: ${name}-${version}-setup.${ext}
  uninstallDisplayName: MyApp ${version}
```

对应的项目目录结构：

```text
build/
├── icon.ico              应用图标
├── icon.icns             macOS 图标
├── license.txt           许可协议
├── installer.nsh         自定义 NSIS 脚本
└── tray-icon.png         托盘图标
```

## NSIS 脚本常用变量

在 `installer.nsh` 中可以直接使用的变量：

| 变量 | 含义 | 示例值 |
|------|------|--------|
| `$INSTDIR` | 安装目录 | `C:\Program Files\MyApp` |
| `$APPDATA` | 用户 AppData/Roaming | `C:\Users\xxx\AppData\Roaming` |
| `$LOCALAPPDATA` | 用户 AppData/Local | `C:\Users\xxx\AppData\Local` |
| `$DESKTOP` | 桌面路径 | `C:\Users\xxx\Desktop` |
| `$SMPROGRAMS` | 开始菜单程序目录 | `C:\Users\xxx\...\Programs` |
| `${PRODUCT_NAME}` | 产品名 | `MyApp` |
| `${APP_EXECUTABLE_FILENAME}` | 可执行文件名 | `my-app.exe` |
| `${VERSION}` | 版本号 | `1.0.0` |

## 踩坑提醒

### 1. `allowToChangeInstallationDirectory` 必须搭配 `oneClick: false`

一键安装模式下这个选项无效，用户根本看不到目录选择界面。

### 2. perMachine + UAC

`perMachine: true` 会触发 Windows UAC 弹窗请求管理员权限。如果你的目标用户群体没有管理员权限（比如企业受控电脑），考虑用 `perMachine: false`。

### 3. 自定义 NSIS 脚本的编码

`installer.nsh` 文件必须用 **UTF-8 with BOM** 编码保存，否则中文会乱码。

### 4. `app.setLoginItemSettings` 打包后路径问题

开发模式下 `app.setLoginItemSettings` 会注册 Electron 可执行文件而不是你的应用。只在打包后的生产环境中使用：

```ts
if (app.isPackaged) {
  app.setLoginItemSettings({ openAtLogin: true })
}
```

### 5. 自定义协议在开发模式下的注册

开发模式需要特殊处理：

```ts
if (process.defaultApp) {
  // 开发模式：需要把 electron 可执行文件和脚本路径传进去
  app.setAsDefaultProtocolClient('myapp', process.execPath, [
    path.resolve(process.argv[1])
  ])
} else {
  // 生产模式：直接注册
  app.setAsDefaultProtocolClient('myapp')
}
```

## 参考

- [electron-builder NSIS 配置](https://www.electron.build/nsis)
- [Electron app.setLoginItemSettings](https://www.electronjs.org/zh/docs/latest/api/app#appsetloginitemsettingssettings)
- [NSIS 脚本参考](https://nsis.sourceforge.io/Docs/)
