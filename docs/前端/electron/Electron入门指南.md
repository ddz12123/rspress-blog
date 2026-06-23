# Electron 入门指南

> Chromium + Node.js，用 Web 技术开发桌面应用。

## 核心概念

### 两个进程

| 进程 | 职责 | 环境 |
| --- | --- | --- |
| **主进程 (Main)** | 创建窗口、读写文件、调系统 API、托盘、菜单 | Node.js，只有 1 个 |
| **渲染进程 (Renderer)** | 显示 UI、用户交互 | 浏览器，每个窗口 1 个 |

渲染进程不能直接碰 Node.js，想用得通过 IPC 让主进程帮忙。

### Preload 脚本

连接两个进程的桥梁。运行在渲染进程里，但有 Node.js 能力，只暴露你允许的方法。

```text
渲染进程              Preload              主进程
    │                    │                   │
    │  window.api.xxx()  │                   │
    │  ──────────────→   │  invoke()         │
    │                    │  ───────────────→ │
    │  ←──────────────   │  ←─────────────── │
```

需要它的原因：

- 安全：不让网页 JS 直接调 Node.js
- 隔离：`contextIsolation: true` 让 preload 和页面 JS 运行在不同上下文
- 只暴露你允许的方法，不暴露整个 ipcRenderer

### IPC 通信方式

| 场景 | 主进程 | 渲染进程 | 等结果 |
| --- | --- | --- | --- |
| 拿数据/执行操作 | `ipcMain.handle(ch, fn)` | `ipcRenderer.invoke(ch, args)` | ✅ 等 |
| 发通知/触发操作 | `ipcMain.on(ch, fn)` | `ipcRenderer.send(ch, args)` | ❌ 不等 |
| 主进程主动推消息 | `win.webContents.send(ch, data)` | `ipcRenderer.on(ch, callback)` | - |

## 快速开始

```bash
npm create @quick-start/electron my-app
cd my-app && npm install && npm run dev
```

## BrowserWindow 配置

```js
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,           // 最小宽度
  minHeight: 600,          // 最小高度
  title: '我的应用',
  icon: 'icon.png',
  show: false,             // 先隐藏，加载完再显示
  frame: true,             // 是否显示标题栏
  alwaysOnTop: false,      // 是否置顶
  fullscreen: false,
  resizable: true,

  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,   // 开启上下文隔离（默认 true）
    nodeIntegration: false,   // 关闭 Node.js 集成（默认 false）
    webSecurity: true         // 开启 web 安全（默认 true）
  }
})

// 加载完再显示，避免白屏
win.once('ready-to-show', () => win.show())
```

## 常用 API

### app 应用生命周期

```js
const { app } = require('electron')

app.whenReady()           // 应用准备好
app.quit()                // 退出应用
app.getVersion()          // 获取版本号
app.getName()             // 获取应用名
app.getPath('userData')   // 用户数据目录（存配置用这个）
app.getPath('desktop')    // 桌面路径
app.getPath('downloads')  // 下载目录
app.isPackaged()          // 是否打包后运行
```

### 窗口操作

```js
const win = new BrowserWindow({ ... })

win.loadFile('index.html')              // 加载本地文件
win.loadURL('https://example.com')      // 加载远程 URL
win.setTitle('新标题')
win.setSize(1024, 768)
win.center()                            // 居中
win.minimize()                          // 最小化
win.maximize()                          // 最大化
win.close()                             // 关闭
win.webContents.openDevTools()          // 打开开发者工具
```

### 对话框

```js
const { dialog } = require('electron')

// 打开文件选择框
const result = await dialog.showOpenDialog({
  properties: ['openFile'],
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'All Files', extensions: ['*'] }
  ]
})
console.log(result.filePaths) // 选中的文件路径数组

// 保存文件框
const saveResult = await dialog.showSaveDialog({
  defaultPath: 'untitled.txt',
  filters: [{ name: 'Text', extensions: ['txt'] }]
})

// 消息弹窗
await dialog.showMessageBox({
  type: 'info',       // 'info' | 'warning' | 'error' | 'question'
  title: '提示',
  message: '操作成功',
  buttons: ['确定']
})
```

