# Electron 自动更新升级

:::tip 一句话总结
Electron 自动更新基于 `electron-updater` 实现，核心流程是：应用启动 → 检查更新服务器上的 `latest.yml` → 对比版本号 → 下载新安装包 → 重启生效。
:::

## 一、自动更新是怎么回事

Electron 的自动更新不是"热更新"，而是**下载新的安装包，静默安装后重启**。整个过程用户基本无感：

```
应用启动
  ↓
去更新服务器下载 latest.yml，读取里面的版本号
  ↓
latest.yml 的版本号 > 当前应用版本号  →  有新版本，下载安装包
latest.yml 的版本号 <= 当前应用版本号 →  没有新版本，什么都不做
  ↓
下载完成 → 提示用户重启（或静默安装）
  ↓
重启后新版本生效
```

**版本号从哪来？** 就是你 `package.json` 里的 `version` 字段。打包时 electron-builder 会把它写进安装包，同时自动生成 `latest.yml` 文件记录这个版本号。

```json title="package.json"
{
  "name": "myapp",
  "version": "1.0.0"   // ← 这个就是"当前版本"
}
```

```yaml title="latest.yml（打包时自动生成）"
version: 1.0.1   // ← electron-updater 拿这个和当前版本对比
files:
  - url: MyApp-1.0.1-setup.exe
    sha512: xxxx==
    size: 68000000
```

:::warning 最常见的坑
每次发新版一定要改 `package.json` 的 `version`，否则服务器上和用户本地版本号一样，永远收不到更新。
:::

### 1.1 为什么用 electron-updater

| 方案 | 说明 |
|------|------|
| `electron-updater` | electron-builder 生态的一部分，功能全面，**推荐** |
| `autoUpdater`（Squirrel） | Electron 官方方案，仅支持 macOS，Windows 端已废弃 |

### 1.2 更新包放在哪

你需要一个地方来托管 `latest.yml` 和安装包文件，常见选择：

| 方案 | 成本 | 下载速度（国内） | 适合 |
|------|------|-----------------|------|
| GitHub Releases | 免费 | 慢，可能超时 | 开源项目 |
| 阿里云 OSS / 腾讯 COS | 每月几毛钱 | 快 | 国内商业项目 |
| 自建服务器 | 有运维成本 | 取决于服务器 | 企业内网 |

后面会分别讲 GitHub Releases 和阿里云 OSS 两种方式的完整操作步骤。

## 二、项目说明

本文基于 **electron-vite** 搭建的项目，项目结构如下：

```
src/
├── main/           ← 主进程代码（更新逻辑写在这里）
│   └── index.ts
├── preload/        ← 预加载脚本
│   └── index.ts
└── renderer/       ← 渲染进程（Vue/React 页面）
    └── ...
```

electron-vite 负责编译源码，electron-builder 负责打包成安装包，两者配合工作：

```
pnpm run build:win
  ↓
electron-vite build      → 编译 src/ 下的代码到 dist/
  ↓
electron-builder --win   → 把 dist/ 打包成 .exe 安装包
```

## 三、安装依赖

```bash
pnpm add electron-updater
```

`electron-updater` 是 electron-builder 的子项目，如果你已经装了 electron-builder 就不需要额外装了。

## 四、配置更新源（二选一）

这一步是告诉 electron-updater **去哪找 `latest.yml`**，在 electron-builder 的配置文件里写：

### 方式一：GitHub Releases

```js title="electron-builder.config.mjs"
export default {
  publish: {
    provider: 'github',
    owner: 'your-username',   // GitHub 用户名
    repo: 'your-repo',        // 仓库名
    releaseType: 'release',   // 只用正式版
  },
}
```

`owner` 和 `repo` 就是仓库地址里的两部分：

```
https://github.com/your-username/your-repo
                    ^^^^^^^^^^^  ^^^^^^^^
                    owner        repo
```

### 方式二：阿里云 OSS

```js title="electron-builder.config.mjs"
export default {
  publish: {
    provider: 'generic',
    url: 'https://myapp-releases.oss-cn-hangzhou.aliyuncs.com/releases/win/',
  },
}
```

`url` 必须包含平台目录（`win/`），因为 electron-updater 会直接在后面拼 `latest.yml` 去请求：

```
你配置的:  https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/
实际请求:  https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/latest.yml
```

