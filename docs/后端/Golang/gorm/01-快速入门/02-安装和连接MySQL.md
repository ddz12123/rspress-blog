# 安装和连接 MySQL

这一节创建一个最小 GORM 项目，并连接 MySQL。

## 一、创建项目

```bash
mkdir gorm-demo
cd gorm-demo
go mod init gorm-demo
```

## 二、安装 GORM 和 MySQL 驱动

```bash
go get gorm.io/gorm
go get gorm.io/driver/mysql
```

GORM 核心包：

```text
gorm.io/gorm
```

MySQL 驱动：

```text
gorm.io/driver/mysql
```

## 三、准备数据库

先在 MySQL 里创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS gorm_tutorial
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

如果当前 MySQL 不支持 `utf8mb4_0900_ai_ci`，可以改成：

```sql
DEFAULT COLLATE utf8mb4_unicode_ci
```

## 四、连接 MySQL

创建 `main.go`：

```go
package main

import (
    "fmt"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    dsn := "root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local"

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("连接数据库失败: " + err.Error())
    }

    fmt.Println(db)
    fmt.Println("连接成功")
}
```

运行：

```bash
go run main.go
```

看到：

```text
连接成功
```

说明 GORM 已经连接到 MySQL。

## 五、DSN 是什么

DSN 是数据库连接字符串。

```text
root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local
```

拆开看：

| 部分 | 含义 |
|------|------|
| `root` | 用户名 |
| `123456` | 密码 |
| `127.0.0.1:3306` | MySQL 地址和端口 |
| `gorm_tutorial` | 数据库名 |
| `charset=utf8mb4` | 使用完整 Unicode 字符集 |
| `parseTime=True` | 把 MySQL 时间字段解析成 Go 的 `time.Time` |
| `loc=Local` | 使用本地时区 |

`parseTime=True` 很重要。没有它，时间字段处理容易出问题。

## 六、不要把密码写死在代码里

示例为了简单直接写 DSN，真实项目不要这样写：

```go
dsn := "root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local"
```

应该从配置或环境变量读取：

```go
dsn := os.Getenv("MYSQL_DSN")
```

环境变量示例：

```text
MYSQL_DSN=root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local
```

## 七、连接失败排查

### 1. 用户名或密码错误

常见报错：

```text
Access denied for user
```

检查：

- 用户名是否正确
- 密码是否正确
- 用户是否允许从当前主机连接

### 2. 数据库不存在

常见报错：

```text
Unknown database
```

先创建数据库：

```sql
CREATE DATABASE gorm_tutorial DEFAULT CHARACTER SET utf8mb4;
```

### 3. MySQL 没启动

常见报错：

```text
connect: connection refused
```

检查：

- MySQL 服务是否启动
- 端口是不是 `3306`
- Docker 容器是否映射端口

## 八、下一步

连接成功后，就可以定义 Go 结构体，并让 GORM 创建数据表。
