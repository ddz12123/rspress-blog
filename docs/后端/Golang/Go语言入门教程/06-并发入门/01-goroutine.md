# goroutine

goroutine 是 Go 的轻量级并发执行单元。

可以简单理解为：

> goroutine 是由 Go 运行时管理的轻量任务。

## 一、启动 goroutine

在函数调用前加 `go`：

```go
package main

import (
	"fmt"
	"time"
)

func sayHello() {
	fmt.Println("hello")
}

func main() {
	go sayHello()

	time.Sleep(time.Second)
}
```

`go sayHello()` 会让 `sayHello` 在新的 goroutine 中执行。

这里用了 `time.Sleep`，是为了避免 `main` 太快退出。

## 二、main 退出后 goroutine 会结束

```go
func main() {
	go fmt.Println("hello")
}
```

这段代码可能什么都不输出。

因为 `main` 函数结束后，程序直接退出，其他 goroutine 也会停止。

真实项目里，不应该依赖 `Sleep` 等待 goroutine，通常用：

- `sync.WaitGroup`
- channel
- context

## 三、WaitGroup 等待任务完成

```go
package main

import (
	"fmt"
	"sync"
)

func worker(id int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Println("worker", id)
}

func main() {
	var wg sync.WaitGroup

	for i := 1; i <= 3; i++ {
		wg.Add(1)
		go worker(i, &wg)
	}

	wg.Wait()
}
```

说明：

| 方法 | 作用 |
|------|------|
| `wg.Add(1)` | 增加一个要等待的任务 |
| `wg.Done()` | 当前任务完成 |
| `wg.Wait()` | 等待所有任务完成 |

`defer wg.Done()` 是常见写法，保证函数退出时一定标记完成。

## 四、循环变量注意事项

现代 Go 已经修复了常见的循环变量捕获问题，但为了代码更清楚，仍建议显式把变量传给函数。

```go
for i := 1; i <= 3; i++ {
	wg.Add(1)
	go func(id int) {
		defer wg.Done()
		fmt.Println(id)
	}(i)
}
```

这样读者一眼就知道每个 goroutine 使用的是自己的 `id`。

## 五、goroutine 适合做什么

适合：

- 并发处理多个请求
- 同时执行多个 IO 操作
- 后台任务
- 定时任务
- 并发调用多个外部服务

不适合：

- 盲目给所有函数都加 `go`
- 不控制数量地创建大量 goroutine
- 多个 goroutine 随意读写共享变量

goroutine 很轻量，但不是没有成本。并发代码一定要考虑退出、错误和共享数据。
