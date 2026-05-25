# NSIS 脚本的使用
:::tip 介绍
NSIS 是一种基于脚本的 Windows 安装程序制作工具。它的核心思想是：通过编写一个 .nsi 后缀的文本文件，定义安装包的界面、释放的文件、释放的位置以及安装/卸载时的逻辑，然后通过 NSIS 编译器将其编译成一个 .exe 安装程序。
:::

在 Electron 开发中，我们通常有两种方式使用它：

- 完全接管： 扔掉 electron-builder 的打包部分，自己写 .nsi 脚本把 Electron 编译出来的 win-unpacked 目录打包。

- 局部自定义（推荐）： 依旧使用 electron-builder，但通过 include 配置项引入自定义的 installer.nsh 脚本，在特定的生命周期（如安装前、安装后）插入自己的逻辑。


## 一、核心生命周期钩子

以下是 electron-builder 留给你的 5 个最关键的“后门”，你可以根据需求选择性地写在 build/installer.nsh 中：

1. customInit（安装程序刚打开，还没弹窗）
触发时机： 用户双击安装包，界面还没显示出来的第一瞬间。

常用于： 环境检查。 比如检查用户电脑是不是 64 位、检查有没有安装特定的驱动、或者检查老版本是否正在运行并强制关闭。

2. customInstall（文件复制完成，准备写注册表和快捷方式）
触发时机： 进度条跑完 100%，应用的文件已经全部解压到了安装目录。

常用于： 写自定义注册表、关联文件后缀。 比如把 .mydata 文件关联给你的 Electron 软件。

3. customFinish（安装完成，准备关闭安装向导）
触发时机： 用户点击“完成”按钮的前一刻。

常用于： 启动应用。 比如以管理员权限运行刚刚装好的程序，或者执行一个激活脚本。

4. customUnInit（卸载程序刚打开）
触发时机： 用户在控制面板点“卸载”，卸载界面刚弹出来。

常用于： 提示用户“卸载将清空所有数据”，或者检查要卸载的 App 当前是否还在运行。

5. customUnInstall（卸载文件删除完毕）
触发时机： 卸载进度条跑完，软件文件已被删除。

常用于： 清理残留垃圾。 比如彻底删掉 AppData/Roaming/你的应用名 目录下的用户本地缓存、日志、CouchDB/LevelDB 数据。

## 二、实际使用

```shell title="目录结构"
my-electron-app/                  # 项目根目录
├── build/                        # 存放打包构建所需的静态资源和自定义脚本
│   ├── installer.nsh             # 👈 你的自定义 NSIS 安装向导脚本（开机自启、UI控制等）
│   └── entitlements.mac.plist    # Mac 权限配置文件（在配置文件中被引用）
├── resources/                    # 存放应用运行时的通用原生资源
│   └── icon.png                  # 👈 软件的图标（Windows、Mac、Linux 打包共用）
├── src/                          # 前端与主进程的纯源码目录（打包时会被files字段排除）
│   ├── main/
│   └── renderer/
├── .env                          # 👈 基础本地环境变量文件
├── .env.production               # 👈 生产/打包环境变量文件
├── electron-builder.config.mjs   # 👈 你的 electron-builder 核心打包配置文件
├── package.json                  # 项目依赖管理文件
└── pnpm-lock.yaml                # 包管理器锁定文件
```


