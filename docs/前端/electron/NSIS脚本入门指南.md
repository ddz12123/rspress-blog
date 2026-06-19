# NSIS 脚本入门指南

:::tip 一句话总结
NSIS（Nullsoft Scriptable Install System）是一个开源的 Windows 安装程序制作工具，通过编写 `.nsi` 脚本文件，编译生成 `.exe` 安装包。
:::

## 一、NSIS 是什么

NSIS 的核心流程：

```
编写 .nsi 脚本 → NSIS 编译器 → 生成 .exe 安装包
```

**为什么用 NSIS？**
- 免费开源，比 Inno Setup 更灵活
- 支持自定义界面、注册表操作、文件操作
- Electron 的 electron-builder 底层就是用 NSIS 打包 Windows 安装包

## 二、安装 NSIS

1. 下载：https://nsis.sourceforge.io/Download
2. 安装时勾选 "NSIS Editor"（HM NIS Edit，脚本编辑器）
3. 安装完成后，命令行可用 `makensis` 命令编译脚本

验证安装：
```bash
makensis /VERSION
```

## 三、基础语法速查

### 3.1 注释

```bash
; 单行注释用分号（推荐）

# 也可以用 #，但 # 在 NSIS 里有特殊用途（预编译指令），容易混淆
```

### 3.2 变量

NSIS 有三种变量，都以 `$` 开头：

**① 通用寄存器（不用声明，直接用）**

`$0` ~ `$9` 和 `$R0` ~ `$R9` 是 NSIS 内置的通用寄存器，临时存值用，不需要声明：

```bash
; 直接赋值使用
StrCpy $0 "Hello"
StrCpy $1 "World"
MessageBox MB_OK "$0 $1"
```

**② 自定义变量（需要 Var 声明）**

给变量起个有意义的名字，需要先用 `Var` 声明：

```bash
; 声明
Var myVar
Var count

; 赋值（StrCpy = string copy）
StrCpy $myVar "Hello"
StrCpy $count "0"

; 使用
MessageBox MB_OK "值是: $myVar"
DetailPrint "当前计数: $count"
```

**③ 内置变量（系统预定义）**

如 `$INSTDIR`、`$DESKTOP` 等，NSIS 已经定义好了，直接用，见下一节。

| 类型 | 示例 | 需要声明 | 用途 |
|------|------|----------|------|
| 通用寄存器 | `$0` ~ `$9`, `$R0` ~ `$R9` | 否 | 临时存值、接返回值 |
| 自定义变量 | `$myVar` | 是（`Var myVar`） | 有意义的名字，提高可读性 |
| 内置变量 | `$INSTDIR`, `$DESKTOP` | 否 | 系统路径等固定值 |

### 3.3 常用内置变量

NSIS 预定义了一批路径变量，不需要声明：

| 变量 | 含义 |
|------|------|
| `$INSTDIR` | 安装目录（用户选择的路径） |
| `$OUTDIR` | 当前输出目录 |
| `$DESKTOP` | 当前用户桌面 |
| `$SMPROGRAMS` | 当前用户开始菜单 |
| `$COMMONDESKTOP` | 所有用户桌面 |
| `$COMMONSTARTMENU` | 所有用户开始菜单 |
| `$PROGRAMFILES` | C:\Program Files |
| `$TEMP` | 系统临时目录 |
| `$PLUGINSDIR` | 插件临时目录（运行时自动创建） |

electron-builder 额外注入的变量：

| 变量 | 含义 |
|------|------|
| `$installMode` | `all`=为所有用户安装，`current`=仅当前用户 |
| `${PRODUCT_NAME}` | 产品名称（来自 electron-builder 配置） |
| `${APP_EXECUTABLE_FILENAME}` | 主程序文件名 |

### 3.4 预编译指令（`!` 开头）

NSIS 有一类以 `!` 开头的指令，在**编译时**执行（不是运行时）：

| 指令 | 作用 | 示例 |
|------|------|------|
| `!include` | 引入库文件 | `!include "MUI2.nsh"` |
| `!define` | 定义常量 | `!define MY_NAME "MyApp"` |
| `!macro` / `!macroend` | 定义宏 | `!macro MyMacro arg` ... `!macroend` |
| `!insertmacro` | 调用宏 | `!insertmacro MyMacro "value"` |
| `!ifndef` / `!endif` | 条件编译 | `!ifndef BUILD_UNINSTALLER` ... `!endif` |

