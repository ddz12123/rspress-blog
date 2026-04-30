# Electron IPC 通信详解

> 进程间通信（IPC）是 Electron 开发的核心，搞懂它才能让主进程和渲染进程配合干活

## 先搞清楚两个角色

Electron 应用有两个进程，理解 IPC 之前必须先分清它们：

| 进程 | 职责 | 能做的事 |
|------|------|----------|
| **主进程 (Main)** | 应用入口，管理窗口、系统API | 操作文件、调用系统API、创建窗口 |
| **渲染进程 (Renderer)** | 每个窗口一个，负责页面UI | DOM操作、用户交互、页面渲染 |

关键点：**渲染进程不能直接访问 Node.js API 和系统资源**，想干这些事必须通过 IPC 请主进程帮忙。

## 三种通信模式

```
┌─────────────┐                    ┌─────────────┐
│  渲染进程    │  ── invoke ──→    │  主进程      │
│  (Renderer) │  ←── return ──    │  (Main)      │
│             │                    │              │
│             │  ── send ────→    │              │
│             │                    │              │
│             │  ←── send ────    │              │
└─────────────┘                    └─────────────┘
```

### 模式一：渲染 → 主进程（双向，推荐）

`ipcRenderer.invoke()` + `ipcMain.handle()` —— 最常用的模式，渲染进程发请求，主进程处理后返回结果。

### 模式二：渲染 → 主进程（单向）

`ipcRenderer.send()` + `ipcMain.on()` —— 只管发，不等回复。适合通知类场景。

### 模式三：主进程 → 渲染进程

`webContents.send()` + `ipcRenderer.on()` —— 主进程主动推送消息给渲染进程。

## 安全架构：preload + contextBridge

直接在渲染进程里用 `ipcRenderer` 是不安全的。正确做法是通过 **预加载脚本（preload）** 暴露有限的 API：

```
渲染进程 ──→ window.electronAPI ──→ preload.js ──→ ipcRenderer ──→ 主进程
```

### preload.js

```js
const { contextBridge, ipcRenderer } = require('electron')

// 只暴露需要的方法，不要把整个 ipcRenderer 暴露出去
contextBridge.exposeInMainWorld('electronAPI', {
  // 双向通信
  getData: (params) => ipcRenderer.invoke('get-data', params),

  // 单向发送
  sendMessage: (msg) => ipcRenderer.send('send-message', msg),

  // 监听主进程推送
  onUpdate: (callback) => ipcRenderer.on('update-info', (_event, data) => callback(data))
})
```

### main.js（主进程）

```js
const { ipcMain, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 这两个必须保持 false，安全底线
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.loadFile('index.html')
}
```

## 实战：三种模式完整示例

### 1. invoke / handle（双向通信）

最推荐的方式，渲染进程发请求，主进程处理后返回结果，基于 Promise。

**主进程 main.js：**

```js
const { ipcMain } = require('electron')
const fs = require('fs/promises')

// handle 注册处理器，返回值会作为 invoke 的 Promise 结果
ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, data: content }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
```

**preload.js：**

```js
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
})
```

**渲染进程（页面JS）：**

```js
// 像调普通函数一样用，返回 Promise
const result = await window.electronAPI.readFile('/path/to/file.txt')
if (result.success) {
  console.log(result.data)
}

const version = await window.electronAPI.getAppVersion()
console.log('版本号:', version)
```

### 2. send / on（单向通信）

渲染进程只管发，不等回复。适合日志上报、触发操作等不需要返回值的场景。

**主进程 main.js：**

```js
ipcMain.on('log-message', (_event, level, message) => {
  console.log(`[${level}] ${message}`)
  // 如果真需要回复，可以用 event.reply
  // _event.reply('log-ack', 'received')
})

ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
```

**preload.js：**

```js
contextBridge.exposeInMainWorld('electronAPI', {
  logMessage: (level, msg) => ipcRenderer.send('log-message', level, msg),
  minimizeWindow: () => ipcRenderer.send('window-minimize')
})
```

**渲染进程：**

```js
window.electronAPI.logMessage('info', '用户点击了按钮')
window.electronAPI.minimizeWindow()
```

### 3. 主进程 → 渲染进程（主动推送）

主进程有消息要通知渲染进程时使用，比如下载进度、系统通知。

