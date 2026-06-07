# JSON 绑定

前后端分离接口最常见的请求体是 JSON。

Gin 可以把 JSON 自动绑定到结构体。

## 一、定义请求结构体

```go
type CreateUserRequest struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
```

字段说明：

| 内容 | 作用 |
|------|------|
| `Name` | Go 结构体字段，首字母大写才能被绑定 |
| `json:"name"` | JSON 字段名 |

## 二、绑定 JSON 请求体

```go
func createUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"message": "请求参数错误",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(201, gin.H{
		"id":   1,
		"name": req.Name,
		"age":  req.Age,
	})
}
```

注册路由：

```go
router.POST("/users", createUser)
```

请求：

```json
{
  "name": "张三",
  "age": 18
}
```

## 三、为什么传 &req

```go
c.ShouldBindJSON(&req)
```

这里必须传指针。

因为 Gin 要把解析出来的数据写入 `req`，如果只传 `req`，函数拿到的是副本，无法修改原来的结构体。

这也是 Go 结构体和指针在 Web 开发里非常常见的场景。

## 四、ShouldBindJSON 和 BindJSON

Gin 有两类绑定方法：

| 方法 | 行为 |
|------|------|
| `ShouldBindJSON` | 返回错误，由你自己决定怎么响应 |
| `BindJSON` | 出错时 Gin 会自动写入 400 响应 |

业务项目里更推荐 `ShouldBindJSON`。

原因是你可以统一返回自己的错误格式：

```go
if err := c.ShouldBindJSON(&req); err != nil {
	c.JSON(400, gin.H{"message": "参数错误"})
	return
}
```

## 五、不要直接使用数据库模型接收请求

不推荐：

```go
type UserModel struct {
	ID           int64
	Name         string
	PasswordHash string
}
```

然后直接：

```go
var user UserModel
c.ShouldBindJSON(&user)
```

推荐单独定义请求结构体：

```go
type CreateUserRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}
```

请求结构体、数据库模型、响应结构体要分开，避免敏感字段误传或误返回。

