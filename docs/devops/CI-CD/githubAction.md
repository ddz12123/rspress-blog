# GitHub Action部署前端项目

## 一、生成私钥和公钥
### 1、在本地电脑生成新密钥（PEM格式）
```bash
ssh-keygen -t rsa -b 4096 -m PEM -f gh_action_key -N ""
```
- gh_action_key (私钥，没后缀)
- gh_action_key.pub (公钥)

### 2、把公钥放到阿里云服务器
```bash
cd ~/.ssh
# 按 i 进入编辑模式，粘贴内容，按 Esc，输入 :wq 保存
vi authorized_keys
```

## 二、GitHub Secrets配置
在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加：
- `SERVER_IP`：值为服务器 IP 地址
- `SERVER_USER`：值为服务器登录用户名
- `SERVER_SSH_KEY`：值为服务器登录用户的私钥内容


## 三、部署静态前端项目

> 以Repress项目举例，vitepress之类的静态博客部署方式都差不多

```yaml title=".github/workflows/deploy.yml"
name: Deploy Static Site
on:
  push:
    branches:
      - master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. 核心新增：安装 PNPM
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9 

      # 2. 修改：设置 Node 并开启 pnpm 缓存
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.13.0' 设置 Node.js 版本
          cache: 'pnpm' # <--- 关键修改：告诉它去找 pnpm-lock.yaml

      # 3. 修改：使用 pnpm 命令安装和打包
      - name: Install & Build
        run: |
          node -v
          pnpm -v
          pnpm install --frozen-lockfile # 类似 npm ci，严格按照 lock 文件安装
          pnpm run build
          ls -la dist/

      # 4. 上传文件 (保持不变)
      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: 'dist/*'
          target: '/var/www/html/vue-admin-template/'
          strip_components: 1

```