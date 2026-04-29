# ESLint + Prettier + Husky + lint-staged 完整配置指南

这篇文档给一套**可以直接复制粘贴使用**的前端工程化配置方案，覆盖从 0 到 1 的完整落地过程。


## 1. 先理解这些工具在干什么

很多教程上来就甩一堆安装命令，读者根本不知道在装什么、为什么要装。先花 3 分钟搞清楚每个工具的职责。

### 1.1 配置前 vs 配置后

```txt
配之前：
  写代码 → git add → git commit → 提交到仓库

配之后：
  写代码 → git add → git commit
                         │
                         ├─ pre-commit 钩子触发
                         │     └─ lint-staged 只检查这次改了的文件
                         │           ├─ ESLint 检查代码质量
                         │           └─ Prettier 统一格式
                         │
                         ├─ 代码检查通过 ✅
                         │
                         ├─ commit-msg 钩子触发（可选）
                         │     └─ commitlint 检查提交信息格式
                         │
                         └─ 全部通过 ✅ → 提交成功
```

### 1.2 每个工具的职责

| 工具 | 一句话职责 | 通俗理解 |
|------|-----------|---------|
| **ESLint** | 检查代码有没有 bug、用了不该用的写法 | 代码的「语法老师」 |
| **Prettier** | 统一缩进、引号、分号等格式 | 代码的「排版工」 |
| **Husky** | 把命令挂到 Git 钩子上自动触发 | 「钩子管理员」 |
| **lint-staged** | 只对 `git add` 过的文件跑检查，不扫全仓 | 「精准检查员」 |
| **commitlint** | 约束提交信息必须按 `feat: xxx` 格式写 | 「提交信息审核员」 |

### 1.3 最关键的理解

**lint-staged 是整个链路的核心效率工具。** 如果没有它，每次 `git commit` 都要全仓扫描几百个文件，提交一次卡半分钟，团队迟早会绕过检查。它的价值就是：只检查你这次改了的那几个文件，快、稳、不碍事。

---

## 2. 最终目录结构

配置完成后，你的项目根目录会多出这些文件：

```txt
project
├─ .husky/
│  ├─ pre-commit              ← 提交前触发代码检查
│  └─ commit-msg              ← 提交信息写入后触发校验（可选）
├─ eslint.config.mjs          ← ESLint 配置（Flat Config）
├─ .prettierrc                ← Prettier 配置
├─ .prettierignore            ← Prettier 忽略规则
├─ lint-staged.config.mjs     ← lint-staged 配置
├─ commitlint.config.mjs      ← commitlint 配置（可选）
└─ package.json
```

## 3. 第一步：配置 ESLint + Prettier

先把两个基础工具配好，让它们能手动正常运行，再接自动化。

### 3.1 安装依赖

```bash
# 基础三件套（所有项目必装）
pnpm add -D eslint @eslint/js globals prettier eslint-config-prettier

# TypeScript 项目额外装
pnpm add -D typescript-eslint
```

各包的作用：

| 包名 | 作用 |
|------|------|
| `eslint` | ESLint 本体 |
| `@eslint/js` | ESLint 官方 JS 推荐规则集 |
| `globals` | 声明浏览器、Node.js 等环境的全局变量，避免 `no-undef` 误报 |
| `prettier` | Prettier 本体 |
| `eslint-config-prettier` | 关掉 ESLint 中跟 Prettier 冲突的格式规则 |
| `typescript-eslint` | ESLint 的 TypeScript 支持（一体化包） |

### 3.2 配置 Prettier

创建 `.prettierrc`：

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

> `semi: true` 和 `singleQuote: true` 是 JS/TS 社区最主流的选择，如果你团队偏好无分号，把 `semi` 改成 `false` 即可。

创建 `.prettierignore`：

```txt
dist
coverage
node_modules
*.min.js
*.min.css
pnpm-lock.yaml
package-lock.json
yarn.lock
```

**为什么这一步很重要：** 如果没有 `.prettierignore`，执行 `prettier . --write` 时会扫进 `dist`、`node_modules` 等目录，又慢又可能出错。

### 3.3 配置 ESLint（Flat Config）

> **注意：** ESLint 10.0 已完全移除旧版 `.eslintrc` 配置格式。如果你看到 `.eslintrc.js`、`.eslintrc.json` 这类文件，那是旧版写法，不再推荐。本文全程使用 Flat Config（`eslint.config.mjs`）。

