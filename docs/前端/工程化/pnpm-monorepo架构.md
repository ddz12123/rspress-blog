# pnpm Monorepo 架构

> 目标：在一个仓库里维护两个前端项目。  
> 项目 A：`Vite + React`  
> 项目 B：`Vite + Vue3`  
> 并且覆盖完整流程：项目架构、开发运行、打包、部署。


## 1. 什么时候用 Monorepo

适合：

- 你有多个前端应用（管理台、官网、运营后台等）。
- 多个应用有公共代码（工具库、组件库、请求封装、TS 配置）。
- 希望统一依赖、统一脚手架、统一 CI/CD。

不适合：

- 只有单个小项目，且短周期一次性交付。

---

## 2. 最终目录结构（推荐）

```txt
my-monorepo/
├─ apps/
│  ├─ project-a-react/        # Vite React 项目
│  └─ project-b-vue3/         # Vite Vue3 项目
├─ packages/
│  ├─ shared-utils/           # 公共工具库（示例）
│  ├─ eslint-config/          # 公共 lint 配置（可选）
│  └─ tsconfig/               # 公共 ts 配置（可选）
├─ pnpm-workspace.yaml
├─ package.json               # 根脚本（统一运行/打包）
├─ tsconfig.base.json
└─ .npmrc
```

---

## 3. 初始化项目（从 0 到可运行）

### 3.1 创建仓库与工作区

```bash
mkdir my-monorepo
cd my-monorepo
pnpm init
```

