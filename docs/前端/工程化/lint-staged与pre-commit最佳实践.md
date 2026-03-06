# lint-staged 与 pre-commit 最佳实践

在前端工程化里，`pre-commit` 阶段最常见的诉求是两类：

- 在真正提交之前，自动格式化和校验本次暂存的代码
- 拦截明显不合规的提交，避免低质量代码进入仓库

如果直接在 `pre-commit` 里跑整仓 `eslint`、`prettier`、`stylelint`、测试命令，通常会有两个问题：

- 提交很慢，影响开发体验
- 明明只改了 2 个文件，却要扫描整个项目，性价比很低

这就是 `lint-staged` 存在的意义：它只处理本次 **已暂存的文件**，让提交前检查更快、更聚焦。

而在工程实践里，`lint-staged` 通常会和 `husky`、`commitlint` 组合使用；如果团队还想进一步统一提交信息录入体验，也可以再配上 `commitizen + cz-git`：

- `husky`：管理 Git Hooks
- `pre-commit`：在提交代码前触发质量检查
- `lint-staged`：只对 staged files 执行格式化和校验
- `commitlint`：校验提交信息是否符合规范
- `commit-msg`：在提交信息写入后进行规范检查
- `commitizen + cz-git`：用交互式向导生成规范提交信息

这篇文档给一套适合团队项目直接落地的实践方案。

## 1. 这几个工具分别解决什么问题

先把职责划清楚，不然后续配置很容易混淆。

### 1.1 `husky`

`husky` 的职责很简单：把脚本挂到 Git Hook 上。

比如：

- `pre-commit` 阶段执行 `lint-staged`
- `commit-msg` 阶段执行 `commitlint`

它自己不负责 lint，也不负责格式化，只负责“在正确的时机触发正确的命令”。

### 1.2 `lint-staged`

`lint-staged` 的职责是：只对 **已暂存文件** 执行任务。

例如：

- 对本次提交涉及的 `ts/tsx/js` 文件执行 `eslint --fix`
- 对本次提交涉及的 `md/json/css` 文件执行 `prettier --write`
- 对本次提交涉及的 `css/scss/vue` 文件执行 `stylelint --fix`

这比整仓扫描快很多，也更符合提交前校验的场景。

### 1.3 `commitlint`

`commitlint` 负责约束提交信息格式，例如：

```txt
feat(user): 新增头像上传功能
fix(login): 修复登录态过期后重复跳转问题
```

它通常绑定到 `commit-msg` Hook，而不是 `pre-commit`。

## 2. 一套推荐的组合关系

推荐把三者这样组合：

- `pre-commit` -> `lint-staged`
- `commit-msg` -> `commitlint`
- Git Hooks 的创建和管理 -> `husky`

也就是说：

1. 开发者执行 `git add`
2. 开发者执行 `git commit`
3. `pre-commit` 先运行 `lint-staged`
4. 如果代码校验通过，再进入提交信息阶段
5. `commit-msg` 再运行 `commitlint`
6. 提交信息也合法，提交才真正完成

这套流程是目前前端团队里最常见、也最稳定的做法。

## 3. 为什么 `pre-commit` 更适合配合 `lint-staged`

`pre-commit` 的核心目标是：**快、稳、可重复执行**。

因此这个阶段适合放：

- `eslint --fix`
- `prettier --write`
- `stylelint --fix`
- 少量、快速、只针对本次改动的校验

不太适合放：

- 整仓单元测试
- 整仓类型检查
- 全量构建
- E2E 测试

这些任务通常更适合：

- `pre-push`
- CI 流水线

否则一次提交卡几十秒甚至几分钟，团队通常会开始想办法绕过 Hook，最后规范就失效了。

## 4. 接入步骤

下面以 `pnpm` 项目为例，给一套完整接入流程。

### 4.1 安装依赖

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

如果你暂时只想做 `pre-commit + lint-staged`，也可以先不安装 `commitlint`。

### 4.2 初始化 husky

```bash
pnpm exec husky init
```

执行后通常会生成：

- `.husky/` 目录
- `package.json` 中的 `prepare` 脚本

例如：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

`prepare` 的作用是：项目安装依赖后，自动启用 Husky Hooks。

### 4.3 配置 `lint-staged`

`lint-staged` 有多种配置方式：

- `package.json` 里的 `lint-staged` 字段
- `.lintstagedrc.json`
- `lint-staged.config.mjs`
- `lint-staged.config.cjs`

最佳实践建议：