#### JavaScript 项目

创建 `eslint.config.mjs`：

```js
import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // 1. 忽略目录
  { ignores: ['dist', 'coverage', 'node_modules'] },

  // 2. 基础规则
  js.configs.recommended,

  // 3. 关掉跟 Prettier 冲突的 ESLint 格式规则
  eslintConfigPrettier,

  // 4. 自定义规则
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
]
```

#### TypeScript 项目

创建 `eslint.config.mjs`：

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // 1. 忽略目录
  { ignores: ['dist', 'coverage', 'node_modules'] },

  // 2. JS 基础规则
  js.configs.recommended,

  // 3. TS 推荐规则
  ...tseslint.configs.recommended,

  // 4. 关掉跟 Prettier 冲突的 ESLint 格式规则
  eslintConfigPrettier,

  // 5. 自定义规则
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
]
```

> **框架项目补充：**
> - React 项目额外装 `eslint-plugin-react-hooks` `eslint-plugin-react-refresh`，把它们的 config 加到数组里
> - Vue 项目额外装 `eslint-plugin-vue` `@vue/eslint-config-typescript`
> - 用法都是 `import xxx from 'xxx'` 然后放到 export 数组中即可

#### Vue 项目新增

```bash
pnpm add -D eslint-plugin-vue @vue/eslint-config-typescript
```

```js
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),

  {
    parserOptions: {
      parser: tseslint.parser,
    },
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
  },
]
```



### 3.4 添加 npm scripts

在 `package.json` 的 `scripts` 里加上这 4 条：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

### 3.5 手动验证

```bash
# 检查代码质量
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化
pnpm format

# CI 检查格式（不修改文件）
pnpm format:check
```

四条命令都不报错，ESLint + Prettier 就配好了。

---

## 4. 第二步：接入 Husky + lint-staged

上一步配完后，你可以在**手动**跑命令了。但每次提交前都要手动跑一遍，很麻烦，也容易忘。这一步让 Git 在提交时**自动**帮你跑。

### 4.1 安装

```bash
pnpm add -D husky lint-staged
```

### 4.2 初始化 Husky

```bash
pnpm exec husky init
```

这个命令会做两件事：

1. 创建 `.husky/` 目录
2. 在 `package.json` 里写入 `prepare` 脚本

检查一下 `package.json`，至少要有：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

`prepare` 的作用是：团队成员执行 `pnpm install` 后自动启用 Git Hooks。**这个文件需要提交到仓库**，之后新人克隆项目后只需 `pnpm install`，Hooks 就自动生效了。

### 4.3 配置 lint-staged

创建 `lint-staged.config.mjs`：

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less}': ['prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write'],
}
```

配置解读：

- **大括号里是文件匹配规则** — 只有本次 `git add` 的、匹配了 glob 的文件才会被处理
- **数组里是命令，按顺序执行** — 先 ESLint 修复，再 Prettier 格式化
- **lint-staged 会自动把文件路径传给命令** — 不需要手写 `eslint src --fix`
- **修改后的文件会自动加回暂存区** — 不需要再写 `git add`

> 如果你的项目没有 `css/scss/less`，删掉对应行即可。

### 4.4 编写 pre-commit 钩子

编辑 `.husky/pre-commit`，只写一行：

```sh
pnpm exec lint-staged
```

> macOS/Linux 下如果是手动创建的文件，需要加执行权限：
> ```bash
> chmod +x .husky/pre-commit
> ```

### 4.5 验证

随便改一个文件，比如故意把格式写乱：

```js
const   x=1
```

然后执行：

```bash
git add .
git commit -m "test: 测试 pre-commit 是否生效"
```

你会看到终端输出 lint-staged 的执行过程——ESLint 和 Prettier 自动运行、修好了格式，然后提交继续。

如果 ESLint 检查到严重问题（比如用了 `eval()`），提交会被拦截。你需要修复代码后重新 add 和 commit。

---

## 5. 第三步（可选）：用 commitlint 约束提交信息格式

前面配完后，代码质量已经有人守门了。但提交信息还是可以随便写——`fix bug`、`update`、`改了一下`。如果你的团队想统一提交信息格式，就加上 commitlint。

### 5.1 安装

