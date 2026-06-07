# 安装和连接 MySQL

这一节先把 MySQL 跑起来，并用命令行连接进去。

本机已经安装 MySQL 时，可以直接从“连接 MySQL”开始。

## 一、安装方式选择

常见安装方式有两种：

| 方式 | 适合谁 |
|------|--------|
| 官方安装包 | 适合在电脑上长期安装 MySQL |
| Docker | 适合快速创建和删除环境 |

没有 Docker 基础时，优先使用官方安装包。

## 二、官方安装包

下载地址：

```text
https://dev.mysql.com/downloads/
```

安装时重点记住两件事：

1. 设置 `root` 用户密码。
2. 确认 MySQL 服务已经启动。

`root` 是 MySQL 的超级管理员账号。本地练习时可以用它练习，但真实项目不要把 `root` 账号写进后端配置里。

## 三、使用 Docker 启动 MySQL

已经安装 Docker 时，可以用下面的命令：

```bash
docker run --name mysql-tutorial \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=mysql_tutorial \
  -p 3306:3306 \
  -d mysql:8
```

参数说明：

| 参数 | 含义 |
|------|------|
| `--name mysql-tutorial` | 容器名字 |
| `MYSQL_ROOT_PASSWORD=123456` | 设置 `root` 密码 |
| `MYSQL_DATABASE=mysql_tutorial` | 启动时自动创建一个数据库 |
| `-p 3306:3306` | 把容器的 3306 端口映射到本机 |
| `-d mysql:8` | 后台运行 MySQL 8 镜像 |

停止容器：

```bash
docker stop mysql-tutorial
```

再次启动：

```bash
docker start mysql-tutorial
```

删除容器：

```bash
docker rm -f mysql-tutorial
```

> 删除容器会删除容器里的数据。学习环境可以这样做，真实环境必须先确认备份。

## 四、连接 MySQL

本机安装 MySQL 后，通常可以执行：

```bash
mysql -u root -p
```

含义：

| 部分 | 含义 |
|------|------|
| `mysql` | MySQL 命令行客户端 |
| `-u root` | 使用 `root` 用户 |
| `-p` | 提示输入密码 |

输入密码时，终端通常不会显示任何字符，这是正常现象。

如果连接远程或 Docker 里的 MySQL，可以明确写主机和端口：

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p
```

注意 `-P` 是大写，表示端口；小写 `-p` 表示密码。

## 五、确认连接成功

连接成功后会进入 MySQL 提示符：

```text
mysql>
```

执行：

```sql
SELECT VERSION();
```

可以看到当前 MySQL 版本。

再执行：

```sql
SHOW DATABASES;
```

可以看到当前已有数据库。

## 六、退出 MySQL

执行：

```sql
exit;
```

或：

```sql
quit;
```

都可以退出。

## 七、常见连接问题

### 1. `mysql` 命令找不到

说明 MySQL 客户端没有加入系统环境变量。

解决思路：

- 确认是否安装了 MySQL Client。
- Windows 检查 MySQL 的 `bin` 目录是否加入 `Path`。
- macOS / Linux 可以确认 `mysql --version` 是否能执行。

### 2. 密码错误

错误通常类似：

```text
Access denied for user 'root'@'localhost'
```

解决思路：

- 确认输入的是安装时设置的 `root` 密码。
- Docker 环境确认 `MYSQL_ROOT_PASSWORD` 设置值。
- 不要把系统登录密码当成 MySQL 密码。

### 3. 端口连接不上

解决思路：

- 确认 MySQL 服务是否启动。
- 确认端口是不是 `3306`。
- Docker 环境确认是否写了 `-p 3306:3306`。

## 八、下一步

连接成功后，就可以创建自己的数据库和表了。