使用常量时用 `${常量名}`：
```bash
!define APP_NAME "MyApp"
MessageBox MB_OK "欢迎使用 ${APP_NAME}"
```

### 3.5 栈操作（Push / Pop）

NSIS 有一个**栈**（Stack），很多命令的返回值通过栈传递，不是直接赋值：

- `Push 值` — 把值压入栈顶
- `Pop $变量` — 从栈顶取值存到变量

```bash
; 例：nsDialogs::Create 返回的句柄在栈里，要用 Pop 取出
nsDialogs::Create 1018
Pop $0                    ; 把返回值取到 $0

; 判断返回值
${If} $0 == error
  MessageBox MB_OK "创建失败"
  Abort
${EndIf}
```

### 3.6 插件调用语法（`::`）

NSIS 可以调用外部插件，语法是 `插件名::命令 参数`：

```bash
; nsDialogs 是 UI 插件，Create 是它的命令
nsDialogs::Create 1018
Pop $0

; nsProcess 是进程管理插件
nsProcess::_FindProcess "myapp.exe"
Pop $0
```

### 3.7 字符串操作

NSIS 的字符串操作都是通过命令完成的，没有 `+` 运算符：

| 命令 | 作用 | 语法 |
|------|------|------|
| `StrCpy` | 赋值 / 拼接 | `StrCpy $目标 "值"` |
| `StrLen` | 获取长度 | `StrLen $目标 $源` |

```bash
; 赋值
StrCpy $0 "Hello"

; 拼接（把变量嵌入字符串即可）
StrCpy $0 "$0 World"       ; 结果: "Hello World"

; 获取长度（结果存到 $1）
StrLen $1 $0               ; $1 = 11
```

## 四、核心命令

NSIS 命令的基本格式：`命令 参数1 参数2 ...`

- 参数之间用空格分隔
- 字符串参数用双引号包裹
- 带空格的路径必须用引号：`"$INSTDIR\my app"`

### 4.1 文件操作

文件操作的核心思路：**先设置输出路径，再释放文件**。

```bash
; 1. 设置输出路径（后续 File 命令的文件会释放到这里）
SetOutPath "$INSTDIR"

; 2. 释放文件
File "myfile.txt"              ; 释放单个文件
File /r "myapp\*.*"            ; /r = 递归释放整个目录

; 3. 清理操作（卸载时用）
Delete "$INSTDIR\old.txt"      ; 删除单个文件
RMDir /r "$INSTDIR\cache"      ; 递归删除目录
```

### 4.2 快捷方式

快捷方式路径分"当前用户"和"所有用户"两种：

| 当前用户 | 所有用户 | 说明 |
|----------|----------|------|
| `$DESKTOP` | `$COMMONDESKTOP` | 桌面 |
| `$SMPROGRAMS` | `$COMMONSTARTMENU` | 开始菜单 |

创建快捷方式的语法：`CreateShortCut "快捷方式路径" "目标程序路径"`

```bash
; 根据安装模式选择路径（perMachine 配置决定）
${If} $installMode == "all"
  ; 为所有用户安装 → 公共桌面 + 公共开始菜单
  CreateShortCut "$COMMONDESKTOP\MyApp.lnk" "$INSTDIR\myapp.exe"
  CreateDirectory "$COMMONSTARTMENU\MyApp"
  CreateShortCut "$COMMONSTARTMENU\MyApp\MyApp.lnk" "$INSTDIR\myapp.exe"
${Else}
  ; 仅为当前用户安装 → 用户桌面 + 用户开始菜单
  CreateShortCut "$DESKTOP\MyApp.lnk" "$INSTDIR\myapp.exe"
  CreateDirectory "$SMPROGRAMS\MyApp"
  CreateShortCut "$SMPROGRAMS\MyApp\MyApp.lnk" "$INSTDIR\myapp.exe"
${EndIf}

; 创建卸载快捷方式（通常放开始菜单）
CreateShortCut "$SMPROGRAMS\MyApp\卸载.lnk" "$INSTDIR\uninstall.exe"

; 删除快捷方式（卸载时要清理两种可能的路径）
Delete "$DESKTOP\MyApp.lnk"
Delete "$COMMONDESKTOP\MyApp.lnk"
Delete "$SMPROGRAMS\MyApp\*.lnk"
Delete "$COMMONSTARTMENU\MyApp\*.lnk"
RMDir "$SMPROGRAMS\MyApp"
RMDir "$COMMONSTARTMENU\MyApp"
```