- 简单项目可以直接放在 `package.json`
- 团队项目优先用独立配置文件
- ESM 项目优先使用 `lint-staged.config.mjs`
- CommonJS 项目优先使用 `lint-staged.config.cjs`

推荐配置示例：

```js title='lint-staged.config.mjs'
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less,vue}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write']
}
```

这套配置的含义是：

- JS/TS 文件先走 `eslint --fix`，再走 `prettier --write`
- 样式和 `vue` 文件先走 `stylelint --fix`，再走 `prettier --write`
- 文档和配置文件只走 `prettier`

### 4.4 修改 `pre-commit` Hook

把 `.husky/pre-commit` 改成：

```sh
pnpm exec lint-staged
```

如果你的项目已经有别的前置命令，也可以按顺序写多行，但建议保持 `pre-commit` 尽可能轻量。

### 4.5 配置 `commitlint`

如果你还希望同时规范提交信息，可以新增 `commitlint.config.mjs`：

```js title='commitlint.config.mjs'
export default {
  extends: ['@commitlint/config-conventional']
}
```

### 4.6 新增 `commit-msg` Hook

创建 `.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

这样就形成了完整链路：

- `pre-commit` 做代码质量校验
- `commit-msg` 做提交信息校验

## 5. 推荐的项目结构

接入完成后，一个典型项目的结构通常如下：

```txt
project
├─ .husky/
│  ├─ pre-commit
│  └─ commit-msg
├─ lint-staged.config.mjs
├─ commitlint.config.mjs
├─ package.json
├─ src/
└─ docs/
```

如果项目规模较小，也可以把 `lint-staged` 配置直接写在 `package.json`：

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less,vue}": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.{json,md,html,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

但从可维护性看，独立配置文件通常更清晰。

## 6. 三者如何配合工作

下面用一次真实提交来说明整个流程。

假设你改了这些文件：

- `src/pages/login/index.vue`
- `src/utils/request.ts`
- `README.md`

然后执行：

```bash
git add src/pages/login/index.vue src/utils/request.ts README.md
git commit -m "fix(login): 修复登录接口失败后的错误提示"
```

此时会发生：

1. Git 进入 `pre-commit`
2. `husky` 触发 `.husky/pre-commit`
3. `lint-staged` 找到当前已暂存文件
4. `vue/ts/md` 文件分别匹配对应规则
5. 执行 `eslint --fix`、`stylelint --fix`、`prettier --write`
6. 如果任务成功，继续进入 `commit-msg`
7. `husky` 触发 `.husky/commit-msg`
8. `commitlint` 校验 `fix(login): ...` 是否符合规范
9. 全部通过后，提交完成

所以三者的关系不是互相替代，而是：

- `husky` 负责触发
- `lint-staged` 负责 staged files 任务分发
- `commitlint` 负责提交信息校验

## 7. `lint-staged` 的几个关键知识点

这一部分是实践里最容易遗漏的。

### 7.1 它只处理 staged files

`lint-staged` 只会处理当前暂存区里的文件，不会直接扫描整个仓库。

因此正确用法是：

```bash
git add .
git commit -m "feat(user): 新增用户详情页"
```

而不是指望它代替整仓的 `lint` 命令。

### 7.2 它会自动把修改后的文件加入本次提交

这是一个很重要的点。

现在的 `lint-staged` 已经会自动把任务改动后的文件重新纳入本次提交，所以配置里 **不要再手写 `git add`**。

错误示例：

```json
{
  "*.ts": ["eslint --fix", "prettier --write", "git add"]
}
```

不推荐这样写，因为官方已经把这部分能力内置进去了，手动再写 `git add` 反而容易引入不必要的问题。

### 7.3 有修改类命令时，顺序要明确

如果多个命令都会改文件，比如：

- `eslint --fix`
- `stylelint --fix`
- `prettier --write`

那就应该使用数组语法，按顺序执行：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write']
}
```

不要把多个可能改同一文件的任务拆成重叠规则并发执行，否则容易出现竞争问题。

### 7.4 注意重叠 glob 带来的冲突

这是一个很常见的坑。

错误示例：

```js
export default {
  '*': 'prettier --write',
  '*.ts': 'eslint --fix'
}
```

这里 `*.ts` 文件会同时匹配两条规则，可能导致两个任务同时修改同一个文件。

更稳妥的写法是：

```js
export default {
  '!(*.ts)': 'prettier --write',
  '*.ts': ['eslint --fix', 'prettier --write']
}
```

或者像本文前面的推荐配置那样，直接按文件类型拆清楚。

