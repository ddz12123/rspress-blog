# channel

channel 用于 goroutine 之间传递数据。

可以理解为：

> goroutine 之间通信的管道。

## 一、创建 channel

```go
ch := make(chan string)
```

发送数据：

```go
ch <- "hello"
```

接收数据：

```go
msg := <-ch
```

## 二、最小示例

```go
package main

import "fmt"

func main() {
	ch := make(chan string)

	go func() {
		ch <- "hello"
	}()

	msg := <-ch
	fmt.Println(msg)
}
```

执行流程：

1. 创建 channel。
2. goroutine 发送 `"hello"`。
3. main goroutine 接收消息。
4. 打印结果。

## 三、无缓冲 channel

```go
ch := make(chan string)
```

无缓冲 channel 发送和接收必须同时准备好。

如果没有接收者，发送会阻塞。

如果没有发送者，接收会阻塞。

## 四、有缓冲 channel

```go
ch := make(chan string, 2)

ch <- "a"
ch <- "b"

fmt.Println(<-ch)
fmt.Println(<-ch)
```

容量是 2，所以可以先放两个值。

缓冲满了后，继续发送会阻塞。

## 五、关闭 channel

```go
close(ch)
```

关闭表示不会再发送新数据。

接收方可以这样判断：

```go
value, ok := <-ch
if !ok {
	fmt.Println("channel 已关闭")
}
```

## 六、range 读取 channel

```go
ch := make(chan int)

go func() {
	for i := 1; i <= 3; i++ {
		ch <- i
	}
	close(ch)
}()

for value := range ch {
	fmt.Println(value)
}
```

`range ch` 会一直读，直到 channel 被关闭。

## 七、谁负责关闭 channel

通常由发送方关闭 channel。

不要让接收方关闭，因为接收方不知道发送方是否还会继续发送。

常见原则：

```text
发送方负责 close
接收方只负责读取
```

## 八、channel 使用建议

- 用 channel 传递数据，不要共享变量后到处加锁。
- 需要等待一组任务时，`sync.WaitGroup` 更直接。
- 需要取消任务时，优先使用 `context`。
- 不要为了并发而强行使用 channel。

Go 的经典理念是：

```text
不要通过共享内存来通信，而要通过通信来共享内存。
```

实际开发中，channel 和锁都会用，关键是选择更清晰的方案。
