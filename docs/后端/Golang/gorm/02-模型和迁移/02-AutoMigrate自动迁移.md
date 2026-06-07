# AutoMigrate 自动迁移

`AutoMigrate` 用来根据 Go 模型创建或更新数据库表结构。

## 一、最小迁移示例

```go
err := db.AutoMigrate(&User{})
if err != nil {
    panic("迁移失败: " + err.Error())
}
```

如果 `users` 表不存在，GORM 会创建它。

如果表已经存在，GORM 会尽量补充缺少的字段和索引。

## 二、完整示例

```go
package main

import (
    "time"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:50;not null"`
    Email     string    `gorm:"size:100;not null;uniqueIndex"`
    Status    string    `gorm:"size:20;not null;default:active"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

func main() {
    dsn := "root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local"

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("连接数据库失败: " + err.Error())
    }

    err = db.AutoMigrate(&User{})
    if err != nil {
        panic("迁移失败: " + err.Error())
    }
}
```

运行：

```bash
go run main.go
```

然后在 MySQL 里查看：

```sql
SHOW TABLES;
DESC users;
```

## 三、迁移多张表

```go
err := db.AutoMigrate(
    &User{},
    &Article{},
    &Comment{},
)
if err != nil {
    panic("迁移失败: " + err.Error())
}
```

有关联关系时，建议先写被引用的模型，再写引用它的模型：

```go
err := db.AutoMigrate(&User{}, &Article{}, &Comment{})
```

## 四、AutoMigrate 会做什么

`AutoMigrate` 主要适合做这些事：

- 创建不存在的表
- 创建缺少的字段
- 创建缺少的索引
- 创建缺少的约束
- 在部分情况下修改字段类型

它不会主动做高风险操作。

## 五、AutoMigrate 不适合做什么

不要指望 `AutoMigrate` 完成所有生产数据库变更。

例如：

- 删除字段
- 重命名字段
- 拆表
- 合并表
- 复杂数据迁移
- 需要人工确认的索引调整

这些更适合用专门的迁移工具或手写 SQL。

本地练习时可以直接用 `AutoMigrate`，真实项目上线后要谨慎。

## 六、查看 GORM 生成的 SQL

开发阶段可以开启日志：

```go
db = db.Debug()
db.AutoMigrate(&User{})
```

或者初始化时配置日志级别。先用 `Debug()` 最简单。

执行后终端会打印 SQL，方便确认 GORM 做了什么。

## 七、字段变更示例

原模型：

```go
type User struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"size:50;not null"`
    Email string `gorm:"size:100;not null;uniqueIndex"`
}
```

新增字段：

```go
type User struct {
    ID     uint   `gorm:"primaryKey"`
    Name   string `gorm:"size:50;not null"`
    Email  string `gorm:"size:100;not null;uniqueIndex"`
    Avatar string `gorm:"size:500"`
}
```

再次执行：

```go
db.AutoMigrate(&User{})
```

GORM 会尝试新增 `avatar` 字段。

## 八、迁移建议

| 场景 | 建议 |
|------|------|
| 学习和本地开发 | 可以使用 `AutoMigrate` |
| 小型内部项目 | 可以谨慎使用，先备份 |
| 生产核心库 | 建议使用明确的 SQL 迁移 |
| 删除字段或改字段含义 | 不要依赖 `AutoMigrate` 自动处理 |

结论：`AutoMigrate` 适合快速创建和补字段，不适合替代严肃的数据库迁移流程。
