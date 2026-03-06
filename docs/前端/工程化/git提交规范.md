# git提交规范

在团队协作开发中，`git commit` 不只是“提交代码”，更是记录变更意图、定位问题、生成变更日志的重要依据。

如果提交信息随意书写，比如：`修改bug`、`改一下`、`update`、`重新提交`，短期看似省事，长期会带来几个典型问题：

- 无法快速看出本次提交到底改了什么
- 排查问题时，很难从提交记录中定位责任变更
- 发布版本时，难以自动生成清晰的更新日志
- 团队成员提交风格不统一，历史记录可读性很差

因此，团队通常会约定一套统一的 Git 提交规范，其中最常见的一种就是 `Conventional Commits`。

## 1. 为什么要规范提交信息

提交规范的核心价值，不是“形式统一”，而是让提交记录具备工程价值。

带来的直接收益包括：

- 提高提交历史的可读性
- 方便代码审查和问题追踪
- 便于统计功能变更和修复记录
- 便于自动生成 `CHANGELOG`
- 为语义化版本发布提供基础

举个例子，下面两条提交记录的可读性差异非常明显：

```bash
git commit -m "修改登录问题"
git commit -m "fix(auth): 修复登录态过期后接口重复重试的问题"
```

第二条不仅说明了这是一个 `fix`，还标明了影响范围是 `auth`，同时把修复内容说清楚了，后续查问题时会轻松很多。

## 2. 推荐规范：Conventional Commits

推荐团队采用如下结构：

```txt
<type>(<scope>): <subject>
```

例如：

```txt
feat(user): 新增用户头像上传功能
fix(order): 修复订单列表分页重复请求问题
docs(git): 补充 git 提交规范说明
refactor(api): 重构请求封装，统一错误处理
chore(deps): 升级 eslint 到 9.x
```

如果本次提交没有明确模块范围，也可以省略 `scope`：

```txt
feat: 新增深色模式切换
fix: 修复首页白屏问题
```

## 3. 提交信息结构说明

一条规范的提交信息，通常由以下几部分组成：

```txt
<type>(<scope>): <subject>

<body>

<footer>
```

日常开发中，最常用的是第一行，也就是标题行。

### 3.1 `type`

`type` 表示本次提交的变更类型。

常用类型如下：

- `feat`：新增功能
- `fix`：修复问题
- `docs`：文档变更
- `style`：代码格式调整，不影响逻辑
- `refactor`：代码重构，不新增功能也不修复 bug
- `perf`：性能优化
- `test`：补充或修改测试
- `build`：构建系统或依赖相关修改
- `ci`：CI/CD 配置修改
- `chore`：杂项修改，通常不涉及业务代码
- `revert`：回滚某次提交

### 3.2 `scope`

`scope` 表示影响范围，通常写模块名、页面名、包名或功能域。

例如：

- `auth`
- `user`
- `order`
- `home`
- `api`
- `build`
- `deps`

建议 `scope` 保持简洁、稳定，不要一会儿写中文，一会儿写英文，也不要今天写 `login`、明天写 `auth`，否则统计价值会下降。

### 3.3 `subject`

`subject` 是本次提交的简短说明，要求一句话说清变更内容。

建议：

- 使用简洁明确的描述
- 聚焦“做了什么”
- 不要写成流水账
- 不要以句号结尾

推荐写法：

```txt
fix(login): 修复短信验证码倒计时未重置的问题
feat(cart): 新增购物车商品批量删除功能
```

不推荐写法：

```txt
fix: 修改问题
feat: 新增功能
update: 调整代码
```

## 4. `BREAKING CHANGE` 也要写清楚

这是很多团队容易遗漏的点。

如果一次提交包含不兼容变更，比如接口字段修改、组件参数删除、配置项重命名，那么除了正常的 `type` 之外，还应该显式标记破坏性变更。

常见写法有两种：

```txt
feat(api)!: 调整用户信息接口返回结构
```

或者：

```txt
feat(api): 调整用户信息接口返回结构

BREAKING CHANGE: user.name 已重命名为 user.nickname
```

这样做的意义在于：

