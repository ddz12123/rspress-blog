# gin.Context 上下文

`gin.Context` 是 Gin 里最常见的对象。

每次请求进来，Gin 都会创建一个对应的上下文对象，然后传给你的处理函数。

```go
router.GET("/users/:id", func(c *gin.Context) {
	id := c.Param("id")
	c.JSON(200, gin.H{"id": id})
})
```

这里的 `c` 就是 `*gin.Context`。

## 一、Context 能做什么

常用能力：

| 方法 | 作用 |
|------|------|
| `c.Param("id")` | 获取路径参数 |
| `c.Query("name")` | 获取查询参数 |
| `c.DefaultQuery("page", "1")` | 查询参数没有时给默认值 |
| `c.ShouldBindJSON(&req)` | 绑定 JSON 请求体 |
| `c.JSON(status, data)` | 返回 JSON |
| `c.String(status, text)` | 返回字符串 |
| `c.Abort()` | 中断后续中间件 |
| `c.Next()` | 执行后续中间件 |
| `c.Set(key, value)` | 往上下文存值 |
| `c.Get(key)` | 从上下文取值 |

## 二、Context 只属于当前请求

不要把 `*gin.Context` 存到全局变量或后台 goroutine 里长期使用。

错误示例：

```go
var saved *gin.Context

router.GET("/demo", func(c *gin.Context) {
	saved = c
})
```

这样做会让请求之间互相影响，也可能产生数据竞争。

## 三、中间件里传递数据

中间件可以把解析出来的数据放进 Context。

```go
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 实际项目这里会解析 token
		userID := int64(1001)

		c.Set("userID", userID)
		c.Next()
	}
}
```

接口里读取：

```go
router.GET("/profile", AuthMiddleware(), func(c *gin.Context) {
	value, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"message": "未登录"})
		return
	}

	c.JSON(200, gin.H{
		"userID": value,
	})
})
```

## 四、Context 和标准库 Context

Gin 的 `gin.Context` 和 Go 标准库的 `context.Context` 不是同一个东西。

常见区别：

| 类型 | 用途 |
|------|------|
| `*gin.Context` | Gin 请求上下文，用于 HTTP 参数、响应、中间件 |
| `context.Context` | 标准库上下文，用于取消、超时、跨函数传递请求生命周期 |

如果业务层需要标准库 `context.Context`，可以从请求里取：

```go
ctx := c.Request.Context()
```

推荐做法：

```go
func getUser(c *gin.Context) {
	ctx := c.Request.Context()

	// 把标准库 context.Context 传给 service/repository
	_ = ctx
}
```

HTTP 层用 `gin.Context`，业务层尽量使用标准库 `context.Context`，这样代码更容易测试和复用。

