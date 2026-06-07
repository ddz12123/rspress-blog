# 在 Gin 中使用 GORM

Gin 项目里通常在启动时创建 `*gorm.DB`，然后传给 handler、service 或 repository。

不要在每个接口里重新连接数据库。

## 一、最小示例

```go
package main

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

type User struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"size:50;not null"`
    Email string `gorm:"size:100;not null;uniqueIndex"`
}

func main() {
    dsn := "root:123456@tcp(127.0.0.1:3306)/gorm_tutorial?charset=utf8mb4&parseTime=True&loc=Local"
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic(err)
    }

    db.AutoMigrate(&User{})

    r := gin.Default()

    r.GET("/users/:id", func(c *gin.Context) {
        id, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"message": "ID 格式错误"})
            return
        }

        var user User

        err = db.First(&user, uint(id)).Error
        if err != nil {
            c.JSON(http.StatusNotFound, gin.H{"message": "用户不存在"})
            return
        }

        c.JSON(http.StatusOK, user)
    })

    r.Run(":8080")
}
```

这个例子能跑，但真实项目不建议把所有代码都写在 `main.go`。

## 二、用 repository 封装查询

```go
type UserRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
    return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(id uint) (*User, error) {
    var user User
    err := r.db.First(&user, id).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}
```

handler 使用 repository：

```go
repo := NewUserRepository(db)

r.GET("/users/:id", func(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "ID 格式错误"})
        return
    }

    user, err := repo.FindByID(uint(id))
    if errors.Is(err, gorm.ErrRecordNotFound) {
        c.JSON(http.StatusNotFound, gin.H{"message": "用户不存在"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "服务器错误"})
        return
    }

    c.JSON(http.StatusOK, user)
})
```

这样 handler 不直接关心具体 SQL 细节。

## 三、创建用户接口

请求结构：

```go
type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}
```

repository：

```go
func (r *UserRepository) Create(user *User) error {
    return r.db.Create(user).Error
}
```

handler：

```go
r.POST("/users", func(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "参数错误"})
        return
    }

    user := User{
        Name:  req.Name,
        Email: req.Email,
    }

    if err := repo.Create(&user); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "创建失败"})
        return
    }

    c.JSON(http.StatusOK, user)
})
```

## 四、列表分页接口

repository：

```go
func (r *UserRepository) List(page, pageSize int) ([]User, int64, error) {
    if page < 1 {
        page = 1
    }
    if pageSize <= 0 || pageSize > 100 {
        pageSize = 10
    }

    offset := (page - 1) * pageSize

    var total int64
    if err := r.db.Model(&User{}).Count(&total).Error; err != nil {
        return nil, 0, err
    }

    var users []User
    err := r.db.
        Order("id DESC").
        Limit(pageSize).
        Offset(offset).
        Find(&users).Error
    if err != nil {
        return nil, 0, err
    }

    return users, total, nil
}
```

## 五、不要把 GORM 模型直接当所有响应

简单接口可以直接返回模型：

```go
c.JSON(http.StatusOK, user)
```

但真实项目里，用户模型可能包含：

- 密码哈希
- 内部状态
- 删除时间
- 不想暴露的字段

更稳妥的是定义响应结构：

```go
type UserResponse struct {
    ID    uint   `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

转换：

```go
resp := UserResponse{
    ID:    user.ID,
    Name:  user.Name,
    Email: user.Email,
}
```

## 六、使用建议

| 事项 | 建议 |
|------|------|
| 数据库连接 | 程序启动时创建一次 |
| handler | 负责参数和响应 |
| repository | 负责 GORM 查询 |
| 错误处理 | 区分参数错误、未找到、服务器错误 |
| 响应数据 | 不要无脑返回完整模型 |
| 密码字段 | 永远不要返回给前端 |
