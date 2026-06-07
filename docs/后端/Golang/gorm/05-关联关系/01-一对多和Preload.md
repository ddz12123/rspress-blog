# 一对多和 Preload

关联关系用来描述表与表之间的关系。

这一节讲最常见的一对多：

```text
一个用户有多篇文章
一篇文章属于一个用户
```

## 一、定义模型

```go
type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:50;not null"`
    Email     string    `gorm:"size:100;not null;uniqueIndex"`
    Articles  []Article
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Article struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    uint      `gorm:"not null;index"`
    User      User
    Title     string    `gorm:"size:200;not null"`
    Content   string    `gorm:"type:text;not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

关键字段：

```go
UserID uint
User   User
```

GORM 会把 `Article.UserID` 当作外键，关联 `User.ID`。

`User.Articles` 表示一个用户有多篇文章。

## 二、迁移

```go
err := db.AutoMigrate(&User{}, &Article{})
```

建议先迁移 `User`，再迁移 `Article`。

## 三、创建关联数据

先创建用户：

```go
user := User{
    Name:  "Tom",
    Email: "tom@example.com",
}

err := db.Create(&user).Error
```

再创建文章：

```go
article := Article{
    UserID:  user.ID,
    Title:   "GORM 入门",
    Content: "文章内容",
}

err = db.Create(&article).Error
```

建议先明确写 `UserID`，这样最容易理解数据库关系。

## 四、查询文章和作者

只查询文章：

```go
var article Article
err := db.First(&article, 1).Error
```

此时 `article.User` 不会自动查出来。

使用 `Preload` 预加载作者：

```go
var article Article

err := db.
    Preload("User").
    First(&article, 1).Error
```

这样可以拿到：

```go
fmt.Println(article.Title)
fmt.Println(article.User.Name)
```

## 五、查询用户和文章列表

```go
var user User

err := db.
    Preload("Articles").
    First(&user, 1).Error
```

然后：

```go
for _, article := range user.Articles {
    fmt.Println(article.Title)
}
```

## 六、Preload 会发生什么

`Preload("Articles")` 不是把所有数据用一条 SQL 查出来。

它通常会执行多条 SQL：

```sql
SELECT * FROM users WHERE id = 1;
SELECT * FROM articles WHERE user_id = 1;
```

优点是使用简单。

缺点是关联多、数据多时要注意查询数量和性能。

## 七、带条件的 Preload

只加载已发布文章：

```go
err := db.
    Preload("Articles", "status = ?", "published").
    First(&user, 1).Error
```

按时间排序：

```go
err := db.
    Preload("Articles", func(db *gorm.DB) *gorm.DB {
        return db.Order("created_at DESC")
    }).
    First(&user, 1).Error
```

## 八、使用 Joins 查询

只查文章列表和作者名时，可以用 `Joins` 扫描到自定义结构：

```go
type ArticleItem struct {
    ID         uint
    Title      string
    AuthorName string
}

var list []ArticleItem

err := db.Table("articles").
    Select("articles.id, articles.title, users.name AS author_name").
    Joins("JOIN users ON users.id = articles.user_id").
    Scan(&list).Error
```

列表接口不一定要把完整关联对象都查出来，按实际返回字段设计即可。

## 九、关联关系建议

| 场景 | 建议 |
|------|------|
| 查详情并带作者 | `Preload("User")` |
| 查用户并带文章 | `Preload("Articles")` |
| 列表只需要作者名 | `Joins` + `Scan` |
| 数据量大 | 控制 `Preload` 的条件和数量 |
