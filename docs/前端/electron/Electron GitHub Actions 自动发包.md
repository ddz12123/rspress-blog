# Electron GitHub Actions 自动发包

> 打 tag 自动触发 → 多平台并行打包 → 产物自动上传到 GitHub Releases

手动在自己电脑上 `build:win` / `build:mac` / `build:linux` 打包，有两个痛点：一是一台电脑通常只能打自己这个系统的包，二是每次发版都要手动跑命令、手动传文件。用 GitHub Actions 可以做到：**只在你想发版时打一个 tag，云端就自动帮你把三大平台的安装包都打好并挂到 Releases 上**。

## 一、整体流程

```text
本地改代码 ── git push ──────────────▶  普通提交，什么都不触发
                                        （日常开发想推多少次都行）

想发版时：
git tag vX.Y.Z ── git push tag ──▶  GitHub Actions 被触发
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              windows runner       macos runner        ubuntu runner
              打 .exe 安装包        打 .dmg / .zip      打 AppImage/deb
                    └───────────────────┼───────────────────┘
                                        ▼
                             上传到 GitHub Releases（草稿）
                                        ▼
                              你检查无误 → 点击 Publish
```

核心思想：**打包这件事交给云端的多台机器并行做，你只负责「打 tag」这个动作。**

## 二、前置：electron-builder 的发布源配置

要让 electron-builder 知道「打完包传到哪」，需要在 `electron-builder.yml` 里配置 `publish` 为 github：

```yaml
# electron-builder.yml
appId: xxx.xxx.xxx           # 应用唯一标识，如 io.github.xxx.xxx
productName: xxx             # 应用名

publish:
  provider: github
  owner: xxx                 # GitHub 用户名 / 组织名
  repo: xxx                  # 仓库名
```

同时建议在 `package.json` 里补全仓库信息（开源项目规范，也方便 electron-builder 兜底读取）：

```json
{
  "name": "xxx",
  "version": "x.y.z",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/xxx/xxx.git"
  }
}
```

> 这套 `publish` 配置同时也是「自动更新」功能的更新源，运行时更新的详细做法见本目录的《Electron 自动更新升级》。发包和自动更新用的是同一份配置。

## 三、为什么用 tag 触发，而不是每次 push

发包是低频、重量级操作（三平台并行、每次几分钟、消耗 CI 额度），**绝不能每次 `git push` 都跑**。所以工作流只监听「推送 tag」这一种事件：

```yaml
on:
  push:
    tags:
      - 'v*'          # 只有以 v 开头的 tag 才触发
  workflow_dispatch:  # 允许在网页上手动点按钮触发
```

关键：`push` 下面只写了 `tags`、**没有写 `branches`**。效果如下：

| 操作 | 是否触发发包 |
| --- | --- |
| `git push`（推代码到分支） | ❌ 不触发 |
| 推一个不以 v 开头的 tag | ❌ 不触发 |
| `git push origin vX.Y.Z` | ✅ 触发 |
| 网页 Actions 页手动 Run | ✅ 触发 |

这样日常开发随便推，只有明确要发版时打 `vX.Y.Z` 才会启动打包。

## 四、编写工作流

在仓库根目录新建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

# electron-builder 用内置的 GITHUB_TOKEN 建 Release、传产物，需要写权限
permissions:
  contents: write

# 同一个 tag 重复推送时，取消上一次没跑完的运行
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: true

jobs:
  release:
    strategy:
      fail-fast: false          # 某个平台失败，不影响其它平台继续
      matrix:
        include:
          - os: windows-latest
            args: '--win'
          - os: macos-latest
            args: '--mac'
          - os: ubuntu-latest
            # 跳过 snap：CI 上打 snap 需要额外工具链，容易失败
            args: '--linux AppImage deb'
    runs-on: ${{ matrix.os }}

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm            # 用 pnpm/yarn 就改成对应值

      - name: 安装依赖
        run: npm ci             # 依赖 lockfile，比 npm install 更稳定可复现

      - name: 构建 + 打包 + 发布
        run: |
          npm run build
          npx electron-builder ${{ matrix.args }} --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

几个要点解释：

- **`matrix`**：一次定义三个平台，GitHub 会开三台不同系统的 runner 并行跑。想只发某个平台，删掉对应行即可。
- **`--publish always`**：强制打完就上传。不加这个参数默认不会上传。
- **`npx electron-builder`**：electron-builder 是 devDependency，`npm ci` 之后就能直接用。

## 五、GH_TOKEN 从哪来

