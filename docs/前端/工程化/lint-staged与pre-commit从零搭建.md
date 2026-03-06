# lint-staged 与 pre-commit 从零搭建

## 1. 最终项目结构

先准备成下面这个结构。

```txt
project
├─ .husky/
│  ├─ pre-commit
│  └─ commit-msg
├─ lint-staged.config.mjs
├─ commitlint.config.mjs
└─ package.json
```

需要新建或修改的文件：

- `package.json`
- `lint-staged.config.mjs`
- `commitlint.config.mjs`
- `.husky/pre-commit`
- `.husky/commit-msg`

## 2. 安装依赖

项目根目录执行：

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional commitizen cz-git eslint prettier stylelint
```

如果项目里已经有 `eslint`、`prettier`、`stylelint`，把重复的去掉即可。

## 3. 初始化 Husky

```bash
pnpm exec husky init
```

执行后会自动做两件事：

- 创建 `.husky/`
- 在 `package.json` 里写入 `prepare` 脚本

如果你的 `package.json` 里还没有 `prepare`，手动补上：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

## 4. 修改 `package.json`

把下面这段合并进去：

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

说明：

- `cm`：统一触发交互式提交
- `commitizen.path`：指定 `cz-git` 作为 adapter

不要把脚本名写成 `commit`，直接用 `cm`。

## 5. 新建 `lint-staged.config.mjs`

文件：`lint-staged.config.mjs`

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less,vue}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write']
}
```

如果项目不用 `stylelint` 或没有 `vue/scss/less`，删掉对应后缀和命令。

## 6. 新建 `commitlint.config.mjs`

文件：`commitlint.config.mjs`

```js
export default {
  // 继承的规则
  extends: ["@commitlint/config-conventional"],
  // 自定义规则
  rules: {
    // @see https://commitlint.js.org/#/reference-rules

    // 提交类型枚举，git提交type必须是以下类型
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新增功能
        "fix", // 修复缺陷
        "docs", // 文档变更
        "style", // 代码格式（不影响功能，例如空格、分号等格式修正）
        "refactor", // 代码重构（不包括 bug 修复、功能新增）
        "perf", // 性能优化
        "test", // 添加疏漏测试或已有测试改动
        "build", // 构建流程、外部依赖变更（如升级 npm 包、修改 webpack 配置等）
        "ci", // 修改 CI 配置、脚本
        "revert", // 回滚 commit
        "chore", // 对构建过程或辅助工具和库的更改（不影响源文件、测试用例）
        "wip", // 对构建过程或辅助工具和库的更改（不影响源文件、测试用例）
      ],
    ],
    "subject-case": [0], // subject大小写不做校验
  },

  prompt: {
    messages: {
      type: "选择你要提交的类型 :",
      scope: "选择一个提交范围（可选）:",
      customScope: "请输入自定义的提交范围 :",
      subject: "填写简短精炼的变更描述 :\n",
      body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
      breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
      footerPrefixesSelect: "选择关联issue前缀（可选）:",
      customFooterPrefix: "输入自定义issue前缀 :",
      footer: "列举关联issue (可选) 例如: #31, #I3244 :\n",
      generatingByAI: "正在通过 AI 生成你的提交简短描述...",
      generatedSelectByAI: "选择一个 AI 生成的简短描述:",
      confirmCommit: "是否提交或修改commit ?",
    },
    // prettier-ignore
    types: [
      { value: "feat",     name: "特性:     ✨  新增功能", emoji: ":sparkles:" },
      { value: "fix",      name: "修复:       修复缺陷", emoji: ":bug:" },
      { value: "docs",     name: "文档:       文档变更(更新README文件，或者注释)", emoji: ":memo:" },
      { value: "style",    name: "格式:       代码格式（空格、格式化、缺失的分号等）", emoji: ":lipstick:" },
      { value: "refactor", name: "重构:       代码重构（不修复错误也不添加特性的代码更改）", emoji: ":recycle:" },
      { value: "perf",     name: "性能:       性能优化", emoji: ":zap:" },
      { value: "test",     name: "测试:       添加疏漏测试或已有测试改动", emoji: ":white_check_mark:"},
      { value: "build",    name: "构建:     ️  构建流程、外部依赖变更（如升级 npm 包、修改 vite 配置等）", emoji: ":package:"},
      { value: "ci",       name: "集成:     ⚙️   修改 CI 配置、脚本",  emoji: ":ferris_wheel:"},
      { value: "revert",   name: "回退:     ↩️   回滚 commit",emoji: ":rewind:"},
      { value: "chore",    name: "其他:     ️   对构建过程或辅助工具和库的更改（不影响源文件、测试用例）", emoji: ":hammer:"},
      { value: "wip",      name: "开发中:     开发阶段临时提交", emoji: ":construction:"},
    ],
    useEmoji: true,
    emojiAlign: "center",
    useAI: false,
    aiNumber: 1,
    themeColorCode: "",
    scopes: [],
    allowCustomScopes: true,
    allowEmptyScopes: true,
    customScopesAlign: "bottom",
    customScopesAlias: "custom",
    emptyScopesAlias: "empty",
    upperCaseSubject: false,
    markBreakingChangeMode: false,
    allowBreakingChanges: ["feat", "fix"],
    breaklineNumber: 100,
    breaklineChar: "|",
    skipQuestions: [],
    issuePrefixes: [{ value: "closed", name: "closed:   ISSUES has been processed" }],
    customIssuePrefixAlign: "top",
    emptyIssuePrefixAlias: "skip",
    customIssuePrefixAlias: "custom",
    allowCustomIssuePrefix: true,
    allowEmptyIssuePrefix: true,
    confirmColorize: true,
    maxHeaderLength: Infinity,
    maxSubjectLength: Infinity,
    minSubjectLength: 0,
    scopeOverrides: undefined,
    defaultBody: "",
    defaultIssues: "",
    defaultScope: "",
    defaultSubject: "",
  },
};
```

