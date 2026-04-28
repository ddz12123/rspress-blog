# Git 代理配置

这篇笔记记录 Git 在 Windows / macOS / Linux 下常见的代理配置方式，重点区分：

- **临时代理**：只对当前一次命令生效，不污染全局配置
- **仓库级代理**：只对当前仓库生效
- **全局代理**：对当前用户所有 Git 仓库生效

如果你本地已经有代理（例如 Clash、v2rayN、sing-box）监听在 `127.0.0.1:7890`，最推荐优先使用 **临时代理**。



## 1. 只对当前一次操作生效（推荐）

### HTTP 代理

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 pull
```

这条命令的特点：

- 只对当前这一条 `git pull` 生效
- 不会写入全局 Git 配置
- 不会写入当前仓库 `.git/config`
- 命令执行结束后，代理配置自动失效

### SOCKS5 代理

```bash
git -c http.proxy=socks5://127.0.0.1:7890 -c https.proxy=socks5://127.0.0.1:7890 pull
```

### SOCKS5 + DNS 也走代理

```bash
git -c http.proxy=socks5h://127.0.0.1:7890 -c https.proxy=socks5h://127.0.0.1:7890 pull
```

> `socks5h` 和 `socks5` 的区别在于：`socks5h` 会把 DNS 解析也交给代理处理，某些网络环境下更稳。

---

## 2. 不只是 pull，其他 Git 命令也能临时走代理

把 `pull` 换成其他命令即可：

### 临时 clone

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 clone https://github.com/user/repo.git
```

### 临时 fetch

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 fetch
```

### 临时 push

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push
```

### 临时 ls-remote

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 ls-remote origin
```

---

## 3. 当前终端会话临时生效

如果你不想每一条命令都写很长，可以给**当前终端会话**临时设置环境变量。这样仍然不会污染 Git 全局配置，但会影响当前终端窗口中的后续命令。

### PowerShell

```powershell
$env:http_proxy="http://127.0.0.1:7890"
$env:https_proxy="http://127.0.0.1:7890"
git pull
```

执行完成后清理：

```powershell
Remove-Item Env:http_proxy
Remove-Item Env:https_proxy
```

### CMD

```bat
set http_proxy=http://127.0.0.1:7890
set https_proxy=http://127.0.0.1:7890
git pull
```

当前 CMD 窗口关闭后自动失效。

### Git Bash

```bash
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
git pull
```

执行完成后清理：

```bash
unset http_proxy
unset https_proxy
```

---

## 4. 当前仓库生效

如果某个仓库经常需要代理，但你又不想影响其他仓库，可以在仓库目录中执行：

```bash
git config http.proxy http://127.0.0.1:7890
git config https.proxy http://127.0.0.1:7890
```

这会写入当前仓库的：

```text
.git/config
```

查看当前仓库代理：

```bash
git config --get http.proxy
git config --get https.proxy
```

取消当前仓库代理：

```bash
git config --unset http.proxy
git config --unset https.proxy
```

---

## 5. 全局代理（不推荐随便开）

如果你希望当前用户下所有 Git 仓库都默认走代理，可以执行：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

查看全局代理：

```bash
git config --global --get http.proxy
git config --global --get https.proxy
```

取消全局代理：

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

> 除非你长期稳定需要代理访问 GitHub，否则不建议默认开全局代理。最稳妥的做法仍然是 **单次命令临时代理**。

---

## 6. 如何判断自己应该用 HTTP 还是 SOCKS5

常见代理工具默认情况通常是：

- **Clash / Clash Verge / mihomo**：常见 `7890` 为 HTTP 代理，`7891` 可能是 SOCKS5
- **v2rayN**：通常同时提供 HTTP 和 SOCKS 端口，具体看本地设置
- **sing-box GUI 客户端**：看配置面板中的 mixed / http / socks 端口

如果你不确定：

1. 先试 HTTP：

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 pull
```

2. 如果失败，再试 SOCKS5：

```bash
git -c http.proxy=socks5://127.0.0.1:7890 -c https.proxy=socks5://127.0.0.1:7890 pull
```

---

## 7. 如何确认没有污染配置

如果你使用的是 `git -c ...` 方式，可以执行下面的命令确认没有留下代理配置：

```bash
git config --global --get http.proxy
git config --global --get https.proxy
git config --get http.proxy
git config --get https.proxy
```

如果之前没有配置过代理，正常应该都没有输出。

---

## 8. 最推荐的结论

对于“**本地有 7890 代理，现在只想临时执行一次 `git pull`**”这个场景，最推荐直接使用：

```bash
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 pull
```

它的优点是：

- 临时生效
- 不污染全局
- 不污染当前仓库
- 适合偶发性的拉取、推送、克隆

如果 HTTP 不通，再试：

```bash
git -c http.proxy=socks5://127.0.0.1:7890 -c https.proxy=socks5://127.0.0.1:7890 pull
```