```bash
# 提交信息校验
pnpm add -D @commitlint/cli @commitlint/config-conventional

# 交互式提交向导（可选，配合 pnpm run cm 使用）
pnpm add -D commitizen cz-git
```

### 5.2 配置 commitlint + cz-git

创建 `commitlint.config.mjs`，这份配置同时服务两件事：

- `commitlint` 校验提交信息是否合规
- `cz-git` 读取 `prompt` 部分，生成中文交互式提问题

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档变更
        'style',    // 代码格式（不影响逻辑）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建/依赖变更
        'ci',       // CI 配置
        'chore',    // 杂项
        'revert',   // 回滚
        'wip',      // 开发阶段临时提交
      ],
    ],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },

  prompt: {
    messages: {
      type: '选择你要提交的类型 :',
      scope: '选择一个提交范围（可选）:',
      customScope: '请输入自定义的提交范围 :',
      subject: '填写简短精炼的变更描述 :\n',
      body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
      breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
      footerPrefixesSelect: '选择关联 issue 前缀（可选）:',
      customFooterPrefix: '输入自定义 issue 前缀 :',
      footer: '列举关联 issue (可选) 例如: #31, #I3244 :\n',
      confirmCommit: '是否提交或修改 commit ?',
    },
    types: [
      { value: 'feat',     name: '特性:     ✨  新增功能', emoji: ':sparkles:' },
      { value: 'fix',      name: '修复:     🐛  修复缺陷', emoji: ':bug:' },
      { value: 'docs',     name: '文档:     📝  文档变更', emoji: ':memo:' },
      { value: 'style',    name: '格式:     💄  代码格式（空格、分号等）', emoji: ':lipstick:' },
      { value: 'refactor', name: '重构:     ♻️  代码重构', emoji: ':recycle:' },
      { value: 'perf',     name: '性能:     ⚡  性能优化', emoji: ':zap:' },
      { value: 'test',     name: '测试:     ✅  添加或修改测试', emoji: ':white_check_mark:' },
      { value: 'build',    name: '构建:     📦  构建流程或依赖变更', emoji: ':package:' },
      { value: 'ci',       name: '集成:     ⚙️  修改 CI 配置', emoji: ':ferris_wheel:' },
      { value: 'revert',   name: '回退:     ↩️  回滚 commit', emoji: ':rewind:' },
      { value: 'chore',    name: '其他:     🔧  杂项（不影响源文件）', emoji: ':hammer:' },
      { value: 'wip',      name: '开发中:   🚧  开发阶段临时提交', emoji: ':construction:' },
    ],
    useEmoji: true,
    emojiAlign: 'center',
    allowCustomScopes: true,
    allowEmptyScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
    breaklineNumber: 100,
    skipQuestions: [],
  },
}
```

> **配置解读：**
> - `extends: ['@commitlint/config-conventional']` 继承官方推荐规则
> - `rules` 部分被 `commitlint` 读取，用于校验提交信息
> - `prompt` 部分被 `cz-git` 读取，用于生成中文交互式提示
> - 如果团队不需要 emoji，把 `useEmoji` 改成 `false` 即可

### 5.3 在 package.json 中注册 cz-git

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

脚本名用 `cm` 而不是 `commit`，避免与 Git 钩子产生冲突。

### 5.4 编写 commit-msg 钩子

创建 `.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

> macOS/Linux 下同样需要 `chmod +x .husky/commit-msg`

### 5.5 验证

用错误格式试一次：

```bash
git commit -m "test"
```

会被拦截，终端输出类似：

```txt
⧗   input: test
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

再用正确格式试一次：

```bash
git commit -m "feat: 新增用户登录功能"
```

顺利通过。

---

## 6. 最终文件清单（可直接复制）

### 6.1 `package.json`（关键字段）

```json
{
  "scripts": {
    "prepare": "husky",
    "cm": "cz",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  },
  "config": {
    "commitizen": {
      "path": "node_modules/cz-git"
    }
  }
}
```

如果项目没用 `cz-git`，去掉 `cm` 脚本和 `config` 字段即可。

### 6.2 `eslint.config.mjs`（TypeScript 版）

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
]
```

### 6.3 `eslint.config.mjs`（纯 JavaScript 版）

```js
import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
]
```

### 6.4 `.prettierrc`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 6.5 `.prettierignore`

```txt
dist
coverage
node_modules
*.min.js
*.min.css
pnpm-lock.yaml
package-lock.json
yarn.lock
```

