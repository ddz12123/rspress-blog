# Git 提交规范

在团队协作中，`git commit` 不只是"提交代码"，更是记录变更意图、定位问题、生成更新日志的重要依据。

如果提交信息随意书写，比如 `修改bug`、`改一下`、`update`，会导致：

- 无法快速看出本次提交改了什么
- 排查问题时难以定位回归来源
- 无法自动生成清晰的 `CHANGELOG`

因此团队通常会约定一套统一的提交规范，目前业界最通用的是 **Conventional Commits**（约定式提交）。


## 1. 规范格式

推荐采用如下结构：

```txt
<type>(<scope>): <subject>

<body>

<footer>
```

日常开发中最常用的是**标题行**：

```txt
<type>(<scope>): <subject>
```

示例：

```txt
feat(user): 新增用户头像上传功能
fix(order): 修复订单列表分页重复请求问题
docs(git): 补充 Git 提交规范说明
refactor(api): 重构请求封装，统一错误处理
```

如果本次提交没有明确的模块范围，也可以省略 `scope`：

```txt
feat: 新增深色模式切换
fix: 修复首页白屏问题
```

---

## 2. 各字段详解

### 2.1 type — 提交类型

`type` 表示本次提交的变更类型，必须从以下枚举中选择。

这是目前大多数团队（Angular、ESLint、Vue、React 等大厂/开源项目）共同采用的分类体系：

| type | 中文 | 说明 |
|------|------|------|
| `feat` | 特性 | 新增功能 |
| `fix` | 修复 | 修复 bug |
| `docs` | 文档 | 仅文档变更 |
| `style` | 格式 | 代码格式调整，不影响逻辑（空格、分号等） |
| `refactor` | 重构 | 代码重构，不新增功能也不修复 bug |
| `perf` | 性能 | 性能优化 |
| `test` | 测试 | 添加或修改测试 |
| `build` | 构建 | 构建系统、外部依赖变更（webpack、vite、npm 等） |
| `ci` | 集成 | CI 配置或脚本修改（GitHub Actions、Jenkins 等） |
| `chore` | 杂项 | 其他不修改源文件的变更 |
| `revert` | 回滚 | 回滚某次提交 |

> 这是 Angular 团队最早提出、被 Conventional Commits 规范采纳、并广泛被大厂采用的标准分类。如果你的项目需要精简，最核心的 4 个是 `feat`、`fix`、`docs`、`chore`。

### 2.2 scope — 影响范围

表示本次变更的影响范围，通常是模块名、页面名、包名或功能域。

```txt
feat(auth): 新增微信一键登录
fix(user): 修复用户头像上传失败
chore(deps): 升级 lodash 到 4.17.21
```

`scope` 应保持简洁和稳定，不要中英文混用，也不要今天写 `login` 明天写 `auth`。

如果影响范围难以用单个词概括，可以不写 scope。

### 2.3 subject — 变更描述

一句简短的话说清本次改动的目的。

建议：

- 使用简洁明确的中文或英文描述
- 聚焦"做了什么"，而不是"怎么做的"
- 不以句号结尾

```txt
✅ fix(login): 修复短信验证码倒计时未重置的问题
✅ feat(cart): 新增购物车商品批量删除功能
❌ fix: 修改问题
❌ feat: 新增功能
```

### 2.4 body — 补充描述（可选）

如果标题行不足以说明改动的上下文、动机或实现思路，可以在 body 中展开。

```txt
fix(login): 修复短信验证码倒计时未重置的问题

当用户切换页面再返回时，倒计时定时器未正确重置，
导致倒计时显示异常。现已在组件卸载时清除定时器。
```

### 2.5 footer — 引用信息（可选）

通常用于引用 Issue 或标记破坏性变更。

```txt
fix(order): 修复订单状态同步延迟问题

Closes #1289
```

---

## 3. BREAKING CHANGE（破坏性变更）

如果本次提交包含不兼容变更（接口字段修改、组件参数删除、配置项重命名等），必须显式标记。

有两种写法：

```txt
feat(api)!: 调整用户信息接口返回结构
```

或者在 footer 中详细说明：

```txt
feat(api): 调整用户信息接口返回结构

BREAKING CHANGE: user.name 已重命名为 user.nickname
```

破坏性变更标记的作用：

- 发布时识别是否需要大版本更新
- 使用方升级前明确感知风险
- 为自动化 `CHANGELOG` 生成提供依据

---

## 4. 常见示例

```txt
feat(login): 新增手机号一键登录能力
fix(user): 修复用户资料页返回后数据未刷新的问题
docs(readme): 更新项目启动说明
style(home): 调整首页卡片间距与标题字号
refactor(api): 重构请求重试逻辑，统一错误码处理
perf(list): 优化长列表滚动渲染性能
test(upload): 补充文件上传组件单元测试
build(vite): 调整打包产物目录结构
ci(actions): 优化 GitHub Actions 缓存策略
chore(deps): 升级 typescript 和 eslint 依赖
revert: 回滚支付回调重试逻辑
```

