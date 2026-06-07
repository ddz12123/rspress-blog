# map 字典

`map` 是键值对集合，类似其他语言里的字典、对象、哈希表。

## 一、创建 map

```go
package main

import "fmt"

func main() {
	scores := map[string]int{
		"张三": 90,
		"李四": 80,
	}

	fmt.Println(scores["张三"])
}
```

类型：

```go
map[string]int
```

表示：

- key 是 `string`
- value 是 `int`

## 二、make 创建 map

```go
scores := make(map[string]int)
scores["张三"] = 90
scores["李四"] = 80
```

如果直接声明但不初始化：

```go
var scores map[string]int
```

这时 `scores` 是 `nil`，不能直接写入：

```go
// panic: assignment to entry in nil map
// scores["张三"] = 90
```

所以写入前要用 `make` 或字面量初始化。

## 三、读取值

```go
score := scores["张三"]
fmt.Println(score)
```

如果 key 不存在，会返回 value 类型的零值。

```go
fmt.Println(scores["不存在"]) // 0
```

这会带来一个问题：你分不清是“不存在”，还是“存在但值就是 0”。

## 四、判断 key 是否存在

```go
score, ok := scores["张三"]
if !ok {
	fmt.Println("没有这个人")
	return
}

fmt.Println(score)
```

这是 Go 里读取 map 的常见写法。

## 五、删除 key

```go
delete(scores, "张三")
```

删除不存在的 key 不会报错。

## 六、遍历 map

```go
for name, score := range scores {
	fmt.Println(name, score)
}
```

注意：map 遍历顺序是不固定的。

如果需要稳定顺序，要先取出 key 排序。

```go
keys := make([]string, 0, len(scores))
for name := range scores {
	keys = append(keys, name)
}
```

排序会在标准库章节继续讲。

## 七、map 的常见用途

### 1. 统计次数

```go
words := []string{"go", "java", "go"}
count := make(map[string]int)

for _, word := range words {
	count[word]++
}

fmt.Println(count)
```

### 2. 按 ID 查找

```go
users := map[int]string{
	1: "张三",
	2: "李四",
}

name, ok := users[1]
fmt.Println(name, ok)
```

## 八、并发安全提醒

普通 map 不是并发安全的。

多个 goroutine 同时读写同一个 map，可能导致程序崩溃。

并发场景要使用：

- `sync.Mutex` 加锁
- `sync.Map`
- 或者把读写集中到一个 goroutine
