# uv配置

> 中文网站： https://hellowac.github.io/uv-zh-cn/getting-started/installation/

## windows环境配置

### 1、安装

使用`powershell`执行以下命令：
```shell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

常用命令：
```shell
uv python list
uv python install 3.12
```

## 2、更新uv

```shell
uv self update
```

## 3、卸载
如果需要从系统中移除 uv，只需删除 uv 和 uvx 二进制文件：
```shell
$ rm $HOME\.local\bin\uv.exe
$ rm $HOME\.local\bin\uvx.exe
```

## 4、虚拟环境
### 4.1 创建虚拟环境
```shell
uv venv .venv
```
### 4.2 激活虚拟环境
```shell
cd D:\your-project  # 比如你的项目在D盘your-project文件夹
```
```shell
.venv\Scripts\Activate.ps1
```

避坑：PowerShell 执行策略报错
如果激活时提示「无法加载文件 Activate.ps1，因为在此系统上禁止运行脚本」，先执行以下命令放开权限（仅当前用户生效）：

```shell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