### 7.5 不要在任务命令里手动再写文件路径

`lint-staged` 会把匹配到的 staged files 自动作为参数传给命令，所以通常应该这样写：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write']
}
```

而不是这样写：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint src --fix']
}
```

后一种写法本质上又退回成了“扫固定目录”，既失去了 staged files 的优势，也可能让命令行为和预期不一致。

### 7.6 `lint-staged` 默认会用 stash 保护现场

官方 README 明确提到，`lint-staged` 默认会在运行任务前创建 `git stash` 备份当前状态，以降低任务失败时的数据风险。

这意味着：

- 部分暂存文件通常能得到更稳妥的处理
- 任务失败时，工具会尽量回滚本次 Hook 过程中的变更
- 你看到的“备份原始状态”“回滚修改”等输出，通常是正常行为

所以如果提交失败，不要第一反应就怀疑 Hook 坏了，先看具体是哪条任务没通过。

### 7.7 不要在 `lint-staged` 里默认跑整仓 `tsc --noEmit`

这个问题在 TypeScript 项目里非常典型。

`lint-staged` 默认会把匹配到的 staged files 作为参数传给命令，而 `tsc` 在带文件参数时，行为和整仓类型检查并不一样，容易让人误以为“已经做了类型校验”。

更稳妥的做法是：

- 把整仓 `tsc --noEmit` 放到 `pre-push` 或 CI
- 如果你确实要在 `lint-staged` 中调用它，就用函数写法，避免自动拼接文件参数

例如：

```js
export default {
  '*.{ts,tsx}': [() => 'tsc --noEmit', 'eslint --fix', 'prettier --write']
}
```

但从团队实践角度，整仓类型检查通常不建议放在默认 `pre-commit`。

## 8. Monorepo 项目怎么做

如果你是 Monorepo，`lint-staged` 也支持多配置文件。

官方文档说明：对于某个 staged file，`lint-staged` 会优先使用 **离该文件最近的配置文件**。

例如：

```txt
repo
├─ .lintstagedrc.json
├─ packages/
│  ├─ web/
│  │  └─ .lintstagedrc.json
│  └─ admin/
│     └─ .lintstagedrc.json
```

这意味着：

- 根目录规则可以处理通用文件，比如 `md/json`
- 子包目录可以配置自己的 `eslint/stylelint` 规则
- 不同子项目可以有不同校验策略

如果团队希望统一配置，也可以只保留根目录一个 `lint-staged.config.mjs`。

## 9. 一套可以直接挪用的团队方案

如果你希望把这套能力从 0 到 1 接到团队项目里，并且希望新人照着文档就能落地，推荐直接按下面步骤执行。

这一套方案默认约束的是 3 件事：

- 提交前自动格式化和修复本次暂存文件
- 提交前只检查 staged files，不跑整仓慢任务
- 提交信息必须符合 `Conventional Commits`

### 9.1 适用前提

下面这套配置默认你项目里已经有这些基础工具中的一部分或全部：

- `eslint`
- `prettier`
- `stylelint`

如果项目暂时没有 `stylelint`，可以先把样式相关规则删掉，只保留 JS/TS 和文档类文件。

### 9.2 第一步：安装依赖

先在项目根目录安装：

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

如果你项目还没有这些工具，也建议一并装好：

```bash
pnpm add -D eslint prettier stylelint
```

### 9.3 第二步：初始化 Husky

执行：

```bash
pnpm exec husky init
```

执行后，一般会出现两个结果：

- 根目录生成 `.husky/`
- `package.json` 里生成 `prepare` 脚本

这时候先检查一下 `package.json`，至少要有下面这一段：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

如果项目原本就有其他脚本，只需要把 `prepare` 合进去，不要覆盖掉已有配置。

### 9.4 第三步：新建 `lint-staged.config.mjs`

在项目根目录创建 `lint-staged.config.mjs`，内容可以直接用下面这版：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less,vue}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write']
}
```

这份配置适合大多数前端项目，规则含义如下：

- 代码文件：先 `eslint --fix`，再 `prettier --write`
- 样式文件：先 `stylelint --fix`，再 `prettier --write`
- 文档和配置文件：只走 `prettier`

如果你的项目没有 `vue`、`stylelint` 或 `scss`，把对应后缀和命令删掉即可。

### 9.5 第四步：配置 `pre-commit`

把 `.husky/pre-commit` 改成下面这样：

```sh
pnpm exec lint-staged
```

这一步的作用是：每次执行 `git commit` 时，先让 `lint-staged` 处理本次暂存文件。

如果你是手动创建 Hook 文件，在 macOS/Linux 环境下建议再执行一次：

```bash
chmod +x .husky/pre-commit
```

### 9.6 第五步：新建 `commitlint.config.mjs`

在项目根目录创建 `commitlint.config.mjs`：

```js
export default {
  extends: ['@commitlint/config-conventional']
}
```

如果你的团队已经统一了 `type` 或 `scope`，可以后续再继续加规则；从 0 到 1 落地时，先用官方推荐配置就够了。

### 9.7 第六步：配置 `commit-msg`

创建或修改 `.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

