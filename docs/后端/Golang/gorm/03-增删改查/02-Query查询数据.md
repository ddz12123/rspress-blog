# Query 查询数据

GORM 查询数据最常用的是：

- `First`
- `Take`
- `Last`
- `Find`
- `Where`

## 一、按主键查询

```go
var user User

err := db.First(&user, 1).Error
if err != nil {
    panic("查询用户失败: " + err.Error())
}
```

大致对应：

```sql
SELECT *
FROM users
WHERE id = 1
ORDER BY id
LIMIT 1;
```

## 二、First、Take、Last 的区别

| 方法 | 含义 |
|------|------|
| `First` | 按主键升序查询第一条 |
| `Last` | 按主键降序查询最后一条 |
| `Take` | 查询一条，不主动添加排序 |

常用：

```go
db.First(&user, 1)
```

按条件查一条：

```go
db.Where("email = ?", "tom@example.com").First(&user)
```

## 三、处理记录不存在

```go
var user User

err := db.Where("email = ?", "not-exist@example.com").First(&user).Error
if errors.Is(err, gorm.ErrRecordNotFound) {
    fmt.Println("用户不存在")
    return
}
if err != nil {
    fmt.Println("查询失败:", err)
    return
}
```

需要导入：

```go
import (
    "errors"
    "gorm.io/gorm"
)
```

`ErrRecordNotFound` 是 GORM 查询单条记录时常见的错误。

## 四、查询多条数据

```go
var users []User

err := db.Find(&users).Error
if err != nil {
    panic("查询用户列表失败: " + err.Error())
}
```

带条件：

```go
err := db.Where("status = ?", "active").Find(&users).Error
```

## 五、多个条件

```go
err := db.
    Where("status = ?", "active").
    Where("name LIKE ?", "T%").
    Find(&users).Error
```

也可以写在一个条件里：

```go
err := db.
    Where("status = ? AND name LIKE ?", "active", "T%").
    Find(&users).Error
```

推荐链式写法，条件多时更清楚。

## 六、IN 查询

```go
ids := []uint{1, 2, 3}

err := db.Where("id IN ?", ids).Find(&users).Error
```

注意写法是：

```go
"id IN ?"
```

GORM 会处理切片参数。

## 七、选择字段

只查询部分字段：

```go
err := db.Select("id", "name", "email").Find(&users).Error
```

如果只用于列表页，建议不要查询不需要的字段。

## 八、排序和分页

```go
err := db.
    Where("status = ?", "active").
    Order("id DESC").
    Limit(10).
    Offset(0).
    Find(&users).Error
```

第 2 页：

```go
page := 2
pageSize := 10
offset := (page - 1) * pageSize

err := db.
    Limit(pageSize).
    Offset(offset).
    Find(&users).Error
```

分页一定要配合稳定排序：

```go
Order("id DESC")
```

## 九、统计数量

```go
var total int64

err := db.Model(&User{}).
    Where("status = ?", "active").
    Count(&total).Error
```

注意：统计时要用 `Model` 指定表。

## 十、不要拼接用户输入

不要这样写：

```go
db.Where("email = '" + email + "'").First(&user)
```

应该使用占位符：

```go
db.Where("email = ?", email).First(&user)
```

占位符能避免 SQL 注入，也能让代码更清晰。
