# pnpm Monorepo 架构

目标：一个仓库维护两个前端项目（Vite + React / Vite + Vue3），覆盖完整流程：项目架构、开发运行、打包。

## 1. 最终目录结构

```txt
my-monorepo/
├─ apps/
│  ├─ project-a-react/        # Vite React
│  │  ├─ src/
│  │  ├─ package.json         # name: "@apps/project-a-react"
│  │  └─ vite.config.ts
│  └─ project-b-vue3/         # Vite Vue3
│     ├─ src/
│     ├─ package.json         # name: "@apps/project-b-vue3"
│     └─ vite.config.ts
├─ packages/
│  ├─ shared-utils/           # 公共工具库
│  │  ├─ src/
│  │  └─ package.json         # name: "@repo/shared-utils"
│  ├─ eslint-config/          # 公共 lint 配置（可选）
│  └─ tsconfig/               # 公共 ts 配置（可选）
├─ pnpm-workspace.yaml
├─ package.json               # private: true，根目录脚本
├─ tsconfig.base.json
└─ .npmrc
```

---

## 2. 初始化

```bash
mkdir my-monorepo && cd my-monorepo
pnpm init
```

### 2.1 工作区配置

`pnpm-workspace.yaml`：

```yaml
packages:
  - apps/*
  - packages/*
```

`.npmrc`：

```ini
# 自动安装 peer dependencies（避免手动一个个装）
auto-install-peers=true
# peer 版本不匹配时不报错，只警告（防止安装卡死）
strict-peer-dependencies=false
```

### 2.2 根 package.json

初始化后生成，修改为：

```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel --filter @apps/* dev",
    "dev:a": "pnpm --filter @apps/project-a-react dev",
    "dev:b": "pnpm --filter @apps/project-b-vue3 dev",
    "build": "pnpm -r --filter @apps/* build",
    "build:a": "pnpm --filter @apps/project-a-react build",
    "build:b": "pnpm --filter @apps/project-b-vue3 build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

### 2.3 创建子项目

```bash
pnpm create vite apps/project-a-react --template react-ts
pnpm create vite apps/project-b-vue3 --template vue-ts
pnpm install
```

### 2.4 子项目命名与配置

把两个 app 的 `package.json` 中的 `name` 改为 `@apps/project-a-react` / `@apps/project-b-vue3`。

同时在 `vite.config.ts` 中固定端口，避免并行 dev 时冲突：

apps/project-a-react/vite.config.ts：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

apps/project-b-vue3/vite.config.ts：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { port: 5174 },
})
```

---

## 3. 依赖管理（核心操作）

### 3.1 安装根依赖（工具链）

eslint、prettier、typescript、commitlint 等工具链依赖装根目录：

```bash
pnpm add -D -w eslint prettier typescript
```

### 3.2 安装子项目依赖

```bash
# 给 React 项目单独装
pnpm add axios --filter @apps/project-a-react
pnpm add -D @types/node --filter @apps/project-a-react

# 给 Vue 项目单独装
pnpm add pinia --filter @apps/project-b-vue3

# 同时装多个项目
pnpm add dayjs --filter @apps/project-a-react --filter @apps/project-b-vue3
```

### 3.3 内部包引用

子项目引用公共包，在 `package.json` 中写：

```json
{
  "dependencies": {
    "@repo/shared-utils": "workspace:*"
  }
}
```

然后根目录执行 `pnpm install`。

### 3.4 删除、查看、升级

```bash
pnpm remove axios --filter @apps/project-a-react   # 删除
pnpm outdated -r                                    # 查看过期
pnpm up -r                                          # 升级全部
```

### 3.5 原则

- 工具链依赖 → 根目录（`-w`）
- 业务依赖 → 子项目（`--filter`）
- 内部包 → `workspace:*`
- 所有命令在根目录执行

---

## 4. 公共包示例

```bash
mkdir -p packages/shared-utils/src
```

`packages/shared-utils/package.json`：

```json
{
  "name": "@repo/shared-utils",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`packages/shared-utils/src/index.ts`：

```ts
export const formatDate = (value: string | number | Date) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

在 app 中使用：

```ts
import { formatDate } from '@repo/shared-utils'
```

---

## 5. 运行与构建

```bash
pnpm dev:a        # 只跑 React（http://localhost:5173）
pnpm dev:b        # 只跑 Vue（http://localhost:5174）
pnpm dev          # 一起跑

pnpm build:a      # 构建 React → apps/project-a-react/dist
pnpm build:b      # 构建 Vue → apps/project-b-vue3/dist
pnpm build        # 全量构建
```

---

## 6. 常见问题

### 6.1 子项目找不到 workspace 依赖

- 检查 `pnpm-workspace.yaml` 是否包含 `packages/*`
- 检查依赖是否写成 `"workspace:*"`
- 根目录重新 `pnpm install`

### 6.2 端口冲突

各自 `vite.config.ts` 配置 `server.port` 固定端口。

### 6.3 部署后刷新 404

前端 history 路由 + 服务端未配置 fallback。Nginx 加 `try_files $uri $uri/ /index.html;`。