- 方便发布时识别重大变更
- 方便自动化生成版本日志
- 让使用方在升级前明确感知风险

## 5. 常用提交类型示例

### 5.1 新功能

```bash
git commit -m "feat(profile): 新增个人中心头像裁剪功能"
```

### 5.2 修复 bug

```bash
git commit -m "fix(pay): 修复支付结果页重复轮询问题"
```

### 5.3 文档修改

```bash
git commit -m "docs(git): 补充提交规范与示例说明"
```

### 5.4 重构代码

```bash
git commit -m "refactor(request): 拆分请求拦截器与错误处理逻辑"
```

### 5.5 性能优化

```bash
git commit -m "perf(list): 优化长列表滚动渲染性能"
```

### 5.6 依赖升级

```bash
git commit -m "chore(deps): 升级 vue 和 pinia 版本"
```

### 5.7 回滚提交

```bash
git commit -m "revert: 回滚支付回调重试逻辑"
```

## 6. 提交信息书写建议

除了格式正确，还建议遵守下面几条原则。

### 6.1 一次提交只做一件事

不要把多个无关改动塞进同一个提交中，比如：

- 一边修登录 bug
- 一边改首页样式
- 一边升级依赖

这种提交即使格式规范，也依然不利于 review 和回滚。

更合理的方式是拆成多个提交，让每个提交具备独立含义。

### 6.2 提交标题要能脱离上下文阅读

别人看提交记录时，往往不会先打开代码。因此标题本身就应该足够清楚。

例如：

```txt
fix(table): 修复表格切换分页后选中状态丢失的问题
```

这个描述即使脱离上下文，也能看懂改动目的。

### 6.3 不要把临时代码直接提交到主分支

以下这类提交信息通常说明提交质量较低：

```txt
test
临时提交
wip
again
final
最终版
```

如果确实处于开发中间态，可以在个人分支使用 `WIP` 提交，但合并前最好整理成可读、可回溯的提交历史。

### 6.4 中文还是英文要统一

团队可以选择中文或英文描述，但最好统一。

常见做法有两种：

- `type/scope` 用英文，`subject` 用中文
- 全部使用英文

例如：

```txt
feat(member): 新增会员积分明细页
fix(auth): fix token refresh race condition
```

只要团队统一即可，不建议混乱切换。

## 7. 推荐的提交规范示例

下面给一组更贴近日常项目开发的示例：

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
```

## 8. 什么时候用 `feat`，什么时候用 `fix`

这是团队里最容易写混的两个类型。

区分方式可以简单理解为：

- `feat`：新增原本不存在的能力
- `fix`：修复原有功能的不正确行为

例如：

- 新增“导出 Excel”按钮，属于 `feat`
- 导出 Excel 文件名错误，属于 `fix`
- 新增筛选条件，属于 `feat`
- 筛选条件无效，属于 `fix`

如果一次提交既有功能新增又顺手修了一个 bug，建议拆成两个提交，不要混在一起。

## 9. 为什么推荐 `commitlint + husky`

如果只是“口头约定”，大概率执行不到位。工程里更推荐使用 `commitlint + husky` 对提交信息做自动校验。

这样做的好处是：

- 提交前自动拦截不合规的 commit message
- 降低团队沟通成本
- 保证提交记录长期稳定
- 为自动生成 `CHANGELOG` 和版本发布打基础

其中：

- `commitlint` 负责校验提交信息是否符合规范
- `husky` 负责把校验逻辑挂到 Git Hook 上

## 10. 最佳实践：`commitlint + husky` 标准接入方案

下面给一套更适合团队项目直接落地的方案，默认以 `pnpm` 项目为例。

### 10.1 安装依赖

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional husky
```

如果你用的是 `npm` 或 `yarn`，把命令替换成对应包管理器即可。

### 10.2 初始化 husky

官方推荐直接使用初始化命令：

```bash
pnpm exec husky init
```

这一步通常会做两件事：

- 创建 `.husky/` 目录
- 在 `package.json` 中写入 `prepare` 脚本

典型结果如下：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