这样就把提交信息检查也接上了。

如果你是手动新建这个文件，在 macOS/Linux 下一样建议执行：

```bash
chmod +x .husky/commit-msg
```

### 9.8 第七步：整理成统一项目结构

接完以后，项目根目录推荐长这样：

```txt
project
├─ .husky/
│  ├─ pre-commit
│  └─ commit-msg
├─ commitlint.config.mjs
├─ lint-staged.config.mjs
├─ package.json
└─ src/
```

如果你们是团队项目，建议把这些文件全部提交到仓库，避免每个人本地自己配一套。

### 9.9 第八步：跑一遍验证

接入完成后，按下面顺序验证。

先测试 `pre-commit`：

```bash
git add src/main.ts
git commit -m "chore: 测试 pre-commit hook"
```

如果配置正确：

- `lint-staged` 会执行
- 对应文件会被自动格式化或修复
- 某条规则失败时，提交会被拦截

再测试 `commit-msg`：

```bash
git commit -m "test"
```

如果配置正确，这条提交会被 `commitlint` 拦截。

最后测试一条正常提交：

```bash
git commit -m "docs(engineering): 补充 lint-staged 与 pre-commit 最佳实践"
```

如果代码和提交信息都合规，提交会成功。

### 9.10 团队项目建议这样约定

如果你是给团队落地，而不是给个人项目试水，建议顺手把下面几条也写进团队规范：

- `pre-commit` 只放快任务，不放整仓测试和构建
- `lint-staged` 不要手写 `git add`
- 会改文件的任务必须按顺序写成数组
- `commit-msg` 统一用 `commitlint`
- 慢任务统一放到 `pre-push` 或 CI

这样后面团队规模上来以后，不需要再返工整个提交流程。

### 9.11 一份可以直接复制的最终配置

如果你只想看最终结果，下面这套可以直接挪用。

`package.json`：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

`lint-staged.config.mjs`：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less,vue}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write']
}
```

`commitlint.config.mjs`：

```js
export default {
  extends: ['@commitlint/config-conventional']
}
```

`.husky/pre-commit`：

```sh
pnpm exec lint-staged
```

`.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

这套方案的特点是：

- 从 0 到 1 接入成本低
- 文件结构清楚，适合团队共享
- 职责划分明确，后续扩展也方便

## 10. 结合 `commitizen + cz-git` 使用提交向导

前面的方案解决的是“提交前检查代码”和“提交信息格式校验”。

如果你们团队还希望开发者**更容易写出合规的提交信息**，可以在这条链路上再加一层提交向导：

- `commitizen`：负责启动交互式提交流程
- `cz-git`：作为 `commitizen` 的 adapter，负责具体的问答和格式化输出
- `commitlint`：负责在 `commit-msg` 阶段做最终兜底校验

这三个工具放在一起，各自职责会更清楚：

- `commitizen + cz-git` 负责“帮助你写对”
- `commitlint` 负责“兜底拦截写错的提交信息”

### 10.1 推荐理解成“引导输入 + 最终校验”

很多团队第一次接这套方案时，容易把 `cz-git` 和 `commitlint` 的职责混在一起。

更准确的理解是：

1. 开发者执行 `git cz`、`cz`，或者项目里约定好的脚本命令
2. `commitizen` 调起 `cz-git`
3. `cz-git` 通过交互式问题引导你填写 `type`、`scope`、`subject`
4. 生成一条符合约定格式的提交信息
5. Git 进入 `commit-msg` 阶段后，`commitlint` 再做一次校验

这样做的好处是：

- 对新人更友好，不需要死记 `Conventional Commits`
- 团队提交流程更统一
- 即使有人直接执行 `git commit -m`，`commitlint` 也还能兜底

### 10.2 安装依赖

如果你已经接入了上面的 `husky + lint-staged + commitlint`，现在只需要再补装两个依赖：