```shell title="build/installer.nsh"
; =====================================================================
; 1. 引入基础依赖库
; =====================================================================
!include "MUI2.nsh"        ; 现代界面库 (Modern UI 2)
!include "LogicLib.nsh"    ; 逻辑控制库 (支持 ${If} ${Else} 语法)
!include "nsDialogs.nsh"   ; 自定义对话框/页面组件库

; 定义注册表启动项的键名
!define AUTO_LAUNCH_REGISTRY_NAME "${PRODUCT_NAME}"

; =====================================================================
; 2. 安装程序自定义逻辑（仅在安装时编译，卸载时不编译这段变量和页面）
; =====================================================================
!ifndef BUILD_UNINSTALLER
  ; 定义用户交互所需的全局变量
  Var AutoLaunchCheckbox
  Var AutoLaunchChecked

  ; 利用 electron-builder 预留的宏，在选择完安装目录后插入自定义页面
  !macro customPageAfterChangeDir
    Page custom AutoLaunchPageCreate AutoLaunchPageLeave
  !macroend

  ; -------------------------------------------------------------------
  ; 函数：创建自定义页面
  ; -------------------------------------------------------------------
  Function AutoLaunchPageCreate
    ; 设置自定义页面的大标题与子标题
    !insertmacro MUI_HEADER_TEXT "设置开机自启" "设置后应用将随 Windows 开机自行启动"

    ; 初始化一个标准的密码框/对话框页面（大小为 1018 标准矩阵）
    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ; 绘制标签：分类标题
    ${NSD_CreateLabel} 0 0 100% 16u "安装选项"
    Pop $1

    ; 绘制复选框：默认勾选 (100% 宽度，12u 高度)
    ${NSD_CreateCheckbox} 0 22u 100% 12u "开机自动启动程序"
    Pop $AutoLaunchCheckbox
    ${NSD_Check} $AutoLaunchCheckbox ; 默认激活勾选状态

    ; 绘制说明文字
    ${NSD_CreateLabel} 0 40u 100% 20u "勾选后，Windows 启动时将自动运行 ${PRODUCT_NAME}。"
    Pop $2

    ; 显示窗口
    nsDialogs::Show
  FunctionEnd

  ; -------------------------------------------------------------------
  ; 函数：离开自定义页面时触发
  ; -------------------------------------------------------------------
  Function AutoLaunchPageLeave
    ; 捕获复选框当前的状态并保存到全局变量 $AutoLaunchChecked 中
    ${NSD_GetState} $AutoLaunchCheckbox $AutoLaunchChecked
  FunctionEnd

  ; -------------------------------------------------------------------
  ; 宏：核心安装执行阶段 (文件复制完毕后触发)
  ; -------------------------------------------------------------------
  !macro customInstall
    ; 判断用户在自定义页面是否勾选了开机自启
    ${If} $AutoLaunchChecked == ${BST_CHECKED}
      
      ; 精准判断：如果是“为电脑所有人安装”(Require Admin)
      ${If} $installMode == "all"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
      ; 如果是“仅为当前用户安装”
      ${Else}
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
      ${EndIf}
      
    ${Else}
      ; 如果用户没有勾选，确保安全，同时清理掉旧的 HKLM 和 HKCU 启动项
      DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
      DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
    ${EndIf}
  !macroend
!endif

; =====================================================================
; 3. 卸载程序逻辑 (控制面板卸载时执行)
; =====================================================================
!macro customUnInstall
  ; 卸载时，无论之前以什么模式安装，干净地拔除所有可能的开机自启注册表残余
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
!macroend
```