### 4.3 注册表操作

注册表路径格式：`根键\子路径\值名`

| 根键 | 说明 |
|------|------|
| `HKLM` | HKEY_LOCAL_MACHINE（需要管理员权限） |
| `HKCU` | HKEY_CURRENT_USER（当前用户） |

```bash
; 写入字符串值
WriteRegStr HKLM "Software\MyApp" "InstallDir" "$INSTDIR"

; 写入开机自启（路径含空格，用单引号包裹整个值）
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MyApp" '"$INSTDIR\myapp.exe"'

; 读取字符串值
ReadRegStr $0 HKLM "Software\MyApp" "InstallDir"

; 删除单个值
DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MyApp"

; 删除整个键（及其下所有子键和值）
DeleteRegKey HKLM "Software\MyApp"
```

### 4.4 系统命令

```bash
; 执行外部程序并等待结束（ExecWait）
ExecWait '"$INSTDIR\setup.exe" /silent'

; 执行外部程序不等待（Exec）
Exec '"$INSTDIR\myapp.exe"'

; 用系统默认程序打开文件/URL
ExecShell "open" "https://example.com"

; 消息框（语法：MessageBox 标志 "内容" 返回值跳转）
MessageBox MB_OK "安装完成！"

; 带判断的消息框
MessageBox MB_YESNO "是否立即启动？" IDYES launch IDNo skip
launch:
  Exec '"$INSTDIR\myapp.exe"'
skip:
```

消息框常用标志：

| 标志 | 含义 |
|------|------|
| `MB_OK` | 只有"确定"按钮 |
| `MB_YESNO` | "是"和"否"按钮 |
| `MB_OKCANCEL` | "确定"和"取消"按钮 |
| `MB_ICONEXCLAMATION` | 感叹号图标 |
| `MB_ICONINFORMATION` | 信息图标 |

## 五、流程控制

NSIS 原生的流程控制语法很原始（类似汇编的 GOTO），实际开发中我们用 **LogicLib** 库来获得更易读的 `${If}` / `${While}` 语法。

### 5.1 条件判断（LogicLib）

需要引入 LogicLib 库，然后用 `${If}` / `${ElseIf}` / `${Else}` / `${EndIf}` 语法：

```bash
!include "LogicLib.nsh"

; 基本判断
${If} $0 == "yes"
  MessageBox MB_OK "是"
${ElseIf} $0 == "no"
  MessageBox MB_OK "否"
${Else}
  MessageBox MB_OK "其他"
${EndIf}

; 判断文件是否存在（${FileExists} 是内置函数）
${If} ${FileExists} "$INSTDIR\config.ini"
  MessageBox MB_OK "配置文件存在"
${EndIf}

; 判断目录是否存在（用 *.* 通配符）
${If} ${FileExists} "$INSTDIR\data\*.*"
  MessageBox MB_OK "data 目录存在"
${EndIf}
```

常用比较运算符：`==` `!=` `>` `<` `>=` `<=`

### 5.2 循环

While 循环语法：`${While} 条件` ... `${EndWhile}`

```bash
; While 循环
StrCpy $0 0
${While} $0 < 10
  IntOp $0 $0 + 1         ; IntOp 做整数运算（没有 $0++ 语法）
  DetailPrint "计数: $0"
${EndWhile}
```

遍历文件用 `FindFirst` / `FindNext` / `FindClose` 三件套：

```bash
; 遍历目录下的 .log 文件
FindFirst $0 $1 "$INSTDIR\*.log"   ; $0=句柄, $1=文件名
${While} $0 != ""
  DetailPrint "找到: $1"
  FindNext $0 $1                    ; 读取下一个
${EndWhile}
FindClose $0                        ; 关闭句柄
```

## 六、页面与界面

### 6.1 基础页面

NSIS 的页面系统基于 **MUI2（Modern UI 2）** 库，通过 `!insertmacro MUI_PAGE_XXX` 定义安装向导的页面顺序：