```bash
pnpm add -D commitizen cz-git
```

如果你希望全局直接使用 `git cz` 或 `cz`，还可以额外全局安装 `commitizen`：

```bash
npm install -g commitizen
```

但从团队项目治理角度，更推荐：

- 项目内把 `commitizen`、`cz-git` 固定为本地依赖
- 团队统一通过脚本命令触发

这样不同成员不会因为全局版本差异导致体验不一致。

### 10.3 在 `package.json` 里指定 `cz-git` 适配器

根据 `cz-git` 官方文档，项目里需要告诉 `commitizen`：当前仓库使用哪个 adapter。

可以在 `package.json` 里加上：

```json
{
  "scripts": {
    "prepare": "husky",
    "cm": "cz"
  },
  "config": {
    "commitizen": {
      "path": "node_modules/cz-git"
    }
  }
}
```

这里建议把脚本名写成 `cm`，而不是 `commit`。原因是 `commitizen` 官方特别提醒过：如果项目里同时有 Hook 或 `precommit` 相关链路，脚本名叫 `commit` 时，某些 npm 脚本行为可能会让 `precommit` 被重复触发。

接好以后，团队可以统一使用：

```bash
pnpm run cm
```

如果你本机全局装了 `commitizen`，也可以直接用：

```bash
git cz
```

或者：

```bash
cz
```

### 10.4 `cz-git` 的配置，优先放到 `commitlint.config.mjs`

`cz-git` 官方更推荐：如果项目本身已经在用 `commitlint`，那就把交互提示相关配置直接写在 `commitlint` 配置文件里，避免把 `package.json` 塞得太重。

最简单的接法是先保留你现有的 `commitlint` 配置，只额外补一个 `prompt` 字段：

```js
export default {
  extends: ['@commitlint/config-conventional'],
  prompt: {
    useEmoji: false
  }
}
```

这意味着：

- `commitlint` 继续负责校验提交信息
- `cz-git` 读取同一份配置里的 `prompt` 选项

如果后面你们团队想继续定制：

- 可选的 `type` 列表
- 是否启用 emoji
- `scope` 的选择方式
- issue / breaking change 的提示文案

也建议继续优先放在 `commitlint.config.mjs` 里维护。

### 10.5 一套和本文方案配套的最小落地配置

如果你希望把“代码检查 + 提交信息向导 + 提交信息校验”一次接完整，最小版本可以是这样：

`package.json`：

```json
{
  "scripts": {
    "prepare": "husky",
    "cm": "cz"
  },
  "config": {
    "commitizen": {
      "path": "node_modules/cz-git"
    }
  }
}
```

`commitlint.config.mjs`：

```js
export default {
  extends: ['@commitlint/config-conventional'],
  prompt: {
    useEmoji: false
  }
}
```

`.husky/pre-commit`：

```sh
pnpm exec lint-staged
```

