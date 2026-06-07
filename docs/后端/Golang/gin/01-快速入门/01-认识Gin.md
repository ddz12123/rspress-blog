# 认识 Gin

Gin 是一个 Go HTTP Web 框架。

直接使用标准库 `net/http` 也可以写接口，但 Gin 帮你封装了很多常用能力：

- 路由注册更方便。
- 获取路径参数、查询参数更简单。
- JSON 请求绑定更直接。
- 中间件机制更清晰。
- 返回 JSON 响应更顺手。

## 一、Gin 适合做什么

常见场景：

- 后台管理系统接口。
- 小程序或 App 后端接口。
- 前后端分离的 REST API。
- 微服务里的 HTTP 服务。

不建议一上来就把 Gin 当成“全家桶框架”。Gin 主要解决 HTTP 层问题，数据库、配置、日志、鉴权等能力需要你自己选择合适的库组合。

## 二、Gin 和 net/http 的关系

Gin 底层仍然运行在 Go 标准库 `net/http` 之上。

可以简单理解为：

```text
net/http 是地基
Gin 是更好用的一层封装
```

Gin 的核心对象是：

| 对象 | 作用 |
|------|------|
| `gin.Engine` | 路由引擎，负责注册路由和运行服务 |
| `gin.Context` | 当前请求上下文，用来读取参数、返回响应、控制中间件流程 |
| `gin.HandlerFunc` | 处理函数，类型是 `func(c *gin.Context)` |

## 三、第一个 Gin 处理函数

Gin 的处理函数长这样：

```go
func(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "hello gin",
	})
}
```

这里的 `c` 很重要，它代表当前这一次 HTTP 请求。

你会经常通过它做这些事：

- `c.Param("id")`：读取路径参数。
- `c.Query("keyword")`：读取查询参数。
- `c.ShouldBindJSON(&req)`：读取 JSON 请求体。
- `c.JSON(200, data)`：返回 JSON。
- `c.Abort()`：中断后续处理。

## 四、学习 Gin 的重点

刚开始不要急着搭复杂架构。

先把下面这些能力学清楚：

1. 路由怎么写。
2. 参数怎么取。
3. JSON 怎么绑定到结构体。
4. 错误怎么返回。
5. 中间件怎么控制请求流程。
6. 接口怎么测试。

这些掌握后，再看工程化目录会容易很多。