```bash
!include "MUI2.nsh"

; 定义安装向导页面（按顺序出现）
!insertmacro MUI_PAGE_WELCOME               ; 欢迎页
!insertmacro MUI_PAGE_LICENSE "license.txt"  ; 许可协议页（需要 license.txt 文件）
!insertmacro MUI_PAGE_DIRECTORY              ; 选择安装目录页
!insertmacro MUI_PAGE_INSTFILES              ; 安装进度页
!insertmacro MUI_PAGE_FINISH                 ; 完成页

; 定义卸载向导页面
!insertmacro MUI_UNPAGE_CONFIRM              ; 卸载确认页
!insertmacro MUI_UNPAGE_INSTFILES            ; 卸载进度页

; 设置语言（必须放在页面定义之后）
!insertmacro MUI_LANGUAGE "SimpChinese"
```

### 6.2 自定义页面

自定义页面需要两个函数：**创建函数**（绘制 UI）和**离开函数**（获取用户输入）。

页面声明语法：`Page custom 创建函数名 离开函数名`

nsDialogs 控件创建语法：`${NSD_Create类型} X Y 宽度 高度 "文字"`

控件类型：

| 宏 | 控件 | 说明 |
|----|------|------|
| `${NSD_CreateLabel}` | 标签 | 静态文字 |
| `${NSD_CreateText}` | 文本框 | 用户输入 |
| `${NSD_CreateCheckbox}` | 复选框 | 勾选/取消 |
| `${NSD_CreateRadioButton}` | 单选框 | 多选一 |
| `${NSD_CreateDropList}` | 下拉框 | 下拉选择 |

尺寸单位：

| 单位 | 含义 | 示例 |
|------|------|------|
| `100%` | 父容器宽度的百分比 | `100%` = 占满整行 |
| `12u` | 12 个对话框单位（像素相关的相对单位） | 标准行高约 12u~16u |
| `0` | 起始位置（左边/上边） | X=0 表示左对齐 |

```bash
; 声明自定义页面
Page custom MyPageCreate MyPageLeave

Function MyPageCreate
  ; 设置页面标题
  !insertmacro MUI_HEADER_TEXT "自定义设置" "请配置安装选项"

  ; 创建对话框容器（1018 是标准页面模板 ID，不要改）
  nsDialogs::Create 1018
  Pop $0                    ; 句柄存到 $0
  ${If} $0 == error
    Abort                   ; 创建失败就中止安装
  ${EndIf}

  ; 创建控件
  ; 语法：${NSD_Create类型} X坐标 Y坐标 宽度 高度 "文字"
  ${NSD_CreateLabel} 0 0 100% 16u "安装选项"
  Pop $1                    ; 标签句柄存到 $1（不需要操作可以不 Pop）

  ${NSD_CreateCheckbox} 0 22u 100% 12u "创建桌面快捷方式"
  Pop $checkbox             ; 句柄存到变量，后续要读取状态
  ${NSD_Check} $checkbox    ; 设置默认选中

  ${NSD_CreateText} 0 40u 100% 12u "默认值"
  Pop $textbox

  ; 显示页面
  nsDialogs::Show
FunctionEnd

Function MyPageLeave
  ; 获取控件状态/值（在用户点"下一步"时触发）
  ${NSD_GetState} $checkbox $0      ; $0 = ${BST_CHECKED} 或 ${BST_UNCHECKED}
  ${NSD_GetText} $textbox $1        ; $1 = 文本框内容
FunctionEnd
```

## 七、宏（Macro）

宏是 NSIS 的编译期代码复用机制，和函数的区别：
- **宏**：编译时展开，类似 C 的 `#define`，可以生成代码结构
- **函数**：运行时调用，类似普通函数

定义语法：`!macro 宏名 参数1 参数2` ... `!macroend`
调用语法：`!insertmacro 宏名 值1 值2`
引用参数：`${参数名}`（注意是花括号，不是 `$变量`）

```bash
; 定义宏
!macro MyMacro arg1 arg2
  MessageBox MB_OK "参数1: ${arg1}, 参数2: ${arg2}"
!macroend

; 调用宏
!insertmacro MyMacro "hello" "world"

; 实用示例：写日志宏
!macro LogMessage msg
  DetailPrint "[LOG] ${msg}"
  FileOpen $0 "$INSTDIR\install.log" a
  FileWrite $0 "${msg}$\r$\n"
  FileClose $0
!macroend

; 使用
!insertmacro LogMessage "开始安装..."
```

### 7.1 Section（安装区段）

Section 定义安装时要执行的操作，是 NSIS 的核心结构：