**主进程 main.js：**

```js
function sendToRenderer(win, channel, data) {
  win.webContents.send(channel, data)
}

// 示例：推送下载进度
ipcMain.handle('start-download', async (event, url) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  // 模拟下载，推送进度
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(r => setTimeout(r, 200))
    sendToRenderer(win, 'download-progress', { percent: i })
  }

  return { success: true }
})
```

**preload.js：**

```js
contextBridge.exposeInMainWorld('electronAPI', {
  startDownload: (url) => ipcRenderer.invoke('start-download', url),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_e, data) => callback(data))
})
```

**渲染进程：**

```js
// 监听进度
window.electronAPI.onDownloadProgress((data) => {
  progressBar.style.width = `${data.percent}%`
})

// 触发下载
await window.electronAPI.startDownload('https://example.com/file.zip')
```

## electron-vite 项目中的写法

如果你用 electron-vite 脚手架，项目结构一般是：

```
src/
├── main/          主进程
│   └── index.ts
├── preload/       预加载脚本
│   └── index.ts
└── renderer/      渲染进程（Vue/React）
    └── src/
```

**src/preload/index.ts：**

```ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  onMessage: (callback: (data: any) => void) => {
    ipcRenderer.on('message', (_e, data) => callback(data))
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

// 类型声明
export type ElectronAPI = typeof api
```

**src/main/index.ts：**

```ts
import { ipcMain } from 'electron'
import fs from 'fs/promises'

ipcMain.handle('read-file', async (_event, filePath: string) => {
  return await fs.readFile(filePath, 'utf-8')
})
```

**在 Vue/React 组件中使用：**

```ts
// 声明类型，获得 TS 提示
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// 使用
const content = await window.electronAPI.readFile('./config.json')
window.electronAPI.onMessage((data) => {
  console.log('收到主进程消息:', data)
})
```

## 踩坑提醒

### 1. 监听器要记得清理

渲染进程中用 `ipcRenderer.on` 注册的监听器，组件销毁时要移除，否则会内存泄漏：

```js
// preload 暴露清理方法
contextBridge.exposeInMainWorld('electronAPI', {
  onProgress: (callback) => {
    ipcRenderer.on('progress', (_e, data) => callback(data))
  },
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('progress')
  }
})
```

```js
// Vue 组件中
onMounted(() => {
  window.electronAPI.onProgress(updateUI)
})
onUnmounted(() => {
  window.electronAPI.removeProgressListener()
})
```

### 2. 不要暴露整个 ipcRenderer

```js
// ❌ 危险！渲染进程可以调用任何 IPC 通道
contextBridge.exposeInMainWorld('electronAPI', ipcRenderer)

// ✅ 只暴露需要的方法
contextBridge.exposeInMainWorld('electronAPI', {
  specificMethod: (args) => ipcRenderer.invoke('specific-channel', args)
})
```

### 3. 不要用 sendSync

`ipcRenderer.sendSync()` 会阻塞渲染进程，用户体验极差。永远用 `invoke` 代替。

### 4. handle 的错误处理

`ipcMain.handle` 里抛出的错误会在 `ipcRenderer.invoke` 那边变成 rejected Promise：

```js
// 主进程
ipcMain.handle('risky-operation', async () => {
  if (Math.random() > 0.5) {
    throw new Error('操作失败')  // invoke 会收到 rejected Promise
  }
  return '成功'
})

// 渲染进程
try {
  const result = await window.electronAPI.riskyOperation()
} catch (err) {
  console.error('操作失败:', err.message)
}
```

## 速查表

| 场景 | 渲染进程 | 主进程 | 是否等待返回 |
|------|----------|--------|-------------|
| 获取数据 | `invoke(channel, ...args)` | `handle(channel, handler)` | ✅ 等待 |
| 发通知 | `send(channel, ...args)` | `on(channel, handler)` | ❌ 不等 |
| 主进程推送 | `on(channel, callback)` | `webContents.send(channel, data)` | - |
| ~~同步调用~~ | ~~`sendSync()`~~ | ~~`on()`~~ | ~~❌ 阻塞，别用~~ |

## 参考

- [Electron 官方 IPC 文档](https://www.electronjs.org/zh/docs/latest/tutorial/ipc)
