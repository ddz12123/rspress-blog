# docker 常用命令

## 一、镜像相关命令

```she
# 搜索镜像
docker search [镜像名]

# 拉取镜像
docker pull [镜像名]:[标签]
docker pull nginx:latest

# 查看本地镜像
docker images
docker image ls

# 删除镜像
docker rmi [镜像ID/镜像名]
docker image rm [镜像ID]

# 查看镜像详情
docker inspect [镜像ID/镜像名]

# 导出镜像
docker save -o [文件名.tar] [镜像名]

# 导入镜像
docker load -i [文件名.tar]

# 构建镜像
docker build -t [镜像名]:[标签] [Dockerfile路径]
```

## 二、容器相关命令

```she
# 运行容器
docker run [选项] [镜像名]
docker run -d --name mynginx -p 8080:80 nginx

# 常用 run 选项
-d              # 后台运行
--name          # 指定容器名称
-p              # 端口映射（主机:容器）
-v              # 挂载卷
-e              # 设置环境变量
--network       # 指定网络
-it             # 交互式终端

# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 停止容器
docker stop [容器ID/名称]

# 启动已停止的容器
docker start [容器ID/名称]

# 重启容器
docker restart [容器ID/名称]

# 删除容器
docker rm [容器ID/名称]
docker rm -f [容器ID/名称]  # 强制删除运行中的容器

# 进入容器
docker exec -it [容器ID/名称] /bin/bash
docker exec -it [容器ID/名称] sh

# 查看容器日志
docker logs [容器ID/名称]
docker logs -f [容器ID/名称]  # 实时查看
docker logs --tail 100 [容器ID/名称]  # 查看最后100行

# 查看容器详情
docker inspect [容器ID/名称]

# 查看容器进程
docker top [容器ID/名称]

# 复制文件
docker cp [容器ID/名称]:[容器内路径] [主机路径]    # 从容器复制到主机
docker cp [主机路径] [容器ID/名称]:[容器内路径]    # 从主机复制到容器
```

## 三、网络管理

```she
# 查看网络
docker network ls

# 创建网络
docker network create [网络名]

# 查看网络详情
docker network inspect [网络名]

# 连接容器到网络
docker network connect [网络名] [容器名]

# 断开容器网络
docker network disconnect [网络名] [容器名]
```