### 系统托盘

```js
const { Tray, Menu, nativeImage } = require('electron')

const icon = nativeImage.createFromPath('tray-icon.png')
const tray = new Tray(icon)

const contextMenu = Menu.buildFromTemplate([
  { label: '显示窗口', click: () => win.show() },
  { type: 'separator' },
  { label: '退出', click: () => app.quit() }
])

tray.setToolTip('我的应用')
tray.setContextMenu(contextMenu)
tray.on('click', () => win.show()) // 点击托盘图标显示窗口
```

### 全局快捷键

```js
const { globalShortcut } = require('electron')

app.whenReady().then(() => {
  const ret = globalShortcut.register('CommandOrControl+Shift+I', () => {
    win.webContents.toggleDevTools()
  })
  if (!ret) console.log('快捷键注册失败')
})

// 退出时注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

### 剪贴板

```js
const { clipboard } = require('electron')

clipboard.writeText('Hello')      // 写入文本
const text = clipboard.readText()  // 读取文本
clipboard.writeImage(nativeImage)  // 写入图片
const img = clipboard.readImage()  // 读取图片
```

### 菜单

```js
const { Menu } = require('electron')

const template = [
  {
    label: '文件',
    submenu: [
      { label: '打开', accelerator: 'CmdOrCtrl+O', click: () => {} },
      { type: 'separator' },
      { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
    ]
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
```

## electron-vite 项目结构

```text
src/
├── main/              ← 主进程代码
│   └── index.ts
├── preload/           ← preload 脚本
│   └── index.ts
└── renderer/          ← 渲染进程代码（Vue/React）
    ├── src/
    │   ├── App.vue
    │   └── main.ts
    └── index.html
```

**src/main/index.ts：**

```ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
```

**src/preload/index.ts：**

```ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getVersion: () => ipcRenderer.invoke('get-version'),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  onMessage: (callback: (data: any) => void) => {
    ipcRenderer.on('message', (_e, data) => callback(data))
  }
}

contextBridge.exposeInMainWorld('api', api)
export type ElectronAPI = typeof api
```

**Vue 组件中使用：**

```vue
<script setup lang="ts">
declare global {
  interface Window {
    api: ElectronAPI
  }
}

const handleClick = async () => {
  const version = await window.api.getVersion()
  console.log('版本号:', version)
}
</script>
```

## 踩坑记录 ⚠️

### 1. 别暴露整个 ipcRenderer

```js
// ❌ 危险！页面里任何 JS 都能调任意 IPC
contextBridge.exposeInMainWorld('api', ipcRenderer)

// ✅ 只暴露需要的方法
contextBridge.exposeInMainWorld('api', {
  getVersion: () => ipcRenderer.invoke('get-version')
})
```

### 2. 别用 sendSync

`ipcRenderer.sendSync()` 会阻塞整个渲染进程，页面卡死。永远用 `invoke` 代替。

### 3. 监听器要清理

`ipcRenderer.on` 注册的监听器，组件销毁时要移除，不然内存泄漏：

```js
// preload 暴露清理方法
contextBridge.exposeInMainWorld('api', {
  onProgress: (callback) => {
    ipcRenderer.on('progress', (_e, data) => callback(data))
  },
  offProgress: () => {
    ipcRenderer.removeAllListeners('progress')
  }
})

// Vue 组件
onMounted(() => window.api.onProgress(updateUI))
onUnmounted(() => window.api.offProgress())
```

### 4. 打包后 __dirname 不对

开发时 `__dirname` 指向源码目录，打包后指向打包目录。用户数据用 `app.getPath('userData')`：

```js
const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config.json')
```

### 5. 安全配置别忘

```js
webPreferences: {
  contextIsolation: true,   // ✅ 开启
  nodeIntegration: false,   // ✅ 关闭
  webSecurity: true         // ✅ 开启
}
```

### 6. macOS 和 Windows 差异

```js
// macOS 关闭窗口不退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// macOS 点击 dock 图标重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```
