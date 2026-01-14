# docker compose配置

## 一、常用命令

```she
# 启动服务
docker-compose up
docker-compose up -d  # 后台运行

# 停止服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs
docker-compose logs -f [服务名]

# 构建/重建服务
docker-compose build
docker-compose up --build

# 执行命令
docker-compose exec [服务名] [命令]
```

## 二、部署示例

目录如下：

![image-20260107142642507](https://img.ainotehub.top/图片/image-20260107142642507.png)

在根目录创建docker-compose.yml文件

```she
# 自定义网络（核心：让 Nginx 和 Gin 服务在同一网络下，可通过服务名互相访问）
networks:
  app-network:  # 网络名称，可自定义
    driver: bridge  # 默认桥接网络，稳定易用
services:
  nginx:
    image: nginx:alpine  # 轻量镜像，极简占用
    container_name: nginx-base
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /home/app/nginx/conf/nginx.conf:/etc/nginx/nginx.conf
      - /home/app/nginx/www:/usr/share/nginx/html
      - /home/app/nginx/logs:/var/log/nginx
      - /home/app/nginx/conf/ssl:/etc/nginx/ssl
      - /home/app/gin:/usr/share/gin-static
    networks:
      - app-network
  gin-app:
    build:
      context: ./gin  # 指向 Gin 项目目录（/home/app/gin/，包含 Dockerfile 和 gin-app 二进制包）
      dockerfile: Dockerfile  # 对应上述创建的 Dockerfile
    container_name: gin-app  # 容器名称，便于管理
    restart: always  # 开机自启/异常重启
    ports:
      - "3001:3001"
    networks:
      - app-network  # 加入自定义网络，与 Nginx 互通  
    volumes:
      - /home/app/gin/docs:/app/docs
      - /home/app/gin/uploads:/app/uploads
  nextjs-app:
    build:
      context: ./nextjs
      dockerfile: Dockerfile
    container_name: nextjs-app
    restart: always
    networks:
      - app-network
    # 暴露 3000 端口（主机3000 → 容器3000，可自定义主机端口如 "3001:3000"）
    ports:
      - "3000:3000"
    # 核心：挂载主机 /home/app/nextjs → 容器 /app（与工作目录一致）
    volumes:
      - /home/app/nextjs:/app
  openlist:
    image: 'openlistteam/openlist:latest-lite'
    container_name: openlist
    user: '0:0' 
    volumes:
      - './openlist/data:/opt/openlist/data'
    ports:
      - '8000:5244'
    environment:
      - UMASK=022
      - TZ=Asia/Shanghai
    restart: unless-stopped
    networks:
      - app-network
  drawnix:
    image: pubuzhixing/drawnix:latest 
    container_name: drawnix            
    restart: unless-stopped      
    ports:
      - "8002:80"  
    user: '0:0'   
    volumes:
      - /home/app/drawnix:/home/static/data
    environment:
      - NODE_ENV=production
    networks:
      - app-network                       
  
```