`prepare` 的作用是：在安装依赖后自动启用 Git Hooks。这个细节很重要，很多文章只写 `npx husky init`，但没有解释为什么项目里会多出一个 `prepare`。

### 10.3 推荐使用明确的配置文件后缀

`commitlint` 支持多种配置文件，例如：

- `.commitlintrc`
- `.commitlintrc.json`
- `commitlint.config.js`
- `commitlint.config.cjs`
- `commitlint.config.mjs`
- `commitlint.config.ts`

最佳实践建议：

- 如果项目是 ESM，优先使用 `commitlint.config.mjs`
- 如果项目是 CommonJS，优先使用 `commitlint.config.cjs`

这样比直接写 `commitlint.config.js` 更明确，能避免 `type: module` 场景下的模块格式歧义。

### 10.4 推荐配置：`commitlint.config.mjs`

这是一个适合大多数团队直接使用的基础配置：

```js title='commitlint.config.mjs'
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
    ],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100]
  }
}
```

这份配置做了 3 件关键事情：

- 基于 `@commitlint/config-conventional` 使用社区通用规则
- 显式约束允许的 `type` 范围
- 限制标题长度，避免提交信息过长难以阅读

如果你的团队要求必须填写 `scope`，可以再加上：

```js
'scope-empty': [2, 'never']
```

如果你的团队还想限制 `scope` 的取值范围，可以继续加：

```js
'scope-enum': [2, 'always', ['auth', 'user', 'order', 'home', 'api', 'deps']]
```

### 10.5 配置 `commit-msg` 钩子

创建文件 `.husky/commit-msg`，写入：

```sh
pnpm exec commitlint --edit "$1"
```

作用很直接：

- 用户执行 `git commit` 时触发 `commit-msg` 钩子
- `commitlint` 读取本次提交信息文件
- 校验不通过时，直接阻止提交

如果你习惯用 `npx`，也可以写成：

```sh
npx --no -- commitlint --edit "$1"
```

但如果项目本身使用 `pnpm`，更推荐统一写成 `pnpm exec`，减少工具链混用。`npx` 方案并没有问题，但团队最好统一一种写法。

如果你是手动创建这个 Hook 文件，在 macOS/Linux 环境下还建议补一条：

```bash
chmod +x .husky/commit-msg
```

这样可以避免因为权限问题导致 Hook 不执行。

### 10.6 一个完整的目录示例

```txt
project
├─ .husky/
│  ├─ pre-commit
│  └─ commit-msg
├─ commitlint.config.mjs
├─ package.json
└─ src/
```

### 10.7 验证是否生效

配置完成后，可以直接测试：

```bash
git commit -m "test"
```

如果配置正确，这类不符合规范的提交会被拦截。

再试一条符合规范的提交：

```bash
git commit -m "docs(git): 补充 commitlint 与 husky 最佳实践"
```

正常情况下，这条提交可以通过。

## 11. 进阶最佳实践

除了最基础的接入，团队项目还建议注意下面这些点。

### 11.1 本地 Hook 不是全部，CI 也要兜底

`husky` 只能约束本地开发环境，不能覆盖所有场景。比如：

- 有人绕过本地 Hook
- 某些自动化流程没有执行本地脚本
- 不同机器环境配置不一致

所以更稳妥的做法是：

- 本地用 `husky` 拦截不规范提交
- CI 再做一次提交信息校验

这样约束才完整。

### 11.2 `scope` 不要一开始就限制过死

很多团队一上来就强制 `scope-enum`，结果后期模块越来越多，配置维护成本很高。

更现实的做法是：

- 初期先要求 `type` 和 `subject` 合规
- 团队稳定后，再按模块逐步收紧 `scope`

否则规范容易沦为形式主义。

### 11.3 Monorepo 项目更适合用 `scope`

如果你是 Monorepo，`scope` 的价值会更大。推荐按以下维度统一：

- 应用名：`admin`、`web`、`mobile`
- 包名：`shared`、`ui`、`utils`
- 业务域：`auth`、`order`、`payment`

例如：

```txt
feat(ui): 新增表格空状态组件
fix(shared): 修复日期格式化时区偏移问题
```

