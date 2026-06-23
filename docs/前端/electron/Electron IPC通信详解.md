# Electron IPC 通信详解

> IPC = 进程间通信。主进程和渲染进程是隔离的，想交流就得通过 IPC。

## 先分清两个进程

| 进程 | 干什么的 | 能做什么 |
| --- | --- | --- |
| **主进程 (Main)** | 应用大管家 | 读写文件、调系统 API、创建窗口、托盘、菜单 |
| **渲染进程 (Renderer)** | 每个窗口一个，管页面 | DOM 操作、用户交互、发请求给主进程 |

**重点**：渲染进程跑在浏览器环境，不能直接碰 Node.js 和系统资源。想用？通过 IPC 让主进程帮忙。

## 为什么需要 preload？

如果直接在渲染进程里 `require('electron')` 用 `ipcRenderer`：

1. **不安全**：网页里的恶意脚本也能调 IPC
2. **Electron 默认禁止**：`contextIsolation: true`、`nodeIntegration: false`

**解决方案**：用 preload 做中间人，只暴露你允许的方法：

```text
渲染进程                    preload.js                    主进程
    │                          │                            │
    │  window.electronAPI.xxx  │                            │
    │  ─────────────────────→  │  ipcRenderer.invoke()      │
    │                          │  ────────────────────────→  │
    │                          │  ←────────────────────────  │
    │  ←─────────────────────  │                            │
```

## 三种通信方式

### 1. invoke/handle —— 双向通信 ⭐ 最常用

**场景**：渲染进程需要从主进程拿数据或执行操作，还要等结果回来。

**例子**：读取文件、获取版本号、调用系统 API

**主进程 main.js：**

```js
const { ipcMain } = require('electron')
const fs = require('fs/promises')

// 注册处理器，返回值就是渲染进程拿到的结果
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
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
})
```

**渲染进程（页面 JS）：**

```js
// 像调普通函数一样，返回 Promise
const result = await window.electronAPI.readFile('/path/to/file.txt')
if (result.success) {
  console.log(result.data)
}

const version = await window.electronAPI.getAppVersion()
```

### 2. send/on —— 单向通信

**场景**：只管发，不等回复。适合日志、通知、触发操作。

**例子**：记录日志、窗口最小化

**主进程 main.js：**

```js
ipcMain.on('log-message', (_event, level, message) => {
  console.log(`[${level}] ${message}`)
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

### 3. 主进程主动推送

**场景**：主进程有新消息要告诉渲染进程。

**例子**：下载进度、系统通知、后台任务完成

**主进程 main.js：**

```js
// 推送下载进度
ipcMain.handle('start-download', async (event, url) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  for (let i = 0; i <= 100; i += 10) {
    await new Promise(r => setTimeout(r, 200))
    win.webContents.send('download-progress', { percent: i })
  }

  return { success: true }
})
```

**preload.js：**

```js
contextBridge.exposeInMainWorld('electronAPI', {
  startDownload: (url) => ipcRenderer.invoke('start-download', url),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_e, data) => callback(data))
  }
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

## electron-vite 项目结构

```text
src/
├── main/          ← 主进程
│   └── index.ts
├── preload/       ← 预加载脚本
│   └── index.ts
└── renderer/      ← 渲染进程（Vue/React）
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

// 导出类型，给渲染进程用
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

**Vue/React 组件中使用：**

```ts
// 声明类型，让 TS 有提示
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

## 踩坑记录 ⚠️

### 1. 监听器要清理

`ipcRenderer.on` 注册的监听器，组件销毁时要移除，不然内存泄漏：

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

### 2. 别暴露整个 ipcRenderer

```js
// ❌ 危险！渲染进程可以调任何 IPC 通道
contextBridge.exposeInMainWorld('electronAPI', ipcRenderer)

// ✅ 只暴露需要的方法
contextBridge.exposeInMainWorld('electronAPI', {
  specificMethod: (args) => ipcRenderer.invoke('specific-channel', args)
})
```

### 3. 别用 sendSync

`ipcRenderer.sendSync()` 会阻塞整个渲染进程，页面卡死。永远用 `invoke` 代替。

### 4. handle 的错误处理

`ipcMain.handle` 里 throw 的错误，会在 `ipcRenderer.invoke` 那边变成 rejected Promise：

```js
// 主进程
ipcMain.handle('risky-operation', async () => {
  if (Math.random() > 0.5) {
    throw new Error('操作失败')
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

| 我想干什么 | 渲染进程 | 主进程 | 要等结果吗 |
| --- | --- | --- | --- |
| 拿数据/执行操作 | `invoke(channel, args)` | `handle(channel, handler)` | ✅ 等 |
| 发通知/触发操作 | `send(channel, args)` | `on(channel, handler)` | ❌ 不等 |
| 主进程推消息过来 | `on(channel, callback)` | `webContents.send(channel, data)` | - |

## 记忆口诀

1. **双向通信用 invoke/handle**：渲染进程要拿数据，主进程处理后返回
2. **单向发信用 send/on**：只管发，不等回复
3. **主进程反向推用 webContents.send**：主进程主动通知渲染进程
4. **安全第一用 preload**：别暴露整个 ipcRenderer，只暴露需要的方法

## 参考

- [Electron 官方 IPC 文档](https://www.electronjs.org/zh/docs/latest/tutorial/ipc)