两种方式的区别和详细操作步骤见 [第九章](#九、github-releases-完整操作) 和 [第十章](#十、阿里云-oss-完整操作)。

## 五、主进程：实现更新逻辑

配置完更新源，接下来在主进程写更新代码。

### 5.1 完整代码

```ts title="src/main/updater.ts"
import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import log from 'electron-log'

// 配置日志，方便排查问题
autoUpdater.logger = log

// 不自动下载，让用户确认后再下载
autoUpdater.autoDownload = false

// 退出时自动安装（用户关掉应用时悄悄装好，下次打开就是新版）
autoUpdater.autoInstallOnAppQuit = true

export function setupUpdater(mainWindow: BrowserWindow) {
  // ========================
  // 1. 发起更新检查
  // ========================
  autoUpdater.checkForUpdates().catch((err) => {
    log.error('检查更新失败:', err)
  })

  // ========================
  // 2. 监听更新事件
  // ========================

  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info.version)

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `新版本 ${info.version} 已发布，是否立即下载？`,
      buttons: ['下载', '稍后再说'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // 已经是最新版本（可选，一般不提示用户）
  autoUpdater.on('update-not-available', () => {
    log.info('当前已是最新版本')
  })

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    log.info(`下载进度: ${percent}%`)
    // 通知渲染进程显示进度条
    mainWindow.webContents.send('update-download-progress', percent)
  })

  // 下载完成
  autoUpdater.on('update-downloaded', () => {
    log.info('更新下载完成')

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新就绪',
      message: '新版本已下载完成，重启应用即可生效。',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  // 更新出错
  autoUpdater.on('error', (err) => {
    log.error('更新出错:', err)
    dialog.showErrorBox('更新错误', `检查更新时出错：${err.message}`)
  })
}
```

### 5.2 在入口文件中调用

```ts title="src/main/index.ts"
import { app, BrowserWindow } from 'electron'
import { setupUpdater } from './updater'

let mainWindow: BrowserWindow

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({ /* ... */ })

  // 延迟 3 秒检查，不阻塞启动
  setTimeout(() => {
    setupUpdater(mainWindow)
  }, 3000)
})
```

### 5.3 开发环境跳过更新

开发时 `app.isPackaged` 为 `false`，加个判断就行：

```ts
if (!app.isPackaged) {
  console.log('[updater] 开发环境，跳过更新检查')
  return
}
```

### 5.4 autoUpdater 常用配置项速览

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `autoDownload` | `true` | 发现新版本是否自动下载 |
| `autoInstallOnAppQuit` | `true` | 退出应用时自动安装 |
| `allowDowngrade` | `false` | 是否允许降级（服务器版本比本地低） |
| `logger` | `null` | 日志对象，推荐用 `electron-log` |

### 5.5 autoUpdater 事件速览

| 事件 | 触发时机 | 常用操作 |
|------|----------|----------|
| `checking-for-update` | 开始检查更新 | 显示 loading |
| `update-available` | 发现新版本 | 弹窗询问用户 |
| `update-not-available` | 没有新版本 | 一般不处理 |
| `download-progress` | 下载进度变化 | 更新进度条 |
| `update-downloaded` | 下载完成 | 提示用户重启 |
| `error` | 出错 | 显示错误信息 |

## 六、渲染进程：自定义更新 UI

默认的 `dialog.showMessageBox` 弹窗很丑，实际项目通常自己画 UI。思路是把更新操作通过 IPC 暴露给渲染进程。

### 6.1 preload 暴露 API

```ts title="src/preload/index.ts"
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 手动检查更新
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  // 监听下载进度
  onDownloadProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update-download-progress', (_, percent) => callback(percent))
  },
  // 立即重启安装
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
})
```

### 6.2 主进程处理 IPC

```ts title="src/main/ipc.ts"
import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

ipcMain.handle('check-for-update', async () => {
  const result = await autoUpdater.checkForUpdates()
  return result?.updateInfo?.version ?? null
})

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall()
})
```

### 6.3 渲染进程组件示例

```vue title="src/renderer/components/UpdateNotifier.vue"
<template>
  <div v-if="downloading" class="update-bar">
    <span>正在下载更新... {{ progress }}%</span>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
  <button v-else @click="handleCheckUpdate">检查更新</button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const downloading = ref(false)
const progress = ref(0)

onMounted(() => {
  window.electronAPI.onDownloadProgress((percent: number) => {
    downloading.value = true
    progress.value = percent
  })
})

async function handleCheckUpdate() {
  const version = await window.electronAPI.checkForUpdate()
  if (!version) {
    alert('当前已是最新版本')
  }
}
</script>
```

如果需要更丰富的 UI（更新日志、下载速度、剩余时间），可以多暴露几个 IPC 通道：

```ts title="src/main/updater-ipc.ts"
// 主进程：把所有更新事件转发给渲染进程
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('updater:status', {
    status: 'available',
    version: info.version,
    releaseNotes: info.releaseNotes,
  })
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow.webContents.send('updater:status', {
    status: 'downloading',
    percent: Math.round(progress.percent),
    speed: progress.bytesPerSecond,  // 下载速度（字节/秒）
  })
})

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('updater:status', { status: 'ready' })
})

autoUpdater.on('error', (err) => {
  mainWindow.webContents.send('updater:status', {
    status: 'error',
    message: err.message,
  })
})
```

渲染进程只需要监听 `updater:status` 一个通道，根据 `status` 字段渲染不同 UI 即可。

## 七、自动检查更新策略

应用一启动就弹"检查更新"太粗暴，常见策略：

```ts title="src/main/update-strategy.ts"
import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

// 策略一：启动后延迟检查（推荐，不影响启动速度）
export function checkOnStartup(delay = 5000) {
  setTimeout(() => autoUpdater.checkForUpdates(), delay)
}

// 策略二：定时检查（每小时查一次）
export function checkPeriodically(intervalMs = 60 * 60 * 1000) {
  setInterval(() => autoUpdater.checkForUpdates(), intervalMs)
}

// 策略三：窗口获得焦点时检查（带防抖，避免频繁请求）
export function checkOnFocus(mainWindow: BrowserWindow, debounceMs = 30000) {
  let lastCheck = 0
  mainWindow.on('focus', () => {
    const now = Date.now()
    if (now - lastCheck > debounceMs) {
      lastCheck = now
      autoUpdater.checkForUpdates()
    }
  })
}
```

推荐组合：**启动延迟 + 定时 + 获焦防抖**。

## 八、打包产物与发布方式

在讲 GitHub 和 OSS 的具体操作之前，先搞清楚一个问题：**打包后生成了什么文件？怎么放到服务器上？**

### 8.1 打包命令从哪来

你的 `package.json` 里有这些脚本：

```json title="package.json"
{
  "scripts": {
    "build": "npm run typecheck && electron-vite build",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
  }
}
```

`pnpm run build:win` 实际上做了两件事：

```
pnpm run build:win
  ↓
第一步：electron-vite build    ← 编译源码（主进程 + 预加载脚本 + 渲染进程）
  ↓
第二步：electron-builder --win ← 把编译产物打包成 .exe 安装包
```

注意 `electron-builder --win` 后面没有 `--publish` 参数，**默认行为就是不上传**，等同于 `--publish never`。

如果你需要打包后自动上传，可以加一个脚本：

```json title="package.json"
{
  "scripts": {
    "build:win": "npm run build && electron-builder --win",
    "build:win:publish": "npm run build && electron-builder --win --publish always"
  }
}
```

| 命令 | 作用 |
|------|------|
| `pnpm run build:win` | 只打包，不上传（文件在 `release/` 目录里，需要你手动传） |
| `pnpm run build:win:publish` | 打包 + 自动上传（上传到哪取决于 publish 配置） |

`build:win:publish` 上传到哪，取决于 `electron-builder.config.mjs` 里 `publish.provider` 配的是什么：

| publish 配置 | build:win:publish 的行为 |
|-------------|------------------------|
| `provider: 'github'` | 自动上传到 GitHub Releases（需要 GH_TOKEN） |
| `provider: 'generic'`（阿里云 OSS） | electron-builder 不支持自动上传到 generic，**命令会报错** |

所以如果你用阿里云 OSS，**不要用 `build:win:publish`**，只用 `build:win`，然后手动或用脚本上传。

**后面文章里统一用 `pnpm run build:win` 和 `pnpm run build:win:publish`，因为这才是你实际敲的命令。**

### 8.2 打包后生成了什么

运行 `pnpm run build:win` 后，项目根目录会生成一个 `release` 文件夹：

```
你的项目/
├── src/
├── package.json
├── electron-builder.config.mjs
└── release/                              ← 打包产物都在这
    ├── MyApp-1.0.1-setup.exe             ← 安装包（给用户装的）
    ├── MyApp-1.0.1-setup.exe.blockmap    ← 增量更新文件
    ├── latest.yml                        ← 版本信息（electron-updater 读这个）
    ├── builder-effective-config.yaml     ← 打包时用的配置快照（不用管）
    └── win-unpacked/                     ← 解压后的程序文件（不用管）
```

**需要上传的文件：**

| 文件 | 作用 | 必须上传吗 |
|------|------|-----------|
| `latest.yml` | 版本号、文件名、哈希值 | ✅ 必须 |
| `MyApp-1.0.1-setup.exe` | 安装包本体 | ✅ 必须 |
| `MyApp-1.0.1-setup.exe.blockmap` | 增量更新索引文件 | 建议上传 |

`.blockmap` 不是备份文件。它的作用是让 electron-updater 实现**增量更新**：

- **有 blockmap**：electron-updater 对比新旧版本的 blockmap，只下载变化的数据块（比如 68MB 的安装包只下载 5MB 差异）
- **没有 blockmap**：electron-updater 只能下载完整安装包（每次都下 68MB）

所以 blockmap 能大幅节省用户的下载流量，建议上传。

`latest.yml` 的内容长这样（electron-builder 自动生成，不用手写）：

```yaml
version: 1.0.1
files:
  - url: MyApp-1.0.1-setup.exe
    sha512: Dp9P8Z2f...==
    size: 68000000
path: MyApp-1.0.1-setup.exe
sha512: Dp9P8Z2f...==
releaseDate: '2024-01-15T10:00:00.000Z'
```

### 8.3 `--publish` 参数是什么意思

`build:win` 和 `build:win:publish` 的区别就在 `--publish` 参数：

| 参数 | 含义 | 适用场景 |
|------|------|----------|
| `--publish never` | 只打包，不上传 | 阿里云 OSS / 手动上传到 GitHub |
| `--publish always` | 打包完自动上传 | GitHub Releases（需要 Token） |
| `--publish onTag` | 只在 git tag 时上传 | CI/CD 自动化 |

**重点：** `--publish always` 只对 GitHub Releases 有效，因为 electron-builder 内置了 GitHub API 支持。阿里云 OSS 用的是 `provider: 'generic'`，electron-builder 不知道怎么上传到 OSS，所以只能用 `--publish never`，然后手动或用脚本上传。

### 8.4 两种发布流程对比

```
【GitHub Releases + 自动上传】

  配置 publish.provider = 'github'
  pnpm run build:win:publish
         ↓
  electron-builder 自动调用 GitHub API 上传
  （你需要提前设置 GH_TOKEN 环境变量）


【GitHub Releases + 手动上传】

  pnpm run build:win
         ↓
  文件在 release/ 目录里
         ↓
  你去 GitHub Releases 页面手动拖文件上传


【阿里云 OSS】

  pnpm run build:win（不能用 build:win:publish，会报错）
         ↓
  文件在 release/ 目录里
         ↓
  你手动上传到 OSS（或用脚本自动上传）
```

---

## 九、GitHub Releases 完整操作

### 9.1 获取 GitHub Token

打包时 electron-builder 需要通过 GitHub API 上传文件，所以需要一个 Token：

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 勾选 `repo` 权限
4. 复制生成的 Token（`ghp_` 开头）

### 9.2 配置 electron-builder

```js title="electron-builder.config.mjs"
export default {
  publish: {
    provider: 'github',
    owner: 'your-username',   // 你的 GitHub 用户名
    repo: 'your-repo',        // 你的仓库名
    releaseType: 'release',   // 只用正式版
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
}
```

### 9.3 打包并自动发布

```bash
# 设置 Token（每次新开终端都要设置）
export GH_TOKEN=ghp_xxxxxxxxxxxx

# 改版本号：package.json 的 "version": "1.0.0" → "1.0.1"

# 打包 + 自动上传到 GitHub Releases
pnpm run build:win:publish
```

打包成功后，GitHub 仓库的 Releases 页面会自动多出一个版本：

```
https://github.com/your-username/your-repo/releases

v1.0.1（自动创建）
├── MyApp-1.0.1-setup.exe           ← 安装包
├── MyApp-1.0.1-setup.exe.blockmap  ← 增量更新文件
└── latest.yml                      ← 版本信息
```

**就这么简单，不需要手动上传任何东西。**

### 9.4 不用命令行，手动上传到 GitHub Releases

如果你不想用 `build:win:publish`（比如不想配 Token），也可以完全手动操作：

```bash
# 第一步：只打包
pnpm run build:win
```

然后手动上传：

1. 打开你的 GitHub 仓库 → 点 **Releases** → 点 **Draft a new release**
2. **Tag version** 填 `v1.0.1`（对应 package.json 的版本号）
3. **Release title** 填 `v1.0.1`
4. 把 `release/` 目录下的 3 个文件拖进去：
   - `MyApp-1.0.1-setup.exe`
   - `MyApp-1.0.1-setup.exe.blockmap`
   - `latest.yml`
5. 点 **Publish release**

:::warning 手动上传的注意事项
- Tag 名字必须是 `v` + 版本号格式（`v1.0.1`），不然 electron-updater 可能找不到

- `latest.yml` 必须上传，它是 electron-updater 判断有没有新版本的依据

- 文件名不要改，保持 electron-builder 生成的原始文件名

:::

### 9.5 公开仓库 vs 私有仓库

| 仓库类型 | 打包发布时 | 用户端检查更新 |
|---------|-----------|--------------|
| **公开仓库** | 需要 Token | 不需要 Token |
| **私有仓库** | 需要 Token | 也需要 Token |

私有仓库需要在代码里加 Token：

```ts
autoUpdater.requestHeaders = {
  Authorization: 'token ghp_xxxxxxxxxxxx',
}
```

:::tip 建议
商业项目不建议用私有仓库做更新源，Token 写在客户端不安全。用阿里云 OSS 更合适。
:::

### 9.6 国内访问太慢怎么办

GitHub 在国内下载不稳定，两个办法：

**办法一：用户本地有代理工具**

```ts
autoUpdater.netSession.setProxy({
  proxyRules: 'http://127.0.0.1:7890',
})
```

**办法二：换成阿里云 OSS（推荐）**

把更新包放到国内服务器，下载速度飞快，见下一节。

---

## 十、阿里云 OSS 完整操作

### 10.1 创建 Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket：
   - 名称：比如 `myapp-releases`
   - 地域：选离用户最近的，比如 `华东1（杭州）`
   - **读写权限：选「公共读」**（重要！否则 electron-updater 下载不了）
3. 记住你的 Bucket 域名：

```
https://myapp-releases.oss-cn-hangzhou.aliyuncs.com
        ^^^^^^^^^^^^^^          ^^^^^^^^^^^^^
        Bucket名称               地域节点
```

### 10.2 配置 electron-builder

```js title="electron-builder.config.mjs"
export default {
  publish: {
    provider: 'generic',
    url: 'https://myapp-releases.oss-cn-hangzhou.aliyuncs.com/releases/win/',
  },
}
```

`url` 必须包含平台目录（`win/`），因为 electron-updater 会直接在后面拼 `latest.yml` 去请求。

### 10.3 打包

```bash
# 改版本号
# package.json: "version": "1.0.0" → "version": "1.0.1"

# 打包
pnpm run build:win
```

打包完成后在 `release/` 目录找到 3 个文件：

```
release/
├── MyApp-1.0.1-setup.exe
├── MyApp-1.0.1-setup.exe.blockmap
└── latest.yml
```

### 10.4 手动上传到 OSS（第一次先熟悉流程）

1. 打开 OSS 控制台 → 进入你的 Bucket
2. 创建目录：`releases/win/`
3. 把 `release/` 下的 3 个文件拖进去上传
4. 确认文件权限是「公共读」

**本地 release 目录 和 OSS 目录的对应关系：**

```
你电脑上的                              OSS 上的
─────────────                          ──────────
release/
├── latest.yml                      →  releases/win/latest.yml（根目录，始终覆盖）
├── MyApp-1.0.0-setup.exe           →  releases/win/v1.0.0/MyApp-1.0.0-setup.exe
└── MyApp-1.0.0-setup.exe.blockmap  →  releases/win/v1.0.0/MyApp-1.0.0-setup.exe.blockmap
```

安装包放到版本子目录（`v1.0.0/`），`latest.yml` 放到根目录。这样每个版本的安装包都保留，不会被覆盖。

### 10.4.1 多版本目录结构

推荐按版本号建子目录，保留所有历史版本：

```
releases/win/
├── latest.yml                              ← 始终指向最新版本
├── v1.0.0/
│   ├── MyApp-1.0.0-setup.exe
│   └── MyApp-1.0.0-setup.exe.blockmap
└── v1.0.1/
    ├── MyApp-1.0.1-setup.exe
    └── MyApp-1.0.1-setup.exe.blockmap
```

**每次发新版的操作步骤：**

```bash
# 1. 改版本号
#    package.json: "version": "1.0.0" → "version": "1.0.1"

# 2. 打包
pnpm run build:win

# 3. 在 OSS 上创建新版本目录 releases/win/v1.0.1/
#    上传 .exe 和 .blockmap 到这个目录

# 4. 修改 latest.yml 的 url 字段，指向新版本目录（见下方说明）
#    然后上传 latest.yml 到 releases/win/ 覆盖旧的
```

:::warning 重要：修改 latest.yml 的 url 字段
electron-builder 生成的 `latest.yml` 长这样：

```yaml
version: 1.0.1
files:
  - url: MyApp-1.0.1-setup.exe    # ← 只有文件名，没有目录路径
    sha512: xxxx==
    size: 68000000
path: MyApp-1.0.1-setup.exe
```

electron-updater 下载时会拼接：`配置的url` + `latest.yml里的url`

```
https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/  +  MyApp-1.0.1-setup.exe
= https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/MyApp-1.0.1-setup.exe
```

但你的文件放在 `v1.0.1/` 子目录里，所以需要手动把 `url` 改成包含子目录的路径：

```yaml
version: 1.0.1
files:
  - url: v1.0.1/MyApp-1.0.1-setup.exe    # ← 加上版本子目录
    sha512: xxxx==
    size: 68000000
path: v1.0.1/MyApp-1.0.1-setup.exe
```

这样 electron-updater 拼接出来的下载地址就对了：

```
https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/  +  v1.0.1/MyApp-1.0.1-setup.exe
= https://xxx.oss-cn-hangzhou.aliyuncs.com/releases/win/v1.0.1/MyApp-1.0.1-setup.exe
```
:::

### 10.5 验证是否成功

在浏览器访问：

```
https://myapp-releases.oss-cn-hangzhou.aliyuncs.com/releases/win/latest.yml
```

能看到 YAML 内容就说明配置正确。如果报 403，回去检查 Bucket 权限是不是「公共读」。

### 10.6 用脚本自动上传

每次都去 OSS 控制台拖文件太麻烦，写个脚本一键上传：

```bash
pnpm add ali-oss -D
```

```js title="scripts/upload-oss.mjs"
import OSS from 'ali-oss'
import fs from 'fs'
import path from 'path'

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_KEY_ID,
  accessKeySecret: process.env.OSS_SECRET,
  bucket: 'myapp-releases',
})

// 读取版本号
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const version = pkg.version
console.log(`当前版本: v${version}`)

const releaseDir = './release'
const versionDir = `releases/win/v${version}`

// 找到安装包和 blockmap（增量更新索引文件）
const allFiles = fs.readdirSync(releaseDir)
const installerFiles = allFiles.filter((f) => f.endsWith('.exe') || f.endsWith('.exe.blockmap'))

// 1. 上传安装包到版本子目录：releases/win/v1.0.1/
for (const file of installerFiles) {
  const localPath = path.join(releaseDir, file)
  await client.put(`${versionDir}/${file}`, localPath)
  console.log(`✅ ${versionDir}/${file}`)
}

// 2. 修改 latest.yml 的 url，加上版本子目录路径
const latestYmlPath = path.join(releaseDir, 'latest.yml')
let latestYml = fs.readFileSync(latestYmlPath, 'utf-8')

installerFiles.forEach((file) => {
  // 把 "url: MyApp-1.0.1-setup.exe" 改成 "url: v1.0.1/MyApp-1.0.1-setup.exe"
  latestYml = latestYml.replace(`url: ${file}`, `url: v${version}/${file}`)
  // 同时修改 path 字段
  latestYml = latestYml.replace(`path: ${file}`, `path: v${version}/${file}`)
})

// 3. 上传修改后的 latest.yml 到根目录：releases/win/
await client.put('releases/win/latest.yml', Buffer.from(latestYml))
console.log(`✅ releases/win/latest.yml (url 已指向 v${version}/)`)

console.log('\n🎉 全部完成！')
```

```json title="package.json"
{
  "scripts": {
    "upload": "node scripts/upload-oss.mjs"
  }
}
```

以后每次发版只需要：

```bash
# 1. 改版本号
#    package.json: "version": "1.0.0" → "version": "1.0.1"

# 2. 打包
pnpm run build:win

# 3. 上传到 OSS
pnpm run upload
```

脚本会自动完成三件事：
1. 读取 `package.json` 的版本号
2. 把安装包上传到 `releases/win/v1.0.1/` 版本子目录
3. 修改 `latest.yml` 的 url 指向新版本目录，上传到 `releases/win/`

**不需要手动改文件名或目录**，脚本全部搞定。

AccessKey 获取：阿里云控制台 → 右上角头像 → AccessKey 管理。

---

## 十一、两种方式怎么选

```
项目是开源的？
├── 是 → GitHub Releases（免费、--publish always 一键搞定）
└── 否 → 用户在国内？
          ├── 是 → 阿里云 OSS（下载快、每月几毛钱）
          └── 否 → GitHub Releases 也行
```

不管用哪种方式，**更新代码都是一样的**，区别只在：
- electron-builder 的 `publish` 配置不同
- GitHub 可以用 `build:win:publish` 自动上传，也可以手动上传
- OSS 只能用 `build:win` 打包后手动/脚本上传

## 十二、增量更新

`electron-updater` **自动支持增量更新**，不需要额外配置。

原理：打包时 electron-builder 会生成一个 `.blockmap` 文件，记录安装包的内容块。更新时只下载变化的块，而不是整个安装包。

```
完整安装包:  68 MB
增量包:       5 MB（只下载变化的部分）
```

**注意事项：** 两次打包之间不要改 NSIS 的压缩配置，否则 blockmap 失效，会退化为全量下载。

## 十三、代码签名

Windows 上未签名的安装包会被 SmartScreen 拦截，弹出"Windows 已保护你的电脑"的警告，用户体验很差。

### 13.1 EV 代码签名证书（正式发布用）

```js title="electron-builder.config.mjs"
export default {
  win: {
    signingHashAlgorithms: ['sha256'],
    sign: './scripts/sign.js',
  },
}
```

```js title="scripts/sign.js"
const { execSync } = require('child_process')

exports.default = async function (configuration) {
  execSync(
    `signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /n "Your Company" "${configuration.path}"`,
    { stdio: 'inherit' }
  )
}
```

### 13.2 自签名（开发/测试用）

```bash
makecert -r -pe -n "CN=MyApp" -ss PrivateCertStore MyApp.cer
```

## 十四、macOS 公证

macOS 10.15+ 要求应用必须经过 Apple 公证（Notarize），否则会提示"应用已损坏"。

```js title="electron-builder.config.mjs"
export default {
  mac: {
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
  },
  afterSign: './scripts/notarize.js',
}
```

```js title="scripts/notarize.js"
const { notarize } = require('@electron/notarize')

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  await notarize({
    appBundleId: 'com.example.myapp',
    appPath: `${context.appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })
}
```

## 十五、常见问题

### 检查更新失败

```ts
// 先开启日志，看具体报错
import log from 'electron-log'
autoUpdater.logger = log
```

| 错误 | 原因 | 解决 |
|------|------|------|
| `net::ERR_CONNECTION_REFUSED` | URL 配错或网络不通 | 检查 publish 配置 |
| `Cannot find latest.yml` | 文件没上传或路径不对 | 确认 latest.yml 在正确位置 |
| `ENOTFOUND` | DNS 解析失败 | 检查网络或代理 |
| `New version is not signed` | 签名证书不一致 | 保持两次打包用同一个证书 |

### 下载的安装包被杀毒拦截

申请 EV 代码签名证书可以解决。临时方案：向杀毒软件厂商提交误报申诉。

### 更新后用户数据丢失

更新安装默认会保留 `AppData` 目录。如果用了自定义 NSIS 脚本，注意不要清空用户数据目录：

```bash
; ❌ 错误：会清空用户数据
RMDir /r "$APPDATA\${PRODUCT_NAME}"

; ✅ 正确：只清理缓存
RMDir /r "$APPDATA\${PRODUCT_NAME}\cache"
```
