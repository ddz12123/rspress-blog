# uv 入门与常用配置

> 中文文档：<https://hellowac.github.io/uv-zh-cn/getting-started/installation/>
>
> 官方文档：<https://docs.astral.sh/uv/>

`uv` 是 Astral 团队开发的 Python 包管理工具，可以用来安装依赖、创建虚拟环境、管理 Python 版本、初始化项目和运行临时命令行工具。它的定位可以理解为：把 `pip`、`venv`、`pip-tools`、`pyenv`、`pipx` 等常见工具的一部分能力整合到一个更快的命令行工具里。

## 为什么使用 uv

对初学者来说，`uv` 最大的优势是“命令少、速度快、场景统一”：

- **安装依赖更快**：`uv pip install` 的使用方式接近 `pip`，但解析和安装速度通常更快。
- **虚拟环境更省心**：可以用 `uv venv` 快速创建 `.venv`，也可以用 `uv run` 直接在项目环境中运行命令。
- **Python 版本管理方便**：可以安装、查看、切换不同 Python 版本。
- **项目管理更完整**：新项目可以用 `uv init`、`uv add`、`uv sync` 管理 `pyproject.toml` 和 `uv.lock`。
- **临时工具不用全局安装**：`uvx` 可以像 Node.js 里的 `npx` 一样临时运行 Python 命令行工具。

如果只是维护老项目，可以先把 `uv` 当作更快的 `pip + venv` 使用；如果是新项目，推荐直接使用 `uv` 的项目管理能力。

## Windows 安装、更新与卸载

### 安装 uv

在 PowerShell 中执行：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装完成后，重新打开终端，检查版本：

```powershell
uv --version
```

如果提示找不到 `uv` 命令，通常是环境变量还没有刷新。可以先关闭当前终端并重新打开；如果仍然无效，检查用户目录下的安装路径是否已加入 `PATH`，常见路径如下：

```text
C:\Users\你的用户名\.local\bin
```

### 更新 uv

```powershell
uv self update
```

### 卸载 uv

如果是通过官方安装脚本安装的 uv，可以删除 `uv.exe` 和 `uvx.exe`：

```powershell
Remove-Item "$HOME\.local\bin\uv.exe"
Remove-Item "$HOME\.local\bin\uvx.exe"
```

如果你使用的是其他安装方式，例如 `winget`、`scoop` 或 `pipx`，应使用对应工具的卸载命令。

## 常用命令速查

| 场景 | 命令 |
| --- | --- |
| 查看 uv 版本 | `uv --version` |
| 查看 Python 版本列表 | `uv python list` |
| 安装 Python 3.12 | `uv python install 3.12` |
| 查找当前 Python 路径 | `uv python find` |
| 创建虚拟环境 | `uv venv .venv` |
| 指定 Python 创建虚拟环境 | `uv venv .venv --python 3.12` |
| 安装包 | `uv pip install requests` |
| 安装 requirements.txt | `uv pip install -r requirements.txt` |
| 导出依赖 | `uv pip freeze > requirements.txt` |
| 初始化项目 | `uv init` |
| 添加项目依赖 | `uv add requests` |
| 添加开发依赖 | `uv add --dev pytest ruff` |
| 移除项目依赖 | `uv remove requests` |
| 同步项目环境 | `uv sync` |
| 运行项目命令 | `uv run python main.py` |
| 临时运行工具 | `uvx ruff check .` |

## Python 版本管理

`uv` 可以安装和管理独立的 Python 版本，适合需要在多个项目之间切换 Python 版本的场景。

查看可安装或已安装的 Python 版本：

```powershell
uv python list
```

安装指定 Python 版本：

```powershell
uv python install 3.12
```

安装多个版本：

```powershell
uv python install 3.11 3.12
```

查看当前项目或环境使用的 Python 路径：

```powershell
uv python find
```

删除 uv 管理的某个 Python 版本：

```powershell
uv python uninstall 3.12
```

创建虚拟环境时可以直接指定 Python 版本：

```powershell
uv venv .venv --python 3.12
```

如果本机没有对应版本，先安装再创建：

```powershell
uv python install 3.12
uv venv .venv --python 3.12
```

## 使用 uv venv 管理虚拟环境

