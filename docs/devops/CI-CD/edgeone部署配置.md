# EdgeOne Pages 部署配置

> 官方文档：[使用 Github Action](https://cloud.tencent.com/document/product/1552/127398)

## 一、部署方式说明

EdgeOne Pages 常见有两种部署方式：

1. 在 EdgeOne 控制台绑定 GitHub 仓库，由 EdgeOne 自动拉取代码、构建、部署。
2. 使用 GitHub Actions 构建项目，然后通过 EdgeOne CLI 上传 `dist` 目录。

如果使用 GitHub Actions 执行下面这种命令：

```bash
npx edgeone pages deploy ./dist -n note-blog -t $EDGEONE_API_TOKEN
```

EdgeOne Pages 项目必须是 **Upload** 类型。

如果项目是在 EdgeOne 控制台通过 GitHub 仓库导入创建的，它的 Provider 是 `Github`，这种项目不支持 CLI 直接上传 `dist` 目录。

## 二、创建 EdgeOne Pages 项目

进入 EdgeOne Pages 控制台，新建项目时选择上传部署方式，创建一个 Upload 类型项目。

例如项目名：

```text
note-blog
```

后续 GitHub Actions 中的 `-n note-blog` 必须和 EdgeOne Pages 项目名保持一致。

## 三、设置 GitHub 仓库 Secrets

要运行 GitHub Actions，需要先在 GitHub 仓库中创建 EdgeOne API Token 对应的 Secret。

进入 GitHub 仓库页面，依次打开：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

然后新增仓库 Secret：

```text
Name: EDGEONE_API_TOKEN
Secret: EdgeOne API token 的值
```

GitHub Actions 中通过下面的方式读取：

```yaml
${{ secrets.EDGEONE_API_TOKEN }}
```

EdgeOne API Token 可以在腾讯云 EdgeOne 控制台中创建，具体可参考官方的 API Token 文档。

## 四、GitHub Actions 配置

在项目根目录创建或修改 `.github/workflows/main.yml`：

```yaml title=".github/workflows/main.yml"
name: Build and Deploy

# 向主干 main 分支推送代码时触发部署
on:
  push:
    branches:
      - main

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build project
        run: pnpm run build

      - name: Deploy to EdgeOne Pages
        run: npx edgeone pages deploy ./dist -n note-blog -t ${{ secrets.EDGEONE_API_TOKEN }}
        env:
          EDGEONE_API_TOKEN: ${{ secrets.EDGEONE_API_TOKEN }}
```

## 五、EdgeOne CLI 参数说明

部署命令格式：

```bash
npx edgeone pages deploy <outputDirectory> -n <projectName> -t <token> [-e <env>]
```

参数说明：

| 参数 | 说明 | 是否必填 |
| --- | --- | --- |
| `<outputDirectory>` | 项目构建后产物所在的文件夹，例如 `./dist` | 必填 |
| `-n, --name` | 需要部署的项目名称，项目不存在时会自动创建新项目 | 必填 |
| `-t, --token` | EdgeOne API Token，建议通过 GitHub Secrets 读取 | 必填 |
| `-e, --env` | 部署目标环境，可选值为 `production` 或 `preview`，默认是 `production` | 选填 |

示例：

```bash
npx edgeone pages deploy ./dist -n note-blog -t ${{ secrets.EDGEONE_API_TOKEN }}
```

部署到预览环境：

```bash
npx edgeone pages deploy ./dist -n note-blog -t ${{ secrets.EDGEONE_API_TOKEN }} -e preview
```

## 六、关键配置说明

### 1、触发分支

```yaml
on:
  push:
    branches:
      - main
```

表示推送到 `main` 分支时自动执行部署。

如果仓库主分支是 `master`，需要改成：

```yaml
branches:
  - master
```

### 2、pnpm 版本

```yaml
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10
```

这里安装 pnpm 10，适合项目中使用较新的 `pnpm-lock.yaml`。

### 3、Node.js 版本

```yaml
node-version: '22'
```

建议使用 Node.js LTS 版本，例如 `22`。如果使用过新的非 LTS 版本，部分依赖可能出现兼容问题。

### 4、构建目录

当前 Rspress 项目的输出目录是 `dist`，对应部署命令：

```bash
npx edgeone pages deploy ./dist -n note-blog -t $EDGEONE_API_TOKEN
```

如果项目输出目录不是 `dist`，需要同步修改部署命令中的目录。

## 七、常见错误

### 1、Project exists but has Provider 'Github'

错误示例：

```text
Deployment failed: [getOrCreateProject] Project note-blog exists but has Provider 'Github'. This project type does not support direct folder or zip file deployment. Only projects with Provider 'Upload' are supported.
```

原因：

当前 EdgeOne Pages 项目是通过 GitHub 仓库导入创建的，Provider 是 `Github`，但是 GitHub Actions 使用的是 CLI 上传 `dist` 目录的方式。

解决方式：

1. 如果想继续使用 GitHub Actions + CLI 上传，重新创建一个 Upload 类型项目，并确保 `-n` 后面的项目名是 Upload 类型项目名。
2. 如果想使用 EdgeOne 控制台的 GitHub 自动部署，就删除 GitHub Actions 中的 `npx edgeone pages deploy` 步骤，改为在 EdgeOne 控制台配置构建命令和输出目录。

### 2、API Token 未配置或无效

如果日志中出现 token 相关错误，需要检查：

1. GitHub Secrets 中是否存在 `EDGEONE_API_TOKEN`。
2. Secret 名称是否拼写正确。
3. EdgeOne API Token 是否过期或权限不足。

### 3、找不到 dist 目录

如果部署时提示找不到 `dist`，需要先确认构建是否成功：

```bash
pnpm run build
```

也可以在 workflow 中临时增加检查命令：

```yaml
- name: Check build output
  run: ls -la dist
```