**不需要你手动申请 token。** GitHub Actions 每次运行会自动注入一个临时的 `secrets.GITHUB_TOKEN`，把它赋值给 electron-builder 认识的环境变量 `GH_TOKEN` 即可：

```yaml
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

要让这个 token 有「创建 Release、上传文件」的权限，两处二选一（工作流里写了 `permissions` 一般就够）：

1. 工作流顶部声明（推荐，已在上面写了）：
   ```yaml
   permissions:
     contents: write
   ```
2. 或仓库 `Settings → Actions → General → Workflow permissions` 选 **Read and write permissions**。

> 如果上传产物时报 **403 Forbidden**，基本都是权限没给够，检查上面两处。

## 六、版本号与 tag 必须对应

electron-builder 是按 `package.json` 里的 `version` 决定往哪个 Release 传的（tag 名 = `v` + version）。所以规矩是：

**先改版本号，再打对应的 tag。**

```bash
# 1. 把 package.json 的 version 改成 x.y.z
#    可手动改，或用下面命令自动改并打 tag
npm version x.y.z

# 2. 推代码和 tag
git push
git push origin vx.y.z
```

如果 tag 和 `version` 对不上（比如 `version` 是 `1.0.0` 却推了 `v2.0.0` 的 tag），electron-builder 仍会往 `v1.0.0` 的 Release 传，导致「tag 和产物对不上」。务必保持一致。

## 七、草稿 Release vs 直接发布

electron-builder 默认把产物传到一个 **草稿（draft）Release**，不会立刻公开。好处是可以先检查产物、补写更新日志，确认没问题再手动点 **Publish release**。

想让它跳过草稿、直接公开，在配置里加：

```yaml
publish:
  provider: github
  owner: xxx
  repo: xxx
  releaseType: release      # draft(默认) | prerelease | release
```

## 八、各平台注意点

| 平台 | 产物 | 注意事项 |
| --- | --- | --- |
| Windows | `xxx-setup.exe`(NSIS) | 无签名会有 SmartScreen 提示；正式发布建议做代码签名 |
| macOS | `.dmg` / `.zip` | 未签名/未公证时，用户首次打开需右键「打开」绕过 Gatekeeper；`macos-latest` 默认是 Apple 芯片，产出 arm64 包 |
| Linux | `AppImage` / `deb` | `snap` 在 CI 上打包需额外工具链，建议用命令行参数 `--linux AppImage deb` 跳过 |

代码签名（Windows 证书 / macOS 开发者证书）需要把证书和密码放进仓库 Secrets 再在工作流里引用，属于进阶话题，开源项目初期通常先发未签名版本。

## 九、完整发布操作

```bash
# 0. 确认 electron-builder.yml 的 publish 已配好 github，且 remote 指向目标仓库

# 1. 提交工作流文件和其它改动
git add .github/workflows/release.yml
git commit -m "ci: 新增多平台发布工作流"
git push

# 2. 更新版本号并打 tag（npm version 会自动改 package.json 并创建 tag）
npm version x.y.z

# 3. 推送 tag，触发发包
git push origin vx.y.z
```

推完 tag 后：

1. 打开仓库 **Actions** 页，看到三平台的构建任务在跑。
2. 全部跑完后，进 **Releases** 页，会有一个草稿 Release，里面挂着各平台安装包。
3. 检查无误 → 编辑更新日志 → 点 **Publish release** 正式发布。

## 十、常见问题

**Q：普通 push 会不会触发打包？**
不会。工作流只监听 `v*` tag，日常推代码完全不受影响。

**Q：`git push --tags` 会触发吗？**
如果这次连带推送的 tag 里包含新的 `v*` tag，会触发——这是符合预期的。只要不打 `v` 开头的 tag 就不会。

**Q：某个平台失败了怎么办？**
`fail-fast: false` 保证其它平台继续跑。修好后重新推 tag（需先删除旧 tag 或用新版本号），或在 Actions 页面点 **Re-run**。

**Q：CI 太慢 / 只想发一个平台？**
把 `matrix.include` 里不需要的平台行删掉即可，比如只留 `windows-latest`。

**Q：想每次 push 到主分支就做代码检查（但不打包）？**
那是另一个独立的 CI 工作流（只跑 `lint` + `typecheck`），和这个发布工作流互不影响，可单独再建一个 `ci.yml`。

## 相关阅读

- 《Windows 下 Electron 打包配置指南》——本地打包与 electron-builder.yml 详解
- 《Electron 自动更新升级》——运行时从 Releases 拉取更新，与本文共用同一份 publish 配置
