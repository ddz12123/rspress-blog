# AllInSSL Docker 部署文档

## 简介
AllInSSL 是一款开源 SSL 证书全生命周期管理工具，支持自动申请、续期 Let's Encrypt、ZeroSSL 等免费证书，兼容主流 DNS 服务商（阿里云、腾讯云、Cloudflare 等），提供可视化 Web 界面简化证书管理流程。

## 环境要求
- 已安装 Docker（仅支持 Linux 系统）
- 开放 7979 端口（Web 管理界面访问）
- 准备域名 DNS 服务商的 API 密钥（DNS 验证必需）

## Docker 部署步骤

### 1. 拉取镜像
```bash
docker pull allinssl/allinssl:latest
```

### 2. 创建挂载目录
用于持久化证书、配置与数据，避免容器重启数据丢失：

```bash
mkdir -p /www/allinssl/data
```

### 3. 启动容器（官方命令）
```bash
docker run -itd \
  --name allinssl \
  -p 7979:8888 \
  -v /www/allinssl/data:/www/allinssl/data \
  -e ALLINSSL_USER=allinssl \
  -e ALLINSSL_PWD=allinssldocker \
  -e ALLINSSL_URL=allinssl \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  allinssl/allinssl:latest
```

> 参数说明：
> - `-p 7979:8888`：宿主机 7979 端口映射到容器 8888 端口（Web 服务端口）
> - `-v /www/allinssl/data:/www/allinssl/data`：持久化存储证书、配置与数据库
> - `ALLINSSL_USER`：Web 登录用户名（默认 `allinssl`）
> - `ALLINSSL_PWD`：Web 登录密码（默认 `allinssldocker`，建议首次登录后修改）
> - `ALLINSSL_URL`：Web 访问路径后缀（默认 `allinssl`，完整访问地址为 `http://IP:7979/allinssl`）
> - `TZ=Asia/Shanghai`：设置容器时区为上海（可选，建议添加）

### 4. 验证运行状态
```bash
docker ps | grep allinssl
```
容器状态为 `Up` 即启动成功。

## 访问管理界面
浏览器访问：`http://服务器IP:7979/allinssl`（本地直接访问 `http://localhost:7979/allinssl`）

默认登录信息：
- 用户名：`allinssl`
- 密码：`allinssldocker`

首次登录后请立即修改密码。

## Docker Compose 部署（可选）
创建 `docker-compose.yml`：
```yaml
version: '3'
services:
  allinssl:
    image: allinssl/allinssl:latest
    container_name: allinssl
    ports:
      - "7979:8888"
    volumes:
      - /www/allinssl/data:/www/allinssl/data
    environment:
      - ALLINSSL_USER=allinssl
      - ALLINSSL_PWD=allinssldocker
      - ALLINSSL_URL=allinssl
      - TZ=Asia/Shanghai
    restart: unless-stopped
```
启动：
```bash
docker-compose up -d
```

## 常用操作
- 查看日志：`docker logs -f allinssl`
- 停止容器：`docker stop allinssl`
- 重启容器：`docker restart allinssl`
- 删除容器：`docker rm -f allinssl`
- 进入容器：`docker exec -it allinssl /bin/sh`

## 注意事项
1. 挂载目录 `/www/allinssl/data` 需有读写权限，确保 Docker 进程可访问。
2. 远程访问需在防火墙开放 7979 端口（如 `firewall-cmd --add-port=7979/tcp --permanent && firewall-cmd --reload`）。
3. DNS 验证需确保 API 密钥具备域名解析修改权限。
4. 证书与配置默认存储在 `/www/allinssl/data`，建议定期备份该目录。
5. 默认密码为公开信息，首次登录后请至 **系统设置** 修改密码。
6. 如需修改访问端口或路径，调整 `-p` 参数与 `ALLINSSL_URL` 环境变量后重启容器即可。
