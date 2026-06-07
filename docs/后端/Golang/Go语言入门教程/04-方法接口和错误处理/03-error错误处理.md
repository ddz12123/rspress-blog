# error 错误处理

Go 推荐把错误作为返回值处理。

最常见写法：

```go
value, err := doSomething()
if err != nil {
	return err
}
```

## 一、返回错误

```go
package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("除数不能为 0")
	}
	return a / b, nil
}

func main() {
	result, err := divide(10, 0)
	if err != nil {
		fmt.Println("错误:", err)
		return
	}

	fmt.Println(result)
}
```

`nil` 表示没有错误。

## 二、fmt.Errorf

需要带上下文时，用 `fmt.Errorf`：

```go
return fmt.Errorf("查询用户失败: %w", err)
```

`%w` 表示包装原始错误，后续可以用 `errors.Is` 或 `errors.As` 判断。

## 三、错误包装

```go
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("not found")

func findUser(id int64) error {
	return fmt.Errorf("user id %d: %w", id, ErrNotFound)
}

func main() {
	err := findUser(1)
	if errors.Is(err, ErrNotFound) {
		fmt.Println("用户不存在")
	}
}
```

不要只用字符串比较错误：

```go
// 不推荐
// if err.Error() == "not found" {}
```

## 四、自定义错误类型

```go
type BizError struct {
	Code string
	Msg  string
}

func (e BizError) Error() string {
	return e.Msg
}
```

使用：

```go
func createUser(name string) error {
	if name == "" {
		return BizError{Code: "INVALID_NAME", Msg: "用户名不能为空"}
	}
	return nil
}
```

判断：

```go
var bizErr BizError
if errors.As(err, &bizErr) {
	fmt.Println(bizErr.Code, bizErr.Msg)
}
```

## 五、错误处理建议

- 能处理就处理，不能处理就返回给上层。
- 返回错误时加上业务上下文。
- 不要忽略错误。
- 不要用 `panic` 处理普通业务错误。

错误示例：

```go
file, _ := os.Open("data.txt") // 不推荐，忽略错误
```

推荐：

```go
file, err := os.Open("data.txt")
if err != nil {
	return fmt.Errorf("打开文件失败: %w", err)
}
defer file.Close()
```

## 六、什么时候返回 error

适合返回 `error`：

- 文件不存在
- 网络请求失败
- 数据库查询失败
- 参数业务校验失败
- JSON 解析失败

普通业务中，`error` 是 Go 最常见、最清晰的失败表达方式。
