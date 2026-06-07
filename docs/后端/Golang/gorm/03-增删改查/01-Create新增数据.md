# Create 新增数据

`Create` 用来新增数据。

这一节使用 `User` 模型：

```go
type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:50;not null"`
    Email     string    `gorm:"size:100;not null;uniqueIndex"`
    Status    string    `gorm:"size:20;not null;default:active"`
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

## 一、新增一条数据

```go
user := User{
    Name:  "Tom",
    Email: "tom@example.com",
}

result := db.Create(&user)
if result.Error != nil {
    panic("创建用户失败: " + result.Error.Error())
}

fmt.Println("新用户 ID:", user.ID)
```

执行成功后，GORM 会把自增主键写回 `user.ID`。

## 二、为什么要传指针

推荐：

```go
db.Create(&user)
```

不要写：

```go
db.Create(user)
```

传指针后，GORM 才能把数据库生成的主键、时间等字段回填到结构体里。

## 三、查看影响行数

```go
result := db.Create(&user)

fmt.Println(result.RowsAffected)
fmt.Println(result.Error)
```

| 字段 | 含义 |
|------|------|
| `RowsAffected` | 影响了多少行 |
| `Error` | 是否有错误 |

日常代码里主要检查 `Error`。

## 四、批量新增

```go
users := []User{
    {Name: "Jack", Email: "jack@example.com"},
    {Name: "Lucy", Email: "lucy@example.com"},
}

err := db.Create(&users).Error
if err != nil {
    panic("批量创建失败: " + err.Error())
}
```

批量创建成功后，每个元素的 `ID` 也会被回填。

## 五、分批插入

数据量较多时，可以分批插入：

```go
err := db.CreateInBatches(&users, 100).Error
if err != nil {
    panic("批量创建失败: " + err.Error())
}
```

`100` 表示每批插入 100 条。

## 六、只创建指定字段

只写入 `Name` 和 `Email`：

```go
err := db.Select("Name", "Email").Create(&user).Error
```

忽略某些字段：

```go
err := db.Omit("Status").Create(&user).Error
```

本地练习时不需要频繁使用 `Select` / `Omit`，但要知道它们可以控制写入字段。

## 七、默认值字段

模型里有默认值：

```go
Status string `gorm:"size:20;not null;default:active"`
```

创建时不传 `Status`：

```go
user := User{
    Name:  "Rose",
    Email: "rose@example.com",
}

db.Create(&user)
```

数据库会使用默认值 `active`。

注意：Go 的零值和数据库默认值之间有细节差异。当前阶段建议关键字段在代码里明确赋值，减少误解。

## 八、唯一索引冲突

如果邮箱已经存在：

```go
user := User{
    Name:  "Tom2",
    Email: "tom@example.com",
}

err := db.Create(&user).Error
if err != nil {
    fmt.Println("创建失败:", err)
}
```

会返回数据库唯一索引冲突错误。

真实项目里通常要：

1. 先检查邮箱是否存在。
2. 创建时保留唯一索引兜底。
3. 捕获错误并返回友好提示。
