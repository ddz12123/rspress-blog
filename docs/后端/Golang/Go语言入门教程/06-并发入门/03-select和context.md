# select 和 context

`select` 用来同时等待多个 channel。

`context` 用来传递取消信号、超时时间和请求级数据。

后端服务里，`context` 非常常见。

## 一、select 基本用法

```go
select {
case msg := <-ch1:
	fmt.Println("ch1:", msg)
case msg := <-ch2:
	fmt.Println("ch2:", msg)
default:
	fmt.Println("没有数据")
}
```

哪个 channel 先准备好，就执行哪个 case。

## 二、超时控制

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)

	select {
	case msg := <-ch:
		fmt.Println(msg)
	case <-time.After(time.Second):
		fmt.Println("超时")
	}
}
```

`time.After` 会返回一个 channel，到时间后发送信号。

## 三、context 基本用法

```go
ctx := context.Background()
```

常见创建方式：

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
```

超时：

```go
ctx, cancel := context.WithTimeout(context.Background(), time.Second)
defer cancel()
```

## 四、监听取消

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("任务取消:", ctx.Err())
			return
		default:
			fmt.Println("工作中")
			time.Sleep(200 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	worker(ctx)
}
```

`ctx.Done()` 返回一个 channel，当上下文取消或超时时会关闭。

## 五、HTTP 请求里的 context

标准库 HTTP 请求自带 context：

```go
func handler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	result, err := queryData(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, result)
}
```

如果客户端断开连接，请求的 context 会被取消。

数据库、HTTP 客户端等支持 context 的库，都应该把这个 context 传下去。

## 六、context 使用建议

- 函数第一个参数通常写 `ctx context.Context`。
- 不要把 `context.Context` 存到结构体字段里。
- 不要传 `nil` context。
- 超时或取消后，要及时返回。

示例：

```go
func FindUser(ctx context.Context, id int64) (*User, error) {
	// 查询数据库或调用外部接口
	return nil, nil
}
```

`context` 是 Go 后端开发的基础能力，后面写 HTTP 和数据库代码都会遇到。
