# Vite + React ESLint 与 Prettier 最佳实践

这篇文档给一套可以直接复制使用的 `Vite + React + TypeScript` 工程化配置方案，目标是：

- 用 `ESLint` 兜住代码质量问题
- 用 `Prettier` 统一代码格式
- 使用 **ESLint Flat Config**，避免旧版 `.eslintrc` 方案
- 保持和当前 `Vite + React` 官方模板思路一致
- 文件名、目录结构、命令都给全，能从 0 到 1 直接落地

## 1. 版本基线

本文按我在 **2026-03-06** 核对到的官方稳定版生态编写，基线如下：

- `vite`：`7.3.1`
- `react`：`19.2.4`
- `eslint`：`10.0.2`
- `prettier`：`3.8.1`
- `typescript-eslint`：`8.56.1`
- `eslint-plugin-react-hooks`：`7.0.1`
- `eslint-plugin-react-refresh`：`0.5.2`

说明：

- 文档里的安装命令默认 **不锁死版本号**，这样你复制后会安装执行当时的最新稳定版。
- 如果你的团队希望结果完全一致，可以在安装后把版本锁进 `package.json` 和 lockfile。

## 2. 为什么推荐这套方案

这套配置的核心思路是把职责拆开：

- `ESLint` 负责代码质量和潜在 bug
- `Prettier` 负责格式化
- `eslint-config-prettier` 用来关闭和 Prettier 冲突的 ESLint 格式规则

这里我**不推荐**把 `Prettier` 作为 ESLint 规则去跑，也就是不把 `prettier/prettier` 作为主方案。

原因是：

- 格式化和 lint 是两类职责
- 直接运行 `prettier --write` 更快也更直观
- `eslint-config-prettier` 已经足够解决大多数冲突问题

这也是目前更稳的工程实践。

## 3. 最终目录结构

推荐项目目录如下：

```txt
my-vite-react-app
├─ .editorconfig
├─ .prettierignore
├─ .prettierrc.json
├─ eslint.config.mjs
├─ index.html
├─ package.json
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ public/
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ vite-env.d.ts
└─ node_modules/
```

这篇文章主要会新增或修改这 4 个文件：

- `eslint.config.mjs`
- `.prettierrc.json`
- `.prettierignore`
- `.editorconfig`

## 4. 第一步：创建项目

推荐直接用官方 `react-ts` 模板：

```bash
pnpm create vite my-vite-react-app --template react-ts
```

进入项目目录：

```bash
cd my-vite-react-app
```

安装依赖：

```bash
pnpm install
```

## 5. 第二步：安装 ESLint 与 Prettier 相关依赖

在项目根目录执行：

```bash
pnpm add -D eslint @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

这几个包分别负责：

- `eslint`：Lint 主程序
- `@eslint/js`：ESLint 官方 JS 推荐规则
- `globals`：浏览器、Node 等全局变量定义
- `typescript-eslint`：TypeScript Flat Config 一体化包
- `eslint-plugin-react-hooks`：React Hooks 规则
- `eslint-plugin-react-refresh`：和 Vite Fast Refresh 相关规则
- `prettier`：格式化工具
- `eslint-config-prettier`：关闭与 Prettier 冲突的 ESLint 规则

## 6. 第三步：配置 `eslint.config.mjs`

在项目根目录新建 `eslint.config.mjs`，内容如下：

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
])
```

### 6.1 这份配置做了什么

这份配置里有几个关键点：

- 使用 **Flat Config**，文件名是 `eslint.config.mjs`
- 使用 `globalIgnores(['dist', 'coverage'])`，不再依赖旧版 `.eslintignore`
- 使用 `tseslint.configs.recommendedTypeChecked`，开启基于类型信息的规则
- 使用 `parserOptions.projectService: true`，这是 `typescript-eslint` 当前推荐的类型感知方式
- 使用 `reactHooks.configs.flat.recommended`，启用 Hooks 规则
- 使用 `reactRefresh.configs.vite`，和 Vite 的 Fast Refresh 约束对齐
- 最后接入 `eslint-config-prettier`，关闭与 Prettier 冲突的格式规则

### 6.2 为什么不用旧版 `.eslintrc`

因为当前 ESLint 主线已经以 Flat Config 为核心，新的配置文件就是：

- `eslint.config.js`
- `eslint.config.mjs`
- `eslint.config.cjs`

对于 `Vite + React + TypeScript` 项目，推荐直接用 `eslint.config.mjs`，避免模块格式歧义。

## 7. 第四步：配置 `.prettierrc.json`

在项目根目录创建 `.prettierrc.json`：

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 7.1 这份 Prettier 配置的思路

这是一套比较适合现代 React 项目的团队配置：

- `semi: false`：和 Vite 官方模板风格一致
- `singleQuote: true`：JS/TS 社区常见选择
- `trailingComma: 'all'`：减少 Git diff 噪音
- `printWidth: 100`：兼顾可读性和换行频率
- `endOfLine: 'lf'`：降低跨平台换行差异

如果你团队坚持分号，也可以把 `semi` 改成 `true`。

## 8. 第五步：配置 `.prettierignore`

在项目根目录创建 `.prettierignore`：

```txt
dist
coverage
node_modules
.vite
*.min.js
*.min.css
```

这一步很重要。

