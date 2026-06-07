# 安装和连接 MongoDB

本教程推荐用 Docker 在本地启动 MongoDB。

这样不需要在系统里安装一堆服务，也方便以后删除和重建环境。

## 一、启动 MongoDB

```bash
docker run --name mongodb-tutorial -d -p 27017:27017 mongodb/mongodb-community-server:latest
```

说明：

| 参数 | 含义 |
|------|------|
| `--name mongodb-tutorial` | 容器名 |
| `-d` | 后台运行 |
| `-p 27017:27017` | 把本机 27017 端口映射到容器 |
| `mongodb/mongodb-community-server:latest` | MongoDB 官方社区版镜像 |

查看容器：

```bash
docker ps
```

停止容器：

```bash
docker stop mongodb-tutorial
```

重新启动：

```bash
docker start mongodb-tutorial
```

## 二、安装 mongosh

`mongosh` 是 MongoDB 官方 Shell 工具。

如果你本机已经安装了 MongoDB Shell，可以直接执行：

```bash
mongosh
```

连接本地 MongoDB：

```bash
mongosh "mongodb://127.0.0.1:27017"
```

进入后可以看到类似提示：

```text
test>
```

这表示当前在 `test` 数据库上下文里。

## 三、最常用的连接命令

查看数据库：

```javascript
show dbs
```

切换数据库：

```javascript
use mongodb_tutorial
```

查看当前数据库：

```javascript
db
```

查看集合：

```javascript
show collections
```

退出：

```javascript
exit
```

## 四、插入第一条数据

```javascript
use mongodb_tutorial

db.users.insertOne({
  username: "zhangsan",
  email: "zhangsan@example.com",
  age: 18,
  createdAt: new Date()
})
```

查询：

```javascript
db.users.find()
```

你会看到 MongoDB 自动生成了 `_id` 字段。

```javascript
{
  _id: ObjectId("..."),
  username: "zhangsan",
  email: "zhangsan@example.com",
  age: 18,
  createdAt: ISODate("...")
}
```

## 五、关于认证

上面的启动方式适合本地学习，因为没有开启用户名密码。

生产环境必须开启认证，并且不能把数据库端口直接暴露到公网。

后面的安全章节会单独讲用户、权限和连接字符串。

