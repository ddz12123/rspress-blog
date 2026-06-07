# package 和 import

Go 用 `package` 组织代码，用 `import` 导入其他包。

## 一、每个文件都要声明 package

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello")
}
```

`package main` 表示这是一个可执行程序。

普通工具包可以叫：

```go
package user
```

或：

```go
package config
```

## 二、同一个目录只能有一个包名

通常一个目录里的 `.go` 文件包名要一致。

```text
user/
├── model.go      package user
└── service.go    package user
```

不要这样混用：

```text
user/
├── model.go      package user
└── service.go    package service
```

## 三、导入标准库

```go
import (
	"fmt"
	"time"
)
```

使用：

```go
fmt.Println(time.Now())
```

## 四、导入自己项目里的包

假设 `go.mod`：

```go
module example.com/shop
```

目录：

```text
shop/
├── go.mod
├── main.go
└── internal/
    └── user/
        └── service.go
```

`internal/user/service.go`：

```go
package user

func Hello(name string) string {
	return "你好，" + name
}
```

`main.go`：

```go
package main

import (
	"fmt"

	"example.com/shop/internal/user"
)

func main() {
	fmt.Println(user.Hello("张三"))
}
```

导入路径从 `module` 名开始。

## 五、导出规则

首字母大写才能被其他包访问。

```go
func Hello() string {
	return "可以被其他包访问"
}

func hello() string {
	return "只能当前包使用"
}
```

结构体字段也是一样：

```go
type User struct {
	ID   int64  // 可导出
	name string // 不可导出
}
```

如果字段要被 JSON 编码、其他包访问，通常要首字母大写。

## 六、包命名建议

- 包名使用小写。
- 不用下划线。
- 不要取太泛的名字，例如 `common`、`utils` 到处堆。
- 包名尽量表达职责，例如 `user`、`config`、`handler`。

示例：

```text
internal/user
internal/order
internal/config
```

## 七、import 别名

如果包名冲突，可以使用别名：

```go
import userrepo "example.com/shop/internal/user/repository"
```

使用：

```go
repo := userrepo.New()
```

别名不要滥用，只有冲突或名称太长时再用。