虚拟环境用于隔离项目依赖，避免不同项目之间的包版本互相影响。Python 项目通常会把虚拟环境目录命名为 `.venv`。

### 创建虚拟环境

在项目根目录执行：

```powershell
uv venv .venv
```

指定 Python 版本创建：

```powershell
uv venv .venv --python 3.12
```

### 激活虚拟环境

先进入项目目录，例如：

```powershell
cd D:\your-project
```

PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

CMD：

```bat
.venv\Scripts\activate.bat
```

Git Bash：

```bash
source .venv/Scripts/activate
```

macOS / Linux：

```bash
source .venv/bin/activate
```

激活成功后，终端前面通常会出现 `(.venv)`。

### 在虚拟环境中安装依赖

激活虚拟环境后，可以使用 `uv pip` 安装依赖：

```powershell
uv pip install requests
```

安装多个依赖：

```powershell
uv pip install requests fastapi uvicorn
```

安装指定版本：

```powershell
uv pip install "django==5.0.0"
```

查看已安装依赖：

```powershell
uv pip list
```

查看某个包的信息：

```powershell
uv pip show requests
```

退出虚拟环境：

```powershell
deactivate
```

### 不激活虚拟环境运行命令

如果当前项目下有 `.venv`，很多时候可以直接使用 `uv run`，uv 会自动使用项目环境：

```powershell
uv run python main.py
```

运行一段简单 Python 代码：

```powershell
uv run python -c "import sys; print(sys.version)"
```

运行测试：

```powershell
uv run pytest
```

运行 FastAPI 项目：

```powershell
uv run uvicorn main:app --reload
```

这种方式的好处是不用手动激活虚拟环境，命令也更容易写进脚本或文档。

## uv pip 与 requirements.txt

对于已经使用 `requirements.txt` 的老项目，可以把 `uv pip` 当作更快的 `pip` 使用。

### 从 requirements.txt 安装依赖

```powershell
uv venv .venv --python 3.12
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
```

### 安装、升级和卸载依赖

安装依赖：

```powershell
uv pip install requests
```

升级依赖：

```powershell
uv pip install --upgrade requests
```

卸载依赖：

```powershell
uv pip uninstall requests
```

### 导出 requirements.txt

```powershell
uv pip freeze > requirements.txt
```

适合简单项目的基本流程：

```powershell
uv venv .venv --python 3.12
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
uv run python main.py
```

新增依赖后，如果项目仍然使用 `requirements.txt` 管理依赖，记得重新导出：

```powershell
uv pip freeze > requirements.txt
```

## 使用 uv 管理项目

新项目更推荐使用 `uv init`、`uv add`、`uv remove`、`uv sync` 和 `uv run`。这套方式会使用 `pyproject.toml` 描述项目依赖，并使用 `uv.lock` 锁定依赖版本。

### 初始化项目

创建新项目：

```powershell
uv init my-project
cd my-project
```

在当前目录初始化：

```powershell
uv init
```

初始化后，项目中通常会出现 `pyproject.toml`。后续通过 `uv add` 添加的依赖会写入这个文件。

### 添加依赖

添加运行时依赖：

```powershell
uv add requests
```

添加多个运行时依赖：

```powershell
uv add fastapi uvicorn
```

添加开发依赖：

```powershell
uv add --dev pytest ruff
```

### 移除依赖

```powershell
uv remove requests
```

### 同步项目环境

```powershell
uv sync
```

`uv sync` 会根据 `pyproject.toml` 和 `uv.lock` 创建或同步虚拟环境。团队协作或部署时，推荐使用它还原依赖环境，而不是手动一个个安装包。

### 运行项目命令

运行 Python 脚本：

```powershell
uv run python main.py
```

运行项目里的命令行工具：

```powershell
uv run pytest
uv run ruff check .
```

如果项目里有 `pyproject.toml` 和 `uv.lock`，推荐优先使用：

```powershell
uv sync
uv run python main.py
```

## 使用 uvx 临时运行工具

`uvx` 适合临时运行 Python 命令行工具，不需要提前全局安装。可以把它理解成 Python 生态里的 `npx`。

例如临时运行 `ruff`：

```powershell
uvx ruff check .
```

查看 `ruff` 帮助：

```powershell
uvx ruff --help
```

临时运行 `httpie`：

```powershell
uvx httpie --help
```

适合使用 `uvx` 的场景：