```bash
; Section "显示名称"
Section "安装主程序"
  ; 这里写安装时要做的事：释放文件、写注册表、创建快捷方式等
SectionEnd

; 卸载区段名称必须是 "Uninstall"
Section "Uninstall"
  ; 这里写卸载时要做的事：删除文件、清理注册表等
SectionEnd
```

- 安装时执行所有 `Section ... SectionEnd`
- 卸载时只执行 `Section "Uninstall" ... SectionEnd`
- 一个 `.nsi` 文件可以有多个 Section，用户可以在组件选择页面勾选

## 八、完整安装包示例

```bash
; =====================
; 基础头文件
; =====================
!include "MUI2.nsh"
!include "LogicLib.nsh"

; =====================
; 安装包基本信息
; =====================
Name "MyApp 1.0"
OutFile "MyApp-1.0-Setup.exe"
InstallDir "$PROGRAMFILES\MyApp"
InstallDirRegKey HKLM "Software\MyApp" "InstallDir"
RequestExecutionLevel admin  ; 请求管理员权限

; =====================
; 定义安装向导页面
; =====================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"

; =====================
; 安装区段
; =====================
Section "安装主程序"
  SetOutPath "$INSTDIR"

  ; 释放文件
  File "build\myapp.exe"
  File "build\*.dll"
  File /r "build\resources"

  ; 创建卸载程序
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; 写入注册表（安装信息）
  WriteRegStr HKLM "Software\MyApp" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MyApp" \
    "DisplayName" "MyApp"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MyApp" \
    "UninstallString" '"$INSTDIR\uninstall.exe"'

  ; 创建快捷方式（根据安装模式区分用户）
  ${If} $installMode == "all"
    CreateShortCut "$COMMONDESKTOP\MyApp.lnk" "$INSTDIR\myapp.exe"
    CreateDirectory "$COMMONSTARTMENU\MyApp"
    CreateShortCut "$COMMONSTARTMENU\MyApp\MyApp.lnk" "$INSTDIR\myapp.exe"
  ${Else}
    CreateShortCut "$DESKTOP\MyApp.lnk" "$INSTDIR\myapp.exe"
    CreateDirectory "$SMPROGRAMS\MyApp"
    CreateShortCut "$SMPROGRAMS\MyApp\MyApp.lnk" "$INSTDIR\myapp.exe"
  ${EndIf}
SectionEnd

; =====================
; 卸载区段
; =====================
Section "Uninstall"
  ; 删除文件
  RMDir /r "$INSTDIR"

  ; 删除快捷方式（两种路径都清理，避免残留）
  Delete "$DESKTOP\MyApp.lnk"
  Delete "$COMMONDESKTOP\MyApp.lnk"
  Delete "$SMPROGRAMS\MyApp\*.lnk"
  Delete "$COMMONSTARTMENU\MyApp\*.lnk"
  RMDir "$SMPROGRAMS\MyApp"
  RMDir "$COMMONSTARTMENU\MyApp"

  ; 删除注册表
  DeleteRegKey HKLM "Software\MyApp"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MyApp"
SectionEnd
```

## 九、编译与测试

```bash
; 命令行编译
makensis myscript.nsi

; 静默编译（不显示详细信息）
makensis /V1 myscript.nsi

; 定义变量编译
makensis /DVERSION=1.0.0 myscript.nsi
```

## 十、调试技巧

```bash
; 打印调试信息（显示在安装详情中）
DetailPrint "正在安装..."

; 显示调试消息框
MessageBox MB_OK "当前目录: $INSTDIR"

; 查看变量值
StrCpy $0 "test"
DetailPrint "$0 = $0"
```

## 十一、与 Electron 结合

electron-builder 底层用的就是 NSIS，通过 `include` 配置项引入你自定义的 `.nsh` 脚本，在安装生命周期的特定阶段插入逻辑。

### 11.1 electron-builder 配置

```js title="electron-builder.config.mjs"
export default {
  nsis: {
    oneClick: false,                                // 关闭一键安装，启用向导模式
    perMachine: true,                               // 允许选择"所有用户"或"当前用户"
    allowToChangeInstallationDirectory: true,       // 允许自定义安装路径
    include: 'build/installer.nsh',                 // 引入自定义脚本
  },
}
```

### 11.2 生命周期钩子

