# if、for、switch 流程控制

流程控制决定代码执行顺序。

Go 常用三种：

- `if`
- `for`
- `switch`

## 一、if 判断

```go
package main

import "fmt"

func main() {
	age := 18

	if age >= 18 {
		fmt.Println("成年人")
	} else {
		fmt.Println("未成年人")
	}
}
```

Go 的 `if` 条件不需要小括号。

## 二、if 里声明变量

```go
package main

import "fmt"

func main() {
	if score := 85; score >= 60 {
		fmt.Println("及格")
	} else {
		fmt.Println("不及格")
	}
}
```

`score` 只在这个 `if/else` 内部可见。

## 三、for 循环

Go 只有 `for` 这一种循环关键字。

```go
for i := 0; i < 5; i++ {
	fmt.Println(i)
}
```

输出：

```text
0
1
2
3
4
```

## 四、类似 while 的写法

```go
count := 0

for count < 3 {
	fmt.Println(count)
	count++
}
```

Go 没有 `while`，用 `for 条件` 表达即可。

## 五、无限循环

```go
for {
	fmt.Println("一直执行")
	break
}
```

`break` 用于跳出循环。

`continue` 用于跳过本轮循环：

```go
for i := 0; i < 5; i++ {
	if i == 2 {
		continue
	}
	fmt.Println(i)
}
```

## 六、range 遍历

遍历切片：

```go
names := []string{"张三", "李四", "王五"}

for index, name := range names {
	fmt.Println(index, name)
}
```

如果不需要下标，用 `_` 忽略：

```go
for _, name := range names {
	fmt.Println(name)
}
```

遍历 map：

```go
scores := map[string]int{
	"张三": 90,
	"李四": 80,
}

for name, score := range scores {
	fmt.Println(name, score)
}
```

map 遍历顺序是不固定的，不要依赖它的顺序。

## 七、switch

```go
day := "mon"

switch day {
case "mon":
	fmt.Println("星期一")
case "tue":
	fmt.Println("星期二")
default:
	fmt.Println("其他")
}
```

Go 的 `switch` 默认不会继续执行下一个 `case`，不需要手写 `break`。

## 八、不带表达式的 switch

```go
score := 85

switch {
case score >= 90:
	fmt.Println("优秀")
case score >= 60:
	fmt.Println("及格")
default:
	fmt.Println("不及格")
}
```

这种写法适合多个条件判断，比连续 `if/else` 更清晰。
