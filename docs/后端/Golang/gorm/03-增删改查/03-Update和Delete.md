# Update 和 Delete

`Update` / `Updates` 用来修改数据，`Delete` 用来删除数据。

修改和删除都要特别注意条件。

## 一、更新单个字段

```go
var user User

err := db.First(&user, 1).Error
if err != nil {
    return err
}

err = db.Model(&user).Update("Name", "Tom New").Error
if err != nil {
    return err
}
```

这里的 `Model(&user)` 会根据 `user.ID` 定位数据。

## 二、按条件更新

```go
err := db.Model(&User{}).
    Where("id = ?", 1).
    Update("status", "disabled").Error
```

推荐写清楚条件：

```go
Where("id = ?", 1)
```

不要在没有条件时更新整张表。

## 三、更新多个字段

使用结构体：

```go
err := db.Model(&user).Updates(User{
    Name:   "Tom New",
    Status: "active",
}).Error
```

使用 `map`：

```go
err := db.Model(&user).Updates(map[string]any{
    "name":   "Tom New",
    "status": "active",
}).Error
```

## 四、结构体更新会忽略零值

这是非常容易踩的坑。

```go
err := db.Model(&user).Updates(User{
    Name:   "",
    Status: "disabled",
}).Error
```

使用结构体更新时，GORM 默认不会更新零值字段，例如：

- `""`
- `0`
- `false`

确实要更新零值时，使用 `map`：

```go
err := db.Model(&user).Updates(map[string]any{
    "name":   "",
    "status": "disabled",
}).Error
```

## 五、基于原值更新

文章浏览量加 1：

```go
err := db.Model(&Article{}).
    Where("id = ?", 1).
    Update("view_count", gorm.Expr("view_count + ?", 1)).Error
```

需要导入：

```go
import "gorm.io/gorm"
```

这种写法适合：

- 浏览量加 1
- 库存减 1
- 积分累加

## 六、删除数据

按主键删除：

```go
err := db.Delete(&User{}, 1).Error
```

按条件删除：

```go
err := db.Where("status = ?", "disabled").Delete(&User{}).Error
```

删除前建议先查询确认：

```go
var users []User
db.Where("status = ?", "disabled").Find(&users)
```

## 七、软删除和硬删除

如果模型包含：

```go
DeletedAt gorm.DeletedAt `gorm:"index"`
```

执行：

```go
db.Delete(&user)
```

GORM 会更新 `deleted_at`，不会真正删除行。

如果要查询包含软删除的数据：

```go
db.Unscoped().Find(&users)
```

如果要真正删除：

```go
db.Unscoped().Delete(&user)
```

当前阶段不要轻易使用 `Unscoped().Delete`，它会真正删除数据。

## 八、检查影响行数

```go
result := db.Model(&User{}).
    Where("id = ?", 1).
    Update("status", "disabled")

if result.Error != nil {
    return result.Error
}

if result.RowsAffected == 0 {
    fmt.Println("没有数据被修改")
}
```

`RowsAffected` 可以判断是否真的影响了数据。

## 九、安全习惯

| 操作 | 建议 |
|------|------|
| 更新 | 优先按主键或唯一字段更新 |
| 删除 | 删除前先查询确认 |
| 批量修改 | 明确写 `Where` 条件 |
| 更新零值 | 使用 `map` 或 `Select` |
| 真实删除 | 谨慎使用 `Unscoped` |
