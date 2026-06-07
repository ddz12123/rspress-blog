# sync 包常用工具

`sync` 包提供并发同步工具。

最常用：

- `sync.WaitGroup`
- `sync.Mutex`
- `sync.RWMutex`
- `sync.Once`

## 一、WaitGroup

等待多个 goroutine 完成：

```go
var wg sync.WaitGroup

for i := 0; i < 3; i++ {
	wg.Add(1)
	go func(id int) {
		defer wg.Done()
		fmt.Println(id)
	}(i)
}

wg.Wait()
```

注意：

- 启动 goroutine 前调用 `Add`。
- goroutine 结束时调用 `Done`。
- 主流程调用 `Wait` 等待。

## 二、Mutex 互斥锁

多个 goroutine 同时修改同一个变量时，需要保护。

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var mu sync.Mutex
	count := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			mu.Lock()
			count++
			mu.Unlock()
		}()
	}

	wg.Wait()
	fmt.Println(count)
}
```

更安全的写法是加锁后立刻 `defer Unlock`：

```go
mu.Lock()
defer mu.Unlock()
```

但在高频循环里，要注意 `defer` 的开销和锁持有时间。

## 三、RWMutex

读多写少时，可以使用读写锁。

```go
var mu sync.RWMutex
data := map[string]string{}

func read(key string) string {
	mu.RLock()
	defer mu.RUnlock()
	return data[key]
}

func write(key, value string) {
	mu.Lock()
	defer mu.Unlock()
	data[key] = value
}
```

规则：

- 多个读锁可以同时存在。
- 写锁会阻塞其他读写。

## 四、Once

`sync.Once` 保证某段代码只执行一次。

```go
var once sync.Once

func initConfig() {
	once.Do(func() {
		fmt.Println("只初始化一次")
	})
}
```

常用于：

- 初始化配置
- 初始化数据库连接池
- 初始化全局资源

## 五、普通 map 不是并发安全的

错误示例：

```go
data := map[string]int{}

go func() {
	data["a"] = 1
}()

go func() {
	data["b"] = 2
}()
```

多个 goroutine 同时读写普通 map，可能导致程序崩溃。

解决方式：

- 使用 `sync.Mutex`
- 使用 `sync.RWMutex`
- 使用 `sync.Map`

## 六、使用建议

- 能不用共享变量，就不要共享。
- 共享变量必须明确谁读谁写。
- 加锁范围越小越好。
- 不要在持锁期间做慢操作，例如网络请求。
- 先写清楚，再考虑性能。