### 6.6 `lint-staged.config.mjs`

```js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,less}': ['prettier --write'],
  '*.{json,md,html,yml,yaml}': ['prettier --write'],
}
```

### 6.7 `.husky/pre-commit`

```sh
pnpm exec lint-staged
```

### 6.8 `commitlint.config.mjs`（可选）

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档变更
        'style',    // 代码格式（不影响逻辑）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建/依赖变更
        'ci',       // CI 配置
        'chore',    // 杂项
        'revert',   // 回滚
        'wip',      // 开发阶段临时提交
      ],
    ],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },

  prompt: {
    messages: {
      type: '选择你要提交的类型 :',
      scope: '选择一个提交范围（可选）:',
      customScope: '请输入自定义的提交范围 :',
      subject: '填写简短精炼的变更描述 :\n',
      body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
      breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
      footerPrefixesSelect: '选择关联 issue 前缀（可选）:',
      customFooterPrefix: '输入自定义 issue 前缀 :',
      footer: '列举关联 issue (可选) 例如: #31, #I3244 :\n',
      confirmCommit: '是否提交或修改 commit ?',
    },
    types: [
      { value: 'feat',     name: '特性:     ✨  新增功能', emoji: ':sparkles:' },
      { value: 'fix',      name: '修复:     🐛  修复缺陷', emoji: ':bug:' },
      { value: 'docs',     name: '文档:     📝  文档变更', emoji: ':memo:' },
      { value: 'style',    name: '格式:     💄  代码格式（空格、分号等）', emoji: ':lipstick:' },
      { value: 'refactor', name: '重构:     ♻️  代码重构', emoji: ':recycle:' },
      { value: 'perf',     name: '性能:     ⚡  性能优化', emoji: ':zap:' },
      { value: 'test',     name: '测试:     ✅  添加或修改测试', emoji: ':white_check_mark:' },
      { value: 'build',    name: '构建:     📦  构建流程或依赖变更', emoji: ':package:' },
      { value: 'ci',       name: '集成:     ⚙️  修改 CI 配置', emoji: ':ferris_wheel:' },
      { value: 'revert',   name: '回退:     ↩️  回滚 commit', emoji: ':rewind:' },
      { value: 'chore',    name: '其他:     🔧  杂项（不影响源文件）', emoji: ':hammer:' },
      { value: 'wip',      name: '开发中:   🚧  开发阶段临时提交', emoji: ':construction:' },
    ],
    useEmoji: true,
    emojiAlign: 'center',
    allowCustomScopes: true,
    allowEmptyScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
    breaklineNumber: 100,
    skipQuestions: [],
  },
}
```

### 6.9 `.husky/commit-msg`（可选）

```sh
pnpm exec commitlint --edit "$1"
```

---

## 7. 日常使用流程

配置好之后，日常提交流程就是两条命令：

```bash
git add .
git commit -m "feat(user): 新增用户头像上传功能"
```

提交时自动发生的事情：

1. Husky 触发 `.husky/pre-commit`
2. lint-staged 找出本次 git add 过的文件
3. 对匹配 `*.{js,jsx,ts,tsx}` 的文件：先 `eslint --fix`，再 `prettier --write`
4. 对匹配 `*.{css,json,md}` 等文件：只跑 `prettier --write`
5. 全部通过后，进入 `.husky/commit-msg`
6. commitlint 校验 `"feat(user): 新增用户头像上传功能"` 是否合规
7. 全部通过，提交完成

> **紧急情况怎么绕过？** `git commit --no-verify` 会跳过所有钩子。但这是紧急出口，不要养成习惯。

---

## 8. 验证清单

配置完成后，按顺序验证以下 5 项：

1. **`pnpm lint`** — 能正常检查代码
2. **`pnpm format`** — 能正常格式化
3. **改一个文件 → `git add .` → `git commit -m "test: 测试"`** — 能看到 lint-staged 自动运行
4. **`git commit -m "foo"`** — 被 commitlint 拦截（如果配了）
5. **`git commit -m "feat: 正常提交"`** — 全部通过

5 项都通过，链路就接好了。

---

## 9. 常见问题

### 9.1 提交变慢了怎么办？

大概率是 `pre-commit` 里跑了全仓任务。lint-staged 的职责就是「只查 staged files」，不要在 Hook 文件里写成：

```sh
# ❌ 错误：每次都扫描全仓
eslint .
prettier . --write