创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - apps/*
  - packages/*
```

创建 `.npmrc`（推荐）：

```ini
auto-install-peers=true
strict-peer-dependencies=false
```

### 3.2 创建两个 Vite 子项目

```bash
pnpm create vite apps/project-a-react --template react-ts
pnpm create vite apps/project-b-vue3 --template vue-ts
```

安装依赖（根目录执行）：

```bash
pnpm install
```

### 3.3 依赖管理（你提到的重点）

这部分是 Monorepo 最核心的日常操作。

#### 1. 安装根依赖（全仓共享）

适用于 eslint、prettier、typescript、commitlint 这类工具链依赖。

```bash
pnpm add -D -w eslint prettier typescript
```

- `-w` 表示安装到 workspace 根目录。

#### 2. 安装某个子项目依赖

只给 React 项目安装 `axios`：

```bash
pnpm add axios --filter @apps/project-a-react
```

只给 Vue3 项目安装 `pinia`：

```bash
pnpm add pinia --filter @apps/project-b-vue3
```

只给某个子项目安装开发依赖：

```bash
pnpm add -D @types/node --filter @apps/project-a-react
```

#### 3. 同时给多个子项目安装依赖

```bash
pnpm add dayjs --filter @apps/project-a-react --filter @apps/project-b-vue3
```

#### 4. 给 packages 下的公共子包安装依赖

```bash
pnpm add -D tsup --filter @repo/shared-utils
```

#### 5. 子项目引用仓库内公共包

在子项目 `package.json` 中写：

```json
{
  "dependencies": {
    "@repo/shared-utils": "workspace:*"
  }
}
```

然后根目录执行：

```bash
pnpm install
```

#### 6. 删除、升级、查看依赖

删除某个子项目依赖：

```bash
pnpm remove axios --filter @apps/project-a-react
```

查看全仓过期依赖：

```bash
pnpm outdated -r
```

升级全仓依赖：

```bash
pnpm up -r
```

#### 7. 团队建议

- 工具链依赖优先装根目录。
- 业务依赖装到对应子项目，不要全部堆根目录。
- 内部包统一 `workspace:*`，避免本地和 CI 版本不一致。
- 所有安装命令都在根目录执行，再配合 `--filter` 精准安装。

---

## 4. 根目录脚本设计（企业常用）

根目录 `package.json` 示例：

```json
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "pnpm -r --parallel --filter @apps/* dev",
    "dev:a": "pnpm --filter @apps/project-a-react dev",
    "dev:b": "pnpm --filter @apps/project-b-vue3 dev",
    "build": "pnpm -r --filter @apps/* build",
    "build:a": "pnpm --filter @apps/project-a-react build",
    "build:b": "pnpm --filter @apps/project-b-vue3 build",
    "preview:a": "pnpm --filter @apps/project-a-react preview",
    "preview:b": "pnpm --filter @apps/project-b-vue3 preview",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

把两个子项目的 `name` 改成：

- `apps/project-a-react/package.json`：`"name": "@apps/project-a-react"`
- `apps/project-b-vue3/package.json`：`"name": "@apps/project-b-vue3"`

---

## 5. 公共包示例（packages/shared-utils）

### 5.1 创建公共包

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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

### 5.2 在 React/Vue 项目中使用公共包

在两个 app 的 `package.json` 增加依赖：

```json
{
  "dependencies": {
    "@repo/shared-utils": "workspace:*"
  }
}
```

然后根目录执行：

```bash
pnpm install
```

使用示例：

```ts
import { formatDate } from '@repo/shared-utils'
```

---

## 6. 运行流程（开发环境）

### 6.1 只跑 React 项目

```bash
pnpm dev:a
```

### 6.2 只跑 Vue3 项目

```bash
pnpm dev:b
```

### 6.3 两个项目一起跑

```bash
pnpm dev
```

说明：

- `pnpm --filter` 是 Monorepo 核心能力，建议团队统一使用。
- 多项目并行开发时，端口冲突需在各自 `vite.config.ts` 里固定端口。

---

## 7. 打包流程（生产构建）

### 7.1 全量构建

```bash
pnpm build
```

构建产物：

- `apps/project-a-react/dist`
- `apps/project-b-vue3/dist`

### 7.2 按项目构建

```bash
pnpm build:a
pnpm build:b
```

建议：

- CI 默认全量构建，或按分支策略做增量构建。
- 构建前统一执行 `pnpm lint` 和 `pnpm typecheck`。

---

## 8. 部署流程（完整示例）

这里给一套常见企业流程：`Git 推送 -> CI 构建 -> 上传产物 -> Nginx 发布`。

### 8.1 服务器目录规划

```txt
/var/www/
├─ react-app/      # project-a-react 的 dist
└─ vue-app/        # project-b-vue3 的 dist
```

### 8.2 Nginx 配置（同域名不同路径）

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location /react/ {
    alias /var/www/react-app/;
    try_files $uri $uri/ /index.html;
  }

  location /vue/ {
    alias /var/www/vue-app/;
    try_files $uri $uri/ /index.html;
  }
}
```

> 如果你使用的是 history 路由，需要确保前端 `base` 与部署路径一致。  
> React 项目一般配置 `base: '/react/'`，Vue 项目配置 `base: '/vue/'`。

### 8.3 GitHub Actions 示例（构建 + 部署）

`.github/workflows/deploy.yml`：

```yaml
name: build-and-deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build

      - name: Upload React Dist
        uses: actions/upload-artifact@v4
        with:
          name: react-dist
          path: apps/project-a-react/dist

      - name: Upload Vue Dist
        uses: actions/upload-artifact@v4
        with:
          name: vue-dist
          path: apps/project-b-vue3/dist
```

你可以在后续 job 里用 `scp/rsync` 上传到服务器，或接入你公司的发布平台。

---

## 9. 发布与回滚建议（实战）

- 每次部署生成唯一版本目录，如 `/var/www/react-app/releases/20260305-1530/`。
- 软链接 `current` 指向当前版本，发布时切换软链接实现秒级回滚。
- 回滚只需把 `current` 指回旧版本目录并 reload Nginx。

---

## 10. 常见问题与排查

### 10.1 子项目无法识别 workspace 依赖

- 检查 `pnpm-workspace.yaml` 是否包含 `packages/*`。
- 检查依赖是否写成 `"workspace:*"`。
- 根目录重新执行 `pnpm install`。

### 10.2 两个项目端口冲突

在各自 `vite.config.ts` 配置固定端口：

```ts
server: {
  port: 5173
}
```

```ts
server: {
  port: 5174
}
```

### 10.3 部署后刷新 404

- 前端 history 路由 + 服务端未配置 fallback。
- 按上文 Nginx `try_files ... /index.html` 配置处理。

---

## 11. 一页总结

- 用 `pnpm-workspace` 管理多项目，目录推荐 `apps/* + packages/*`。
- 两个业务项目（React/Vue）都作为 workspace package 管理。
- 依赖安装遵循：根依赖用 `-w`，子项目依赖用 `--filter`，内部包用 `workspace:*`。
- 根脚本用 `--filter` 做单项目运行/打包。
- 部署时按应用拆分产物目录，推荐 Nginx 路径隔离或子域名隔离。
- CI 流程固定为：安装 -> lint -> typecheck -> build -> 上传产物 -> 发布。
