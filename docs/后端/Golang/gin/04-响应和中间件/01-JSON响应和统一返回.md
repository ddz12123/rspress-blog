# JSON 响应和统一返回

Gin 返回 JSON 很简单：

```go
c.JSON(200, gin.H{
	"message": "ok",
})
```

真实项目里，建议统一响应格式。

## 一、常见响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

含义：

| 字段 | 作用 |
|------|------|
| `code` | 业务状态码 |
| `message` | 提示信息 |
| `data` | 真实数据 |

## 二、定义响应结构体

```go
type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}
```

封装成功响应：

```go
func Success(c *gin.Context, data any) {
	c.JSON(200, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}
```

封装失败响应：

```go
func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, Response{
		Code:    status,
		Message: message,
	})
}
```

## 三、在接口中使用

```go
func getUser(c *gin.Context) {
	id := c.Param("id")

	Success(c, gin.H{
		"id":   id,
		"name": "张三",
	})
}
```

参数错误：

```go
func createUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Fail(c, 400, "请求参数错误")
		return
	}

	Success(c, gin.H{"id": 1})
}
```

## 四、HTTP 状态码和业务 code

不要把所有响应都返回 HTTP 200。

建议：

| 场景 | HTTP 状态码 |
|------|-------------|
| 成功 | `200` 或 `201` |
| 参数错误 | `400` |
| 未登录 | `401` |
| 无权限 | `403` |
| 资源不存在 | `404` |
| 服务端错误 | `500` |

业务 `code` 可以用于前端细分错误，但 HTTP 状态码也要正确。

## 五、分页响应

列表接口常用分页结构：

```go
type PageResult struct {
	List  any   `json:"list"`
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Size  int   `json:"size"`
}
```

返回：

```go
Success(c, PageResult{
	List:  users,
	Total: 100,
	Page:  1,
	Size:  10,
})
```

先统一格式，后面写接口会轻松很多。