# ✅ 正确：只检查 staged files
pnpm exec lint-staged
```

### 9.2 提交失败后，觉得代码丢了？

lint-staged 在运行前会自动创建 `git stash` 备份。如果提交失败后状态被回滚了，执行以下命令恢复：

```bash
git stash list
# 会看到类似：lint-staged automatic backup
git stash apply --index stash@{0}
```

### 9.3 不要在 lint-staged 的命令里手写路径

```js
// ❌ 错误：又退化成了扫描固定目录
'*.ts': ['eslint src --fix']

// ✅ 正确：lint-staged 会自动传入文件路径
'*.ts': ['eslint --fix']
```

### 9.4 不要手写 `git add`

```js
// ❌ 错误：旧版教程里的写法，现代版本不需要
'*.ts': ['eslint --fix', 'prettier --write', 'git add']

// ✅ 正确
'*.ts': ['eslint --fix', 'prettier --write']
```

现代 lint-staged 会自动把修改后的文件加回暂存区。

### 9.5 避免重叠的 glob 规则

```js
// ❌ 错误：*.ts 同时命中两条规则，可能冲突
export default {
  '*': 'prettier --write',
  '*.ts': 'eslint --fix',
}

// ✅ 正确：每种文件类型只匹配一条规则
export default {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.json': 'prettier --write',
}
```

### 9.6 不要默认在 pre-commit 里跑整仓 `tsc --noEmit`

`tsc --noEmit` 是全仓类型检查，速度较慢。更推荐：

- 放到 `pre-push` 钩子
- 放到 CI 流水线

如果你非要在 lint-staged 里跑，需要用函数写法避免自动拼接文件参数：

```js
export default {
  '*.{ts,tsx}': [() => 'tsc --noEmit', 'eslint --fix', 'prettier --write'],
}
```

### 9.7 Windows 下的注意事项

- `.husky/pre-commit` 和 `.husky/commit-msg` 文件使用 **UTF-8 编码**
- 直接在编辑器里手动创建 Hook 文件，不要用 PowerShell 的 `echo` 命令写（`$1` 可能被转义）

### 9.8 Monorepo 项目怎么配

可以在根目录配通用文件（`json`、`md`），各子包各自配自己的规则。lint-staged 会自动找离文件最近的配置文件：

```txt
repo
├─ lint-staged.config.mjs          ← 根目录通用规则
├─ packages/
│  ├─ web/
│  │  └─ lint-staged.config.mjs    ← web 子包特有规则
│  └─ admin/
│     └─ lint-staged.config.mjs    ← admin 子包特有规则
```

### 9.9 CI 环境不需要跑 Husky

在 CI 中设置环境变量 `HUSKY=0`，然后在 CI 步骤中显式跑 lint 和 format：

```yaml
# GitHub Actions 示例
- run: pnpm lint
- run: pnpm format:check
```

---

## 10. 一页安装命令

如果你不想看解释，只想快速落地，就按下面顺序执行：

```bash
# 1. 安装基础工具
pnpm add -D eslint @eslint/js globals prettier eslint-config-prettier lint-staged husky

# 2. TypeScript 项目额外装
pnpm add -D typescript-eslint

# 3. 初始化 Husky
pnpm exec husky init

# 4. 安装 commitlint + cz-git（可选）
pnpm add -D @commitlint/cli @commitlint/config-conventional commitizen cz-git
```

然后把第 6 节的配置文件复制到项目对应位置，最后执行：

```bash
git add .
git commit -m "chore: 接入 ESLint + Prettier + Husky + lint-staged 工程化配置"
```

---

这套配置的核心思路就一句话：**用最少的工具、最少的文件、最清楚的职责划分，把提交前检查这件事做稳。** 不需要装十几个包，也不需要几百行配置，上面这些足够覆盖绝大多数前端项目。

## 参考资料

- [ESLint Flat Config 文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint Getting Started](https://typescript-eslint.io/getting-started)
- [Prettier 官方文档](https://prettier.io/docs/install)
- [Husky 官方文档](https://typicode.github.io/husky/get-started.html)
- [lint-staged README](https://github.com/lint-staged/lint-staged)
- [commitlint Local Setup](https://commitlint.js.org/guides/local-setup.html)