`.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

### 10.6 实际使用流程

日常提交时，推荐团队这样操作：

```bash
git add .
pnpm run cm
```

然后按交互提示依次选择或填写：

- `type`，比如 `feat`、`fix`、`docs`
- `scope`，比如 `blog`、`build`、`lint-staged`
- `subject`，也就是一句简短说明

提交时整条链路会按下面顺序执行：

1. `commitizen` 启动交互式提交
2. `cz-git` 生成提交信息
3. `pre-commit` 执行 `lint-staged`
4. `commit-msg` 执行 `commitlint`
5. 全部通过后，提交完成

### 10.7 团队落地时的两个建议

第一，不要把 `commitizen + cz-git` 误当成 `commitlint` 的替代品。

原因很简单：

- 向导是“帮助你写”
- 校验是“防止你绕过向导后写错”

第二，不要强制把交互式提交绑进默认 `pre-commit`。

更稳的做法是：

- 团队约定平时优先用 `pnpm run cm` 或 `git cz`
- 仓库继续保留 `commit-msg -> commitlint` 作为兜底

这样开发体验和稳定性通常会更平衡。

## 11. 验证步骤

如果你是第一次落地这套方案，建议按下面的检查单走一遍：

1. 确认 `package.json` 已经有 `prepare`
2. 确认根目录存在 `.husky/pre-commit`
3. 确认根目录存在 `.husky/commit-msg`
4. 确认根目录存在 `lint-staged.config.mjs`
5. 确认根目录存在 `commitlint.config.mjs`
6. 故意提交一条错误信息，验证 `commitlint` 会拦截
7. 故意提交一个格式有问题的文件，验证 `lint-staged` 会处理

全部通过以后，这套链路才算真正接好了。
## 12. 常见问题

### 12.1 为什么 `pre-commit` 很慢

常见原因：

- 在 Hook 里跑了整仓任务
- 跑了测试、构建、类型检查
- `lint-staged` 规则写得过重

解决方式：

- `pre-commit` 只保留 staged files 相关检查
- 慢任务移到 `pre-push` 或 CI

### 12.2 为什么文件被改了但没有提交成功

这是因为某个任务修改了文件后，后续校验又失败了。默认情况下，`lint-staged` 会处理回滚和暂存状态保护。

如果你看到了文件被格式化但提交被中断，通常不是异常，而是某个检查没通过。

### 12.3 使用后提交失败，感觉代码丢失了，怎么还原

这个场景最常见的原因不是“代码真的没了”，而是 `lint-staged` 在失败时把工作区和暂存区状态回滚了，导致你以为刚才的修改被吞掉了。

官方文档明确说明：`lint-staged` 默认会在运行前创建一个 `git stash` 备份，用来防止数据丢失。

遇到这种情况，先不要继续执行 `git reset --hard` 或手动乱改文件，优先按下面步骤恢复。

第一步，查看 stash 列表：

```bash
git stash list --format="%h %s"
```

如果是 `lint-staged` 生成的备份，通常会看到类似这样的记录：

```bash
abc1234 On main: lint-staged automatic backup
```

第二步，把这份备份恢复回来，并尽量恢复到暂存区：

```bash
git apply --index abc1234
```

如果你更习惯用 `stash@{0}` 这种写法，也可以：

```bash
git stash apply --index stash@{0}
```

恢复后建议立刻执行：

```bash
git status
```

确认文件和暂存状态都已经回来。

如果确认恢复成功，再决定是：

- 修正 Hook 报错后重新提交
- 临时把修改先保存到新分支或额外 commit 中

如果你确定这条 stash 已经没用了，可以最后再手动删除：

```bash
git stash drop stash@{0}
```

需要注意两个例外场景：

- 如果项目用了 `--no-stash`，那 `lint-staged` 不会生成备份 stash
- 如果项目用了 `--diff`，官方文档说明它会隐式启用 `--no-stash`

这两种情况下，就不能指望从 `lint-staged automatic backup` 里恢复，只能去看：

- 当前工作区是否还保留改动
- IDE 的 Local History
- 你自己是否有额外 stash、分支或 patch 备份

### 12.4 为什么有的文件没被处理

先检查 3 件事：

- 文件是否真的 `git add` 进暂存区了
- glob 规则是否匹配到该文件
- 对应工具本身是否忽略了该文件，例如 `.prettierignore`

### 12.5 Windows 下有什么要注意的

建议注意两点：

- Hook 文件使用 `UTF-8` 编码
- 手动创建 Hook 时，注意 `"$1"` 等参数写法不要被 shell 转义破坏

## 13. 一页总结

`lint-staged + pre-commit` 的核心价值，不是“把所有检查都塞进提交前”，而是：

- 只检查本次提交的文件
- 用最快的方式拦截低级问题
- 把慢任务留给 `pre-push` 或 CI

推荐团队采用下面这套职责分工：

- `husky` 管理 Git Hooks
- `pre-commit` 运行 `lint-staged`
- `lint-staged` 只处理 staged files
- `commitizen + cz-git` 负责引导生成提交信息
- `commit-msg` 运行 `commitlint`
- `pre-push` 或 CI 承担整仓类型检查、测试和构建

如果你希望它长期稳定，不要忽略这几个最佳实践：

- 不要在 `lint-staged` 里再写 `git add`
- 修改类命令要用数组语法保证顺序
- 避免重叠 glob 造成并发冲突
- 不要在默认 `pre-commit` 里跑整仓慢任务
- 团队统一配置文件位置和 Hook 写法

当这套链路配置清楚以后，开发者的提交流程会更稳定，代码质量也更容易长期维持。

## 参考资料

- [lint-staged README](https://github.com/lint-staged/lint-staged)
- [Husky Get Started](https://typicode.github.io/husky/get-started.html)
- [commitlint Getting Started](https://commitlint.js.org/guides/getting-started.html)
- [commitlint Local Setup](https://commitlint.js.org/guides/local-setup.html)
- [Commitizen README](https://github.com/commitizen/cz-cli)
- [cz-git Getting Started](https://cz-git.qbb.sh/guide/)
- [cz-git Configure Template](https://cz-git.qbb.sh/config/)



