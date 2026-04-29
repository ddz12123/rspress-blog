# tsconfig 配置指南

tsconfig.json 是 TypeScript 项目的配置文件，控制编译行为、类型检查、路径解析等。

## 企业级项目通用配置

直接复制就能用，注释都写在配置里了：

```jsonc
{
  "compilerOptions": {
    // ========== 编译目标 ==========
    "target": "ES2020",                    // 编译到 ES2020，能用可选链、空值合并等新语法
    "module": "ESNext",                    // 用 ES 模块（import/export）
    "moduleResolution": "bundler",         // Vite/Webpack 项目用这个，别用 node
    "lib": ["ES2020", "DOM", "DOM.Iterable"], // 浏览器环境需要 DOM 类型

    // ========== 严格模式 ==========
    "strict": true,                        // 开启严格检查，能发现很多隐藏 bug

    // ========== 模块相关 ==========
    "jsx": "preserve",                     // JSX 交给打包器处理（Vue 用 preserve，React 用 react-jsx）
    "resolveJsonModule": true,             // 可以 import json 文件
    "isolatedModules": true,               // 每个文件能独立编译，配合打包器用
    "esModuleInterop": true,               // 让 CommonJS 和 ES 模块能互操作
    "skipLibCheck": true,                  // 跳过 .d.ts 检查，避免第三方库类型报错
    "forceConsistentCasingInFileNames": true, // 文件名大小写必须一致，避免跨平台问题

    // ========== 路径别名 ==========
    "baseUrl": ".",                        // 路径解析基准目录
    "paths": {
      "@/*": ["src/*"]                     // import { xxx } from '@/utils/xxx'
    },

    // ========== 输出配置（前端项目一般不用管） ==========
    "outDir": "dist",                      // 编译输出目录
    "declaration": true,                   // 生成 .d.ts 类型声明文件
    "sourceMap": true,                     // 生成 source map，方便调试

    // ========== 代码质量 ==========
    "noUnusedLocals": true,                // 未使用的变量报错
    "noUnusedParameters": true,            // 未使用的参数报错
    "noFallthroughCasesInSwitch": true     // switch 没 break 要报错
  },

  // 要编译哪些文件
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ],

  // 排除哪些目录
  "exclude": ["node_modules", "dist"]
}
```

## 几个重要配置解释

### target 和 lib

`target` 决定编译到哪个 ES 版本，`lib` 决定能用哪些类型。

```jsonc
{
  "target": "ES2020",  // 现在很少有人要兼容 IE，直接用 ES2020
  "lib": ["ES2020", "DOM", "DOM.Iterable"]  // 浏览器项目要加 DOM
}
```

如果写 Node.js 项目，`lib` 可以去掉 DOM，加上 `"Node"`。

### moduleResolution

这个决定 TypeScript 怎么找模块：

| 值 | 什么时候用 |
|------|------|
| `bundler` | Vite、Webpack 等打包器项目（推荐） |
| `node` | Node.js 项目 |
| `node16` | Node.js 16+，支持 package.json exports |

Vite 项目用 `bundler` 就对了，用 `node` 有些导入会出问题。

### strict

一行顶一堆：

```jsonc
{
  "strict": true
  // 相当于同时开了这些：
  // - strictNullChecks: null 和 undefined 要做类型守卫
  // - noImplicitAny: 禁止隐式 any
  // - noImplicitThis: 禁止隐式 this
  // - strictFunctionTypes: 函数参数类型严格检查
}
```

企业级项目一定要开，能提前发现很多 bug。

### paths（路径别名）

```jsonc
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]  // import { getUser } from '@/utils/user'
  }
}
```

配完后就不用写相对路径了：

```ts
// 之前
import { getUser } from '../../../utils/user'

// 之后
import { getUser } from '@/utils/user'
```

注意：Vite 项目还要在 `vite.config.ts` 里配 alias：

```ts
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

两边都要配，缺一不可。

### skipLibCheck

```jsonc
{
  "skipLibCheck": true  // 跳过 .d.ts 文件检查
}
```

建议开着，不然第三方库的类型错误也会报，很烦。而且能加快编译速度。

## 自定义类型文件

项目里经常需要定义一些类型，比如接口返回的数据结构、全局类型等。

通常在 `src/types` 目录下存放：

```
src/types/
  api.d.ts        # 接口返回类型
  global.d.ts     # 全局类型
  user.d.ts       # 用户相关类型
```

### 方式一：直接在文件里 import

```ts
// src/types/user.ts
export interface UserInfo {
  id: number
  name: string
  email: string
}

// 业务文件里
import type { UserInfo } from '@/types/user'
```

这种方式最简单，用 `import` 引入就行。

### 方式二：全局类型（不用 import）

有些类型希望全局可用，不用每次 import。创建 `src/types/global.d.ts`：

```ts
// 用户信息（全局可用）
interface UserInfo {
  id: number
  name: string
  email: string
}

// API 响应结构（全局可用）
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
```

然后在 `tsconfig.json` 里配置：

```jsonc
{
  "compilerOptions": {
    // 类型文件目录
    "typeRoots": ["./src/types", "./node_modules/@types"]
  },
  // include 已经包含 src/**/*.d.ts，所以 global.d.ts 会被自动识别
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

配完后，`UserInfo`、`ApiResponse` 这些类型在任何文件里都能直接用，不用 import。

### 方式三：给 window 扩展属性

有时候需要给 window 挂自定义属性，创建 `src/types/window.d.ts`：

```ts
interface Window {
  __APP_VERSION__: string
  __API_URL__: string
}
```

然后就能直接用 `window.__APP_VERSION__`，TS 不会报错。

## Vue 项目额外配置

Vue 项目需要声明 `.vue` 文件类型，创建 `src/env.d.ts`：

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

## React 项目额外配置

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",  // React 用这个，不是 preserve
    "allowImportingTsExtensions": true
  }
}
```