### 11.4 CI 或生产环境如果不需要 Hook，可显式跳过 husky 安装

有些环境只安装生产依赖，或者 CI 中并不需要本地 Hook，这时 `prepare` 脚本可能变成噪音。

官方文档提供了一种更稳的做法：写一个安装脚本，在 `CI` 或生产环境下直接跳过。

示例：

```js title='.husky/install.mjs'
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0)
}

const husky = (await import('husky')).default
console.log(husky())
```

然后把 `package.json` 里的脚本改成：

```json
{
  "scripts": {
    "prepare": "node .husky/install.mjs"
  }
}
```

如果你的项目有这类环境差异，这种方式比简单写死 `prepare: husky` 更稳。

### 11.5 Windows 环境注意编码和命令转义

官方文档对 Windows 还有两个实用提醒：

- Hook 文件建议使用 `UTF-8` 编码
- 如果你是用命令行一次性生成 `.husky/commit-msg`，在 PowerShell 里要注意 `$1` 的转义

如果你是手动编辑 `.husky/commit-msg` 文件，直接写：

```sh
pnpm exec commitlint --edit "$1"
```

通常就够了。

## 12. 一个可直接复制的最佳实践方案

如果你希望团队快速落地，可以直接采用下面这套组合：

### 12.1 `package.json`

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

依赖版本建议直接使用当前项目实际安装的稳定版本，不要为了文档示例手写固定版本号。

### 12.2 `commitlint.config.mjs`

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
    ],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100]
  }
}
```

### 12.3 `.husky/commit-msg`

```sh
pnpm exec commitlint --edit "$1"
```

### 12.4 团队约定

- 格式统一为 `<type>(<scope>): <subject>`
- 一个提交只做一件事
- 有破坏性变更时必须标记 `!` 或 `BREAKING CHANGE`
- 本地和 CI 双重校验

这套方案的优点是：

- 足够轻量，不会让团队觉得负担过重
- 已经能覆盖 90% 的日常协作场景
- 后续如果要接 `CHANGELOG`、自动发版，也有扩展空间

## 13. 常见不规范写法

下面这些写法虽然 Git 能提交，但不推荐：

```txt
修改bug
修复问题
更新
再次提交
测试一下
项目修改
feat: 修改bug
fix: 优化功能
```

问题在于：

- 信息过于模糊
- 类型和内容不匹配
- 不能体现影响范围
- 不利于日志生成和历史追踪

## 14. 一个更实用的团队约定

如果你所在团队不想把规范搞得太重，可以先执行这一版最小规则：

```txt
<type>(<scope>): <subject>
```

并强制约束 4 件事：

- `type` 必须从约定枚举中选择
- `subject` 必须写清楚改动内容
- 一个提交只表达一个独立变更
- 破坏性变更必须显式标记

这已经能解决大多数提交记录混乱的问题。

## 15. 一页总结

Git 提交规范的目标，不是为了“好看”，而是为了让提交历史真正可用。

建议团队至少统一以下规则：

- 采用 `Conventional Commits` 规范
- 统一格式为 `<type>(<scope>): <subject>`
- 明确 `feat`、`fix`、`docs`、`refactor`、`chore` 等常用类型
- 一个提交只做一件事
- 破坏性变更必须显式标记
- 通过 `commitlint + husky` 做本地自动校验
- 在 CI 中补一层兜底校验

推荐提交示例：

```txt
feat(order): 新增订单导出功能
fix(login): 修复登录态失效后页面死循环跳转问题
docs(git): 补充 Git 提交规范文档
feat(api)!: 调整用户信息接口返回结构
```

当团队把提交信息当成工程资产来维护时，代码历史才真正具备可读性、可追踪性和可维护性。

## 参考资料

- [commitlint Getting started](https://commitlint.js.org/guides/getting-started.html)
- [commitlint Local setup](https://commitlint.js.org/guides/local-setup.html)
- [commitlint Configuration](https://commitlint.js.org/reference/configuration.html)
- [Husky Get started](https://typicode.github.io/husky/get-started.html)
- [Husky How To](https://typicode.github.io/husky/how-to.html)