---

## 5. feat 与 fix 的区别

这是最容易混淆的两个类型。

区分方式：

- `feat`：新增原本不存在的能力
- `fix`：修复原有功能的不正确行为

```txt
feat: 新增"导出 Excel"按钮      → 原本没有导出功能，现在有了
fix: 修复导出文件名错误           → 导出功能本身存在，但行为不正确
feat: 新增筛选条件               → 筛选功能之前没有
fix: 修复筛选条件无效             → 筛选功能存在，但结果不对
```

如果一次提交既有功能新增又修了 bug，建议拆成两个提交。

---

## 6. 书写建议

### 6.1 一个提交只做一件事

不要把多个无关改动塞进同一个提交：

```txt
❌ 一边修登录 bug，一边改首页样式，一边升级依赖
✅ 拆成多个提交，每个具备独立含义
```

### 6.2 提交标题要能脱离上下文阅读

别人看提交记录时，往往不会打开代码。标题本身就应该足够清楚。

```txt
❌ fix(table): 修复表格问题
✅ fix(table): 修复表格切换分页后选中状态丢失的问题
```

### 6.3 中英文统一

`type` 和 `scope` 用英文，`subject` 建议中英文选一种。

```txt
feat(member): 新增会员积分明细页
fix(auth): fix token refresh race condition
```

只要团队统一即可。

### 6.4 禁止出现的提交信息

以下写法虽然 Git 能提交，但不推荐在任何正式分支中出现：

```txt
修改bug
修复问题
更新
再次提交
测试一下
最终版
feat: 修改bug
fix: 优化功能
```

---

## 7. 推荐的最小团队约定

如果不想一开始搞得太重，可以先只约法三章：

```txt
<type>(<scope>): <subject>
```

强制约束：

1. `type` 必须从标准枚举中选择
2. `subject` 必须写清楚改动内容（不少于 5 个字）
3. 一个提交只表达一个独立变更
4. 破坏性变更必须显式标记

这已经能解决 90% 的提交记录混乱问题，等团队稳定后再逐步细化 `scope` 管理。

---

## 8. 常用 Git 命令

### 8.1 提交相关

```bash
# 查看当前工作区状态
git status

# 暂存文件
git add <file>          # 暂存单个文件
git add .               # 暂存所有变更

# 提交
git commit -m "feat: 新增用户登录功能"

# 撤销暂存（保留工作区修改）
git restore --staged <file>

# 撤销工作区修改（不可恢复，谨慎使用）
git restore <file>

# 修改上一次提交信息（如果还没 push）
git commit --amend -m "feat(user): 新增用户登录功能"

# 把新文件追加到上一次提交
git add forgotten-file.js
git commit --amend --no-edit
```

### 8.2 查看历史

```bash
# 查看提交记录
git log
git log --oneline                  # 一行显示
git log --oneline --graph          # 图形化显示分支
git log --oneline -10              # 最近 10 条
git log --author="name"            # 按作者筛选
git log --since="2024-01-01"       # 按时间筛选
git log --grep="fix"               # 按提交信息关键词筛选

# 查看某次提交详情
git show <commit-hash>

# 查看某行代码是谁改的
git blame <file>
```

### 8.3 分支操作

```bash
# 查看分支
git branch                # 本地分支
git branch -r             # 远程分支
git branch -a             # 所有分支

# 创建并切换分支
git switch -c feat-login

# 切换分支
git switch main

# 删除本地分支
git branch -d feat-login          # 已合并的分支
git branch -D feat-login          # 强制删除（未合并）

# 删除远程分支
git push origin --delete feat-login
```

### 8.4 合并与变基

```bash
# 合并分支
git switch main
git merge feat-login

# 变基（使提交历史更线性）
git switch feat-login
git rebase main

# 交互式变基（合并、修改、重排提交）
git rebase -i HEAD~3              # 修改最近 3 个提交
```

### 8.5 暂存与恢复

```bash
# 临时保存工作区修改
git stash
git stash list                    # 查看暂存列表
git stash pop                     # 恢复并删除最近一次暂存
git stash apply stash@{0}         # 恢复指定暂存（不删除）
git stash drop stash@{0}          # 删除指定暂存
git stash clear                   # 清空所有暂存
```

### 8.6 远程操作

```bash
# 拉取远程更新
git pull                          # 等同于 git fetch + git merge
git pull --rebase                 # 等同于 git fetch + git rebase

# 推送本地提交
git push                          # 推送到当前分支的远程跟踪分支
git push origin main              # 推送到远程 main 分支
git push --force-with-lease       # 安全强制推送（比 --force 更安全）

# 查看远程仓库
git remote -v
```

### 8.7 其他实用命令

```bash
# 查看某个文件在每次提交中的变更历史
git log -p <file>

# 统计每个人的提交数量
git shortlog -sn

# 生成当前分支与 main 的差异统计
git diff main...HEAD --stat
```

---

## 参考资料

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [commitlint](https://commitlint.js.org/)
