# 方法 method

方法是“绑定到某个类型上的函数”。

普通函数：

```go
func add(a, b int) int {
	return a + b
}
```

方法：

```go
func (u User) SayHello() {
}
```

`(u User)` 叫接收者。

## 一、给结构体定义方法

```go
package main

import "fmt"

type User struct {
	Name string
}

func (u User) SayHello() {
	fmt.Println("你好，我是" + u.Name)
}

func main() {
	user := User{Name: "张三"}
	user.SayHello()
}
```

调用方法：

```go
user.SayHello()
```

## 二、值接收者

```go
func (u User) Rename(name string) {
	u.Name = name
}
```

这种写法接收的是副本，修改不会影响原对象。

```go
user := User{Name: "张三"}
user.Rename("李四")

fmt.Println(user.Name) // 仍然是 张三
```

## 三、指针接收者

如果方法要修改结构体字段，用指针接收者：

```go
func (u *User) Rename(name string) {
	u.Name = name
}
```

完整示例：

```go
package main

import "fmt"

type User struct {
	Name string
}

func (u *User) Rename(name string) {
	u.Name = name
}

func main() {
	user := User{Name: "张三"}
	user.Rename("李四")

	fmt.Println(user.Name)
}
```

## 四、什么时候用指针接收者

建议：

| 场景 | 接收者 |
|------|-------|
| 方法需要修改字段 | 指针接收者 |
| 结构体比较大 | 指针接收者 |
| 希望避免复制 | 指针接收者 |
| 只是读取小结构体 | 值接收者也可以 |

实际业务里，结构体方法多数使用指针接收者。

## 五、给自定义类型定义方法

方法不只能给结构体定义。

```go
type Score int

func (s Score) Passed() bool {
	return s >= 60
}

func main() {
	score := Score(80)
	fmt.Println(score.Passed())
}
```

注意：只能给当前包里定义的类型添加方法。

不能给标准库类型直接加方法：

```go
// 错误：不能给 string 直接定义方法
// func (s string) Hello() {}
```

可以先定义自己的类型：

```go
type MyString string
```

## 六、方法和函数怎么选

适合方法：

- 行为明显属于某个类型。
- 需要操作结构体内部字段。
- 希望调用方式更符合对象语义。

适合普通函数：

- 逻辑不属于某个具体类型。
- 只是工具函数。

示例：

```go
user.Rename("李四") // 方法，属于 User 行为
strings.TrimSpace(s) // 函数，通用字符串工具
```
