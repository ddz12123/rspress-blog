# 认识 GORM

GORM 是 Go 语言里的 ORM 库。

ORM 的全称是 Object Relational Mapping，可以理解为：

```text
Go 结构体  <->  数据库表
结构体字段 <->  表字段
结构体对象 <->  表里的一行数据
```

## 一、不使用 GORM 时怎么写

使用标准库 `database/sql` 查询用户，大概会写成这样：

```go
row := db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", 1)

var user User
err := row.Scan(&user.ID, &user.Name, &user.Email)
if err != nil {
    return err
}
```

这很清晰，但每个查询都要写 SQL 和 `Scan`，字段多了以后会比较繁琐。

## 二、使用 GORM 怎么写

定义模型：

```go
type User struct {
    ID    uint
    Name  string
    Email string
}
```

查询：

```go
var user User
err := db.First(&user, 1).Error
if err != nil {
    return err
}
```

GORM 会根据 `User` 结构体推导出表名和字段名。

默认约定：

| Go | 数据库 |
|----|--------|
| `User` | `users` |
| `ID` | `id` |
| `Name` | `name` |
| `CreatedAt` | `created_at` |

## 三、GORM 适合做什么

GORM 适合：

- 常规业务表增删改查
- 后台管理系统
- Web API 的数据访问层
- 简单到中等复杂度的关联查询
- 自动维护创建时间和更新时间
- 事务封装

GORM 不代表所有 SQL 都不用写。复杂报表、大量聚合、特殊性能优化场景，直接写 SQL 仍然很常见。

## 四、GORM 的核心对象

最常用的是 `*gorm.DB`：

```go
var db *gorm.DB
```

它表示数据库操作入口。

常见方法：

| 方法 | 作用 |
|------|------|
| `Create` | 新增 |
| `First` | 查询第一条 |
| `Find` | 查询多条 |
| `Where` | 添加查询条件 |
| `Model` | 指定要更新的模型 |
| `Updates` | 更新多个字段 |
| `Delete` | 删除 |
| `AutoMigrate` | 自动迁移表结构 |
| `Transaction` | 执行事务 |

## 五、先看一个完整例子

```go
package main

import (
    "fmt"

    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type Product struct {
    gorm.Model
    Code  string
    Price uint
}

func main() {
    db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
    if err != nil {
        panic("连接数据库失败")
    }

    err = db.AutoMigrate(&Product{})
    if err != nil {
        panic("迁移失败")
    }

    db.Create(&Product{Code: "D42", Price: 100})

    var product Product
    db.First(&product, "code = ?", "D42")

    fmt.Println(product.ID, product.Code, product.Price)
}
```

这是官方快速入门里的典型写法。后续章节会改成连接 MySQL，并逐行拆开讲。

## 六、GORM 和 SQL 的关系

这段 GORM：

```go
db.Where("email = ?", "tom@example.com").First(&user)
```

大致对应 SQL：

```sql
SELECT *
FROM users
WHERE email = 'tom@example.com'
ORDER BY users.id
LIMIT 1;
```

学习 GORM 时建议经常打开日志，看它生成的 SQL。这样不会把 ORM 当成黑盒。