如果没有 `.prettierignore`，你在执行 `prettier . --write` 时，可能会把不该处理的构建产物和依赖目录也扫进去。

## 9. 第六步：配置 `.editorconfig`

在项目根目录创建 `.editorconfig`：

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`.editorconfig` 不是必须，但非常推荐。

它的作用是把缩进、换行、编码这些基础约束同步给 IDE，避免“编辑器里一个风格，Prettier 再改成另一个风格”的来回拉扯。

## 10. 第七步：配置 `package.json` 脚本

把 `package.json` 里的 `scripts` 整理成下面这样：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

推荐保留这 4 个工程化脚本：

- `lint`：检查代码质量
- `lint:fix`：自动修复可修复问题
- `format`：统一格式化
- `format:check`：用于 CI 校验格式

## 11. 可以直接复制的最终文件

这一节把最终文件集中放一遍，方便你直接照抄。

### 11.1 `eslint.config.mjs`

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
])
```

### 11.2 `.prettierrc.json`

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 11.3 `.prettierignore`

```txt
dist
coverage
node_modules
.vite
*.min.js
*.min.css
```

### 11.4 `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

## 12. 第八步：执行验证

配置完以后，在项目根目录执行下面几条命令：

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
```

如果没有报错，这套配置就已经能正常工作。

还可以故意测试两个场景。

### 12.1 测试 ESLint

比如在某个组件里写一个未使用变量：

```ts
const unusedValue = 1
```

执行：

```bash
pnpm lint
```

正常情况下应该能看到 `no-unused-vars` 相关报错。

### 12.2 测试 Prettier

故意把代码格式打乱，比如：

```ts
const list=[1,2,3]
```

执行：

```bash
pnpm format
```

正常情况下，Prettier 会把它改成统一格式。

## 13. 如果你用的是 `react` 而不是 `react-ts`

如果你创建项目时用的是：

```bash
pnpm create vite my-vite-react-app --template react
```

那你可以继续沿用同样思路，但要做两处调整：

### 13.1 把 `eslint.config.mjs` 改成 JS 版本

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
])
```

### 13.2 安装依赖时去掉 `typescript-eslint`

```bash
pnpm add -D eslint @eslint/js globals eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

## 14. 这套方案的几个关键决策

### 14.1 为什么用 `recommendedTypeChecked`

因为它比纯 `recommended` 多了一层类型信息校验，更适合团队项目长期维护。

代价是 lint 会稍微慢一点，但一般仍然在可接受范围内。

如果你项目非常大，或者刚接手历史项目不想一次性拉太紧，也可以先把：

```js
tseslint.configs.recommendedTypeChecked
```

换成：

```js
tseslint.configs.recommended
```

### 14.2 为什么接 `eslint-config-prettier`，但不用 `eslint-plugin-prettier`

这是一个工程取舍。

这里采用的是：

- `ESLint` 只管 lint
- `Prettier` 只管 format
- `eslint-config-prettier` 负责关掉冲突规则

这样职责更清晰，性能也更稳定。

### 14.3 为什么不用 `.eslintignore`

因为在 Flat Config 体系下，忽略规则可以直接写在：

```js
globalIgnores(['dist', 'coverage'])
```

这比额外维护一个旧式 `.eslintignore` 更统一。

## 15. 常见问题

### 15.1 `pnpm lint` 提示找不到类型信息或 TS 配置

优先检查：

- 根目录是否真的存在 `tsconfig.json`
- `eslint.config.mjs` 里是否写了 `tsconfigRootDir: import.meta.dirname`
- 你是不是把配置文件放错目录了

### 15.2 Prettier 和 ESLint 规则打架怎么办

先确认 ESLint 配置最后是否已经接入：

```js
eslintConfigPrettier
```

如果没有，很多格式类规则会和 Prettier 冲突。

### 15.3 为什么 VS Code 里保存时没自动格式化

这不是 ESLint/Prettier 配置本身失效，通常是编辑器没有启用对应插件或默认格式化器。

建议本地至少安装：

- `Prettier - Code formatter`
- `ESLint`

## 16. 一页总结

如果你要一套适合 **Vite + React + TypeScript** 的现代工程化配置，直接用下面这组：

- `ESLint Flat Config`
- `typescript-eslint` 的 `recommendedTypeChecked`
- `react-hooks` + `react-refresh`
- `Prettier`
- `eslint-config-prettier`

最终你至少要落地这 4 个文件：

- `eslint.config.mjs`
- `.prettierrc.json`
- `.prettierignore`
- `.editorconfig`

再配上这几个脚本：

- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm format:check`

这套方案足够新、足够稳，也方便团队直接复制进项目里使用。

## 参考资料

- [Vite Getting Started](https://vite.dev/guide/)
- [Vite React TS 模板 eslint.config.js](https://raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/template-react-ts/eslint.config.js)
- [ESLint Flat Config 文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [TypeScript ESLint Typed Linting](https://typescript-eslint.io/getting-started/typed-linting)
- [Prettier Install](https://prettier.io/docs/install)
- [npm registry: vite](https://registry.npmjs.org/vite)
- [npm registry: react](https://registry.npmjs.org/react)
- [npm registry: eslint](https://registry.npmjs.org/eslint)
- [npm registry: prettier](https://registry.npmjs.org/prettier)
- [npm registry: typescript-eslint](https://registry.npmjs.org/typescript-eslint)