electron-builder 预留了 5 个宏，在 `build/installer.nsh` 中定义：

| 钩子 | 触发时机 | 常用场景 |
|------|----------|----------|
| `customInit` | 安装包刚打开，界面还没显示 | 检查环境、检查旧版本是否在运行 |
| `customInstall` | 文件复制完成 | 写注册表、关联文件后缀 |
| `customFinish` | 用户点"完成"前一刻 | 启动应用、执行激活脚本 |
| `customUnInit` | 卸载界面刚弹出 | 提示用户、检查应用是否在运行 |
| `customUnInstall` | 卸载文件删除完毕 | 清理 AppData 残留数据 |

### 11.3 实战：开机自启 + 自定义安装页面

这是最常见需求：安装时让用户选择是否开机自启，写入注册表，卸载时清理。

```bash title="build/installer.nsh"
; =====================================================================
; 引入依赖
; =====================================================================
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define AUTO_LAUNCH_REGISTRY_NAME "${PRODUCT_NAME}"

; =====================================================================
; 安装时逻辑（编译卸载程序时不编译这段）
; =====================================================================
!ifndef BUILD_UNINSTALLER
  ; 声明变量
  Var AutoLaunchCheckbox
  Var AutoLaunchChecked

  ; 在选择安装目录之后插入自定义页面
  !macro customPageAfterChangeDir
    Page custom AutoLaunchPageCreate AutoLaunchPageLeave
  !macroend

  ; -------------------------------------------------------------------
  ; 创建自定义页面
  ; -------------------------------------------------------------------
  Function AutoLaunchPageCreate
    !insertmacro MUI_HEADER_TEXT "设置开机自启" "设置后应用将随 Windows 开机自行启动"

    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ; 标签
    ${NSD_CreateLabel} 0 0 100% 16u "安装选项"
    Pop $1

    ; 复选框（默认勾选）
    ${NSD_CreateCheckbox} 0 22u 100% 12u "开机自动启动程序"
    Pop $AutoLaunchCheckbox
    ${NSD_Check} $AutoLaunchCheckbox

    ; 说明文字
    ${NSD_CreateLabel} 0 40u 100% 20u "勾选后，Windows 启动时将自动运行 ${PRODUCT_NAME}。"
    Pop $2

    nsDialogs::Show
  FunctionEnd

  ; -------------------------------------------------------------------
  ; 离开页面时保存用户选择
  ; -------------------------------------------------------------------
  Function AutoLaunchPageLeave
    ${NSD_GetState} $AutoLaunchCheckbox $AutoLaunchChecked
  FunctionEnd

  ; -------------------------------------------------------------------
  ; 文件复制完成后执行
  ; -------------------------------------------------------------------
  !macro customInstall
    ${If} $AutoLaunchChecked == ${BST_CHECKED}
      ; 根据安装模式写入对应的注册表位置
      ${If} $installMode == "all"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
      ${Else}
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
      ${EndIf}
    ${Else}
      ; 没勾选就清理旧的启动项（防止之前装过有残留）
      DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
      DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
    ${EndIf}
  !macroend
!endif

; =====================================================================
; 卸载时逻辑
; =====================================================================
!macro customUnInstall
  ; 干净地删除所有可能的开机自启注册表
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "${AUTO_LAUNCH_REGISTRY_NAME}"
!macroend
```

### 11.4 实战：卸载时清理用户数据

Electron 应用的用户数据（缓存、日志、数据库）默认在 `AppData/Roaming/你的应用名`，卸载时 NSIS 不会自动删除这些。

```bash title="build/installer.nsh"
!macro customUnInstall
  ; 删除用户数据目录（PRODUCT_NAME 由 electron-builder 注入）
  RMDir /r "$APPDATA\${PRODUCT_NAME}"
  RMDir /r "$LOCALAPPDATA\${PRODUCT_NAME}"
!macroend
```

### 11.5 实战：安装前检查旧版本是否在运行

```bash title="build/installer.nsh"
!include "nsProcess.nsh"

!macro customInit
  ; 检查进程是否存在
  nsProcess::_FindProcess "${APP_EXECUTABLE_FILENAME}"
  Pop $0
  ${If} $0 == 0
    MessageBox MB_OK|MB_ICONEXCLAMATION "${PRODUCT_NAME} 正在运行，请先关闭后再安装！"
    Abort
  ${EndIf}
!macroend
```