这份配置同时服务两件事：

- `commitlint` 校验提交信息
- `cz-git` 读取 `prompt` 配置
- 直接提供中文交互模板，可直接复制使用

## 7. 写 Hook 文件

### 7.1 `.husky/pre-commit`

文件：`.husky/pre-commit`

```sh
pnpm exec lint-staged
```

### 7.2 `.husky/commit-msg`

文件：`.husky/commit-msg`

```sh
pnpm exec commitlint --edit "$1"
```

如果你是在 macOS / Linux 下手动创建这两个文件，再执行：

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## 8. 直接可用的最终配置

### 8.1 `package.json`

只看本方案相关字段，最终至少要有：

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

### 8.2 `lint-staged.config.mjs`

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less,vue}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write']
}
```

### 8.3 `commitlint.config.mjs`

```js
export default {
  extends: ['@commitlint/config-conventional'],
  prompt: {
    useEmoji: false
  }
}
```

### 8.4 `.husky/pre-commit`

```sh
pnpm exec lint-staged
```

### 8.5 `.husky/commit-msg`

```sh
pnpm exec commitlint --edit "$1"
```

## 9. 提交时怎么用

先暂存文件：

```bash
git add .
```

再走交互式提交：

```bash
pnpm run cm
```

执行流程：

1. `commitizen` 启动交互输入
2. `cz-git` 生成提交信息
3. `pre-commit` 执行 `lint-staged`
4. `commit-msg` 执行 `commitlint`
5. 全部通过后提交成功

如果你全局安装了 `commitizen`，也可以直接用：

```bash
git cz
```

## 10. 验证

按下面顺序检查：

### 10.1 验证 Hook 文件

```bash
ls .husky
```

应看到：

- `pre-commit`
- `commit-msg`

### 10.2 验证 `lint-staged`

随便改一个 `js/ts/md` 文件，执行：

```bash
git add .
pnpm exec lint-staged
```

能正常格式化或校验即可。

### 10.3 验证 `commitlint`

执行一条错误提交信息：

```bash
git commit -m "test"
```

应被 `commitlint` 拦截。

### 10.4 验证 `commitizen + cz-git`

执行：

```bash
pnpm run cm
```

能看到交互式提交流程即可。

## 11. 推荐日常用法

团队直接约定这一套：

```bash
git add .
pnpm run cm
```

不要约定成：

```bash
git commit -m "xxx"
```

原因：

- `pnpm run cm` 有交互式向导
- `commitlint` 仍然负责兜底
- 新人不用背提交规范

## 12. 一页命令清单

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional commitizen cz-git eslint prettier stylelint
pnpm exec husky init
git add .
pnpm run cm
```