```js title="electron-builder.config.mjs"
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// 获取当前 Node.js 进程的工作目录（通常是项目根目录）
const rootDir = process.cwd();

/**
 * 纯手写的一个简易版 .env 文件解析器
 * 作用：读取并解析类似 KEY=VALUE 格式的环境变量文件，避免引入 dotenv 依赖
 * @param {string} filePath - 环境文件的绝对路径
 */
const parseEnvFile = (filePath) => {
  // 如果文件不存在，直接返回空对象，防止报错导致打包中断
  if (!existsSync(filePath)) {
    return {};
  }

  // 同步读取文件内容
  const content = readFileSync(filePath, 'utf8');
  const env = {};

  // 按行分割内容，兼容 Windows (\r\n) 和 Linux/Mac (\n) 的换行符
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    // 过滤掉空行，以及以 # 开头的注释行
    if (!line || line.startsWith('#')) {
      continue;
    }

    // 寻找等号 = 的位置，用来区分键和值
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue; // 如果没有等号或等号在第一位，说明不是合法的键值对，跳过
    }

    // 截取键名并去除两端空格（例如: VITE_APP_TITLE）
    const key = line.slice(0, separatorIndex).trim();
    // 截取值并去除两端空格
    let value = line.slice(separatorIndex + 1).trim();

    // 如果值是用单引号或双引号包裹的（例如: "我的应用"），剥离前后的引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // 存入临时环境变量对象
    env[key] = value;
  }

  return env;
};

// 合并环境变量，优先级：系统原生 process.env > .env.production > .env
const env = {
  ...parseEnvFile(resolve(rootDir, '.env')),            // 基础本地环境
  ...parseEnvFile(resolve(rootDir, '.env.production')), // 生产/打包环境
  ...process.env,                                      // 终端系统环境变量（最高优先级）
};

// 提取打包所需的关键变量，如果未定义则赋予默认值（兜底机制）
const appTitle = env.VITE_APP_TITLE?.trim() || '标题';
const appId = env.VITE_APP_ID?.trim() || 'com.example.app';
const executableName = env.VITE_APP_EXECUTABLE_NAME?.trim() || 'example-app';

/**
 * electron-builder 核心配置导出
 */
export default {
  appId,               // 应用程序唯一标识，对应 Windows 注册表和 Mac Bundle ID
  productName: appTitle, // 安装后的应用快捷方式名称、软件名称

  directories: {
    buildResources: 'build', // 指定打包构建资源（如图标、plist、nsh脚本）的存放目录
  },

  // 核心优化：定义哪些文件不需要被打包进最终的安装包中（黑名单机制）
  // 使用 ! 前缀代表“排除”，能显著减小安装包体积并防止源码泄露
  files: [
    '!**/.vscode/*',                             // 排除 IDE 配置文件
    '!src/*',                                    // 排除前端未编译的纯源码
    '!electron.vite.config.{js,ts,mjs,cjs}',     // 排除编译配置文件
    '!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}', // 排除代码规范与说明文档
    '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',      // 排除敏感的环境变量及包管理器锁定文件
    '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}', // 排除 TypeScript 配置文件
  ],

  // 指定不压缩进 asar 虚拟文件系统的资源。通常存放外部调用的 .exe、.dll 或较大的多媒体资源
  asarUnpack: ['resources/**'],

  // ==========================================
  // Windows (Win) 系统打包配置
  // ==========================================
  win: {
    executableName,           // 编译出的 .exe 主程序文件名（不带.exe后缀）
    icon: 'resources/icon.png', // 软件安装后以及在任务栏显示的图标
  },

  // ==========================================
  // NSIS 安装向导配置（结合自定义 installer.nsh）
  // ==========================================
  nsis: {
    artifactName: '${name}-${version}-setup.${ext}', // 生成的安装包命名格式 (例如: brain-health-1.0.0-setup.exe)
    shortcutName: '${productName}',                 // 桌面及开始菜单快捷方式的名称
    uninstallDisplayName: '${productName}',         // 在 Windows “控制面板 -> 卸载程序”中显示的软件名称
    createDesktopShortcut: 'always',                // 是否总是创建桌面快捷方式
    oneClick: false,                                // 核心：关闭一键安装，启用标准的下一步向导模式
    perMachine: true,                               // 核心：允许用户选择“为所有计算机用户安装”或“仅为当前用户安装”
    allowToChangeInstallationDirectory: true,       // 核心：允许用户在向导中点击“浏览”自定义安装路径
    include: 'build/installer.nsh',                 // 核心：引入你写的自定义 NSIS 补丁逻辑（比如开机自启页面）
  },

  // ==========================================
  // macOS 系统打包配置
  // ==========================================
  mac: {
    icon: 'resources/icon.png',                       // Mac 应用图标 (.icns 或高分辨率 .png)
    entitlementsInherit: 'build/entitlements.mac.plist', // 继承的沙盒权限配置文件
    extendInfo: {
      // 苹果隐私合规：当软件需要调用系统敏感权限时，弹窗提示用户的文案说明
      NSCameraUsageDescription: "Application requests access to the device's camera.",         // 申请摄像头
      NSMicrophoneUsageDescription: "Application requests access to the device's microphone.", // 申请麦克风
      NSDocumentsFolderUsageDescription: "Application requests access to the user's Documents folder.", // 申请文档目录权限
      NSDownloadsFolderUsageDescription: "Application requests access to the user's Downloads folder.", // 申请下载目录权限
    },
    notarize: false, // 是否开启苹果官方公证 (如果你没有付费的苹果开发者账号，这里必须设为 false，否则打包报错)
  },

  // macOS 独有的磁盘映像 (.dmg) 安装包配置
  dmg: {
    artifactName: '${name}-${version}.${ext}', // 生成的 .dmg 文件命名格式
  },

  // ==========================================
  // Linux 系统打包配置
  // ==========================================
  linux: {
    icon: 'resources/icon.png',
    target: ['AppImage', 'snap', 'deb'], // 同时打包出三种主流的 Linux 软件格式
    maintainer: 'electronjs.org',       // 维护者信息
    category: 'Utility',                 // 软件在 Linux 应用市场中的分类（工具类）
  },

  // Linux 下的免安装单文件格式配置
  appImage: {
    artifactName: '${name}-${version}.${ext}',
  },

  // ==========================================
  // 全局通用高级配置
  // ==========================================
  npmRebuild: false, // 打包前是否重新强制编译 C++ 原生模块。设为 false 可以大幅缩短打包时间（建议在开发环境确保 native 模块已正确编译）

  // 电子软件自动更新（Auto-updater）的服务器配置
  publish: {
    provider: 'generic',                       // 通用文件服务器模式
    url: 'https://example.com/auto-updates',   // 软件检查更新的线上远程服务器地址
  },

  // 国内打包提速核心：指定 Electron 运行报文的下载镜像源，防止因为连接国外 GitHub 缓慢而导致打包卡死
  electronDownload: {
    mirror: 'https://npmmirror.com/mirrors/electron/', // 切换为阿里云（淘宝）提供的 Electron 国内镜像源
  },
};

```