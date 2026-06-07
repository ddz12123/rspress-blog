# defer、panic、recover

这三个关键字都和函数退出、异常情况有关。

初学阶段先记住：

- `defer` 常用。
- `panic` 少用。
- `recover` 更少用，主要在边界层兜底。

## 一、defer

`defer` 会把函数调用延迟到当前函数返回前执行。

```go
package main

import "fmt"

func main() {
	defer fmt.Println("最后执行")

	fmt.Println("先执行")
}
```

输出：

```text
先执行
最后执行
```

## 二、defer 常用于释放资源

```go
file, err := os.Open("data.txt")
if err != nil {
	return err
}
defer file.Close()
```

只要文件打开成功，就立刻写 `defer file.Close()`，避免后面忘记关闭。

## 三、多个 defer 的执行顺序

多个 `defer` 后进先出。

```go
defer fmt.Println("1")
defer fmt.Println("2")
defer fmt.Println("3")
```

输出：

```text
3
2
1
```

## 四、panic

`panic` 表示程序遇到无法继续执行的严重错误。

```go
func main() {
	panic("程序崩溃")
}
```

普通业务错误不要用 `panic`。

例如用户不存在，应该返回 `error`，不是 `panic`。

## 五、recover

`recover` 可以捕获 `panic`，必须配合 `defer` 使用。

```go
package main

import "fmt"

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("捕获 panic:", r)
		}
	}()

	panic("出错了")
}
```

## 六、Web 服务里的 recover

HTTP 服务可以在中间件里统一 recover，避免某个请求 panic 导致整个服务退出。

```go
func recoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
```

业务函数里仍然应该优先返回 `error`。

## 七、使用建议

| 场景 | 推荐 |
|------|------|
| 关闭文件、释放连接 | `defer` |
| 普通业务失败 | 返回 `error` |
| 程序无法继续运行 | 可以 `panic` |
| Web 服务兜底 | 中间件里 `recover` |

`panic/recover` 不是 Go 的日常错误处理方式。日常业务代码主要使用 `error`。
