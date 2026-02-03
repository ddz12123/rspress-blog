# ESLint 与 Prettier配置

在现代前端开发中，**代码质量**和**代码风格**是工程化建设的两个核心支柱。ESLint 和 Prettier 是目前社区最主流的两个工具，分别负责这两方面的职责。本文将详细介绍它们的作用、如何结合使用，并提供符合一线大厂规范的配置参考。

## 1. 工具简介

### ESLint：代码质量守护者
ESLint 是一个开源的 JavaScript 代码检查工具（Linter）。它的主要功能是：
- **捕获潜在错误**：如使用未声明的变量、死循环、未使用的变量等。
- **强制最佳实践**：如禁止使用 `eval`、强制使用 `===` 等。
- **代码风格检查**（部分）：虽然它也能检查分号、缩进，但这部分功能通常交给 Prettier。

### Prettier：代码风格统一者
Prettier 是一个“固执己见”的代码格式化工具（Formatter）。它不关心代码逻辑，只关心代码长什么样。它的特点是：
- **零配置（Opinionated）**：提供了一套标准的格式化方案，减少团队在“加不加分号”、“换行怎么换”等琐事上的争论。
- **支持多种语言**：支持 JS/TS、HTML、CSS、JSON、Markdown 等。
- **保存即格式化**：通常配合 IDE 插件实现保存文件时自动重写代码格式。


## 2. 为什么要结合使用？

虽然 ESLint 也有格式化功能，Prettier 也有少许语法检查，但术业有专攻：
- **ESLint** 擅长 **Code Quality**（代码质量）。
- **Prettier** 擅长 **Code Formatting**（代码风格）。

如果不加配置地同时使用，两者会在格式化规则上发生冲突（例如 ESLint 说要单引号，Prettier 默认双引号），导致红波浪线满天飞。因此，我们需要特定的工具来让它们和谐共处。

### 核心结合方案

为了解决冲突，社区提供了两个核心包：

1.  **`eslint-config-prettier`**
    *   **作用**：关闭 ESLint 中所有可能与 Prettier 发生冲突的格式化规则。
    *   **原理**：覆盖 ESLint 配置，将冲突规则设为 `off`。

2.  **`eslint-plugin-prettier`**
    *   **作用**：将 Prettier 的格式化能力集成到 ESLint 中。
    *   **原理**：它把 Prettier 当作 ESLint 的一条规则来运行。如果代码不符合 Prettier 规范，ESLint 就会报错（通常显示为红色波浪线）。

> **最佳实践**：在现代配置中，通常同时使用这两个包，实现“通过 ESLint 运行 Prettier，并统一报告错误”。


## 3. 符合大厂规范的配置实战

以下配置方案采用 **ESLint 9.0+ 推荐的 Flat Config (扁平化配置)**，原生支持 **ESM** 语法，符合最新的前端工程化标准。

### 3.1 安装依赖

注意：Flat Config 需要使用新版的 `typescript-eslint` 包和 `globals` 库。

```bash
# 安装核心依赖 (ESLint, Prettier, Globals, Core JS Rules)
npm install --save-dev eslint @eslint/js globals prettier

# 安装 TypeScript 支持 (新版 Flat Config 专用包)
npm install --save-dev typescript-eslint

# 安装 Prettier 结合工具
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

### 3.2 Prettier 配置文件 (`.prettierrc`)

这是一个符合大多数团队习惯的配置，强调可读性和一致性。

```json
{
  "printWidth": 100,          // 单行代码最大长度，超过换行
  "tabWidth": 2,              // 缩进占用两个空格
  "useTabs": false,           // 不使用 Tab 缩进，使用空格
  "semi": true,               // 语句末尾加分号 (大厂通常强制，减少 ASI 隐患)
  "singleQuote": true,        // 使用单引号代替双引号 (JS社区习惯)
  "quoteProps": "as-needed",  // 对象属性仅在必要时加引号
  "jsxSingleQuote": false,    // JSX 中使用双引号 (React 习惯)
  "trailingComma": "all",     // 多行时尽可能打印尾随逗号 (利于 git diff)
  "bracketSpacing": true,     // 对象字面量的大括号间打印空格 { foo: bar }
  "arrowParens": "always",    // 箭头函数参数始终加括号 (利于类型推导和扩展)
  "endOfLine": "lf"           // 换行符使用 LF (Mac/Linux标准，避免 Windows CRLF 问题)
}
```

### 3.3 ESLint 配置文件 (`eslint.config.js`)

使用 ESM 语法 (`import`/`export`) 的扁平化配置。

```javascript
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 全局忽略配置 (相当于旧版的 .eslintignore)
  { ignores: ['dist', 'node_modules', 'coverage', 'public'] },

  // 基础 JS 推荐配置
  js.configs.recommended,

  // TypeScript 推荐配置 (展开数组)
  ...tseslint.configs.recommended,

  // 自定义配置
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // --- Prettier 整合 ---
      'prettier/prettier': 'error', // 违反 Prettier 规则视为 ESLint 错误

      // --- TypeScript 规范 ---
      '@typescript-eslint/no-explicit-any': 'warn',        // 警告使用 any
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // 允许下划线开头的未使用参数
      
      // --- 代码质量与最佳实践 ---
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // 必须放在最后：关闭所有与 Prettier 冲突的规则
  prettierConfig,
);
```

### 3.4 VSCode 自动化配置

为了实现“写完代码，按 Ctrl+S 自动修复所有格式问题”，需要在项目根目录创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,                // 开启保存自动格式化
  "editor.defaultFormatter": "esbenp.prettier-vscode", // 默认使用 Prettier 插件
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"        // 保存时自动修复 ESLint 问题
  },
  // 针对不同语言的覆盖配置
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  // 告诉 ESLint 插件使用扁平化配置 (对于旧版 VSCode 插件可能需要)
  "eslint.experimental.useFlatConfig": true
}
```

