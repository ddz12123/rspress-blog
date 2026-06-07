# 接口 interface

接口描述“一个类型应该有什么行为”。

Go 的接口是隐式实现的：只要一个类型拥有接口要求的方法，就自动实现了这个接口。

## 一、最简单的接口

```go
package main

import "fmt"

type Speaker interface {
	Speak() string
}

type User struct {
	Name string
}

func (u User) Speak() string {
	return "我是 " + u.Name
}

func say(s Speaker) {
	fmt.Println(s.Speak())
}

func main() {
	user := User{Name: "张三"}
	say(user)
}
```

`User` 没有写“implements Speaker”，但它有 `Speak() string` 方法，所以它实现了 `Speaker`。

## 二、接口的价值

接口让代码依赖行为，而不是依赖具体类型。

```go
type Notifier interface {
	Notify(message string) error
}
```

不同实现：

```go
type EmailNotifier struct{}

func (EmailNotifier) Notify(message string) error {
	fmt.Println("发送邮件:", message)
	return nil
}

type SMSNotifier struct{}

func (SMSNotifier) Notify(message string) error {
	fmt.Println("发送短信:", message)
	return nil
}
```

业务函数只依赖接口：

```go
func SendWelcome(n Notifier) error {
	return n.Notify("欢迎注册")
}
```

以后从邮件切换到短信，业务函数不用改。

## 三、小接口更常见

Go 里推荐小接口。

标准库里很多接口都很小：

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}
```

只要求一个方法。

好处：

- 容易实现
- 容易测试
- 依赖更少

## 四、空接口 any

Go 1.18 起，`any` 是 `interface{}` 的别名。

```go
func printValue(v any) {
	fmt.Println(v)
}
```

`any` 可以接收任何类型。

但不要滥用 `any`。能写明确类型时，优先写明确类型。

## 五、类型断言

从接口值中取出具体类型：

```go
func printString(v any) {
	s, ok := v.(string)
	if !ok {
		fmt.Println("不是字符串")
		return
	}

	fmt.Println(s)
}
```

`ok` 用来判断断言是否成功。

## 六、type switch

```go
func printType(v any) {
	switch value := v.(type) {
	case string:
		fmt.Println("字符串:", value)
	case int:
		fmt.Println("整数:", value)
	default:
		fmt.Println("其他类型")
	}
}
```

## 七、接口设计建议

- 在使用方定义接口，而不是在实现方过早定义大接口。
- 接口方法越少越好。
- 不要为了“面向对象”强行给所有东西都抽接口。
- 测试需要替换实现时，再抽接口通常更自然。