- 偶尔使用某个格式化、检查或脚手架工具。
- 不想把工具安装到全局环境。
- 想快速试用某个命令行工具。

如果某个工具是当前项目长期需要的，例如 `pytest`、`ruff`，更推荐使用：

```powershell
uv add --dev pytest ruff
uv run pytest
uv run ruff check .
```

## PowerShell 执行策略问题

在 Windows 上激活虚拟环境时，可能会遇到类似报错：

```text
无法加载文件 .venv\Scripts\Activate.ps1，因为在此系统上禁止运行脚本。
```

这是 PowerShell 执行策略限制导致的。通常只需要对当前用户放开本地脚本执行权限：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新激活：

```powershell
.\.venv\Scripts\Activate.ps1
```

如果不想修改执行策略，也可以不激活虚拟环境，直接使用 `uv run`：

```powershell
uv run python main.py
```

## 推荐工作流

### 老项目：继续使用 requirements.txt

适合已有项目、教学示例或简单脚本：

```powershell
uv venv .venv --python 3.12
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
uv run python main.py
```

新增依赖后：

```powershell
uv pip install requests
uv pip freeze > requirements.txt
```

### 新项目：使用 pyproject.toml 和 uv.lock

适合新项目，推荐优先使用：

```powershell
uv init
uv add requests
uv add --dev pytest ruff
uv run python main.py
```

其他人拉取项目后，只需要：

```powershell
uv sync
uv run python main.py
```

这种方式的优点是依赖来源更清晰，`uv.lock` 可以保证不同机器安装到一致的依赖版本。

### 日常命令习惯

- 运行项目：优先使用 `uv run ...`。
- 安装临时工具：优先使用 `uvx ...`。
- 管理老项目依赖：使用 `uv pip install -r requirements.txt`。
- 管理新项目依赖：使用 `uv add`、`uv remove`、`uv sync`。
- 团队协作项目：提交 `pyproject.toml` 和 `uv.lock`，不要提交 `.venv`。

## 常见问题

### uv pip 和 pip 有什么区别？

`uv pip` 的命令形式和 `pip` 很像，但底层由 uv 实现，速度通常更快。常见命令基本可以平替：

```powershell
pip install requests
uv pip install requests
```

如果项目已经使用 `requirements.txt`，迁移成本很低，通常把安装命令从 `pip install -r requirements.txt` 换成 `uv pip install -r requirements.txt` 即可。

### uv venv 和 python -m venv 有什么区别？

二者目的类似，都是创建虚拟环境。区别是 `uv venv` 更快，并且可以更方便地配合 `uv python install` 指定 Python 版本：

```powershell
uv python install 3.12
uv venv .venv --python 3.12
```

### .venv 要不要提交到 Git？

不要。

`.venv` 是本机生成的虚拟环境目录，体积大且和系统相关。通常应该提交的是：

- `requirements.txt`
- `pyproject.toml`
- `uv.lock`

如果使用 Git，可以把 `.venv` 加入 `.gitignore`：

```text
.venv/
```

### uv.lock 要不要提交？

如果使用 `uv add`、`uv sync` 这套项目管理方式，建议提交 `uv.lock`。这样可以保证团队成员和部署环境安装到一致的依赖版本。

### requirements.txt 和 pyproject.toml 应该选哪个？

简单建议：

- 维护老项目：继续使用 `requirements.txt`，用 `uv pip` 提速。
- 新建项目：优先使用 `pyproject.toml` 和 `uv.lock`，用 `uv add`、`uv sync` 管理依赖。

不要在同一个项目里混用太多依赖管理方式，否则初学者很容易分不清应该改哪个文件。

### 为什么已经安装了依赖，运行时还是提示找不到包？

常见原因是“安装依赖的环境”和“运行代码的环境”不是同一个。可以按下面顺序检查：

```powershell
uv python find
uv pip list
uv run python -c "import sys; print(sys.executable)"
```

推荐在项目目录下统一使用 `uv run` 运行命令，减少环境不一致的问题。

### 什么时候用 uvx，什么时候用 uv add --dev？

偶尔运行一次的工具用 `uvx`：

```powershell
uvx ruff check .
```

项目长期需要的开发工具用 `uv add --dev`：

```powershell
uv add --dev ruff
uv run ruff check .
```
