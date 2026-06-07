# Go Modules 依赖管理

Go Modules 是现在 Go 项目的标准依赖管理方式。

核心文件：

```text
go.mod
go.sum
```

## 一、初始化模块

```bash
mkdir shop
cd shop
go mod init example.com/shop
```

生成：

```go
module example.com/shop

go 1.26
```

模块名决定了项目内部包的导入前缀。

## 二、添加依赖

```bash
go get github.com/google/uuid
```

代码：

```go
package main

import (
	"fmt"

	"github.com/google/uuid"
)

func main() {
	fmt.Println(uuid.NewString())
}
```

执行：

```bash
go mod tidy
```

`go.mod` 会记录依赖版本。

## 三、升级依赖

升级某个依赖：

```bash
go get github.com/google/uuid@latest
```

查看哪些依赖有新版本：

```bash
go list -m -u all
```

如果确实要批量升级依赖，可以再执行：

```bash
go get -u ./...
go mod tidy
```

生产项目不要盲目批量升级。升级前后都要跑测试：

```bash
go test ./...
```

## 四、删除依赖

删除代码里的 import 和使用位置后：

```bash
go mod tidy
```

Go 会自动从 `go.mod` 里移除不再使用的依赖。

## 五、go.sum 不要手动改

`go.sum` 保存依赖校验值。

它的作用是确认下载到的依赖内容和预期一致。

正常做法：

- 提交 `go.mod`
- 提交 `go.sum`
- 不手动编辑 `go.sum`

## 六、replace 本地替换

开发多个本地模块时，可以用 `replace`。

```go
module example.com/shop

go 1.26

require example.com/common v0.0.0

replace example.com/common => ../common
```

这表示把 `example.com/common` 替换成本地 `../common` 目录。

只在本地开发或 monorepo 场景使用，发布前要确认是否应该保留。

## 七、go work 工作区

多个模块一起开发时，可以使用工作区：

```bash
go work init ./shop ./common
```

生成：

```text
go.work
```

工作区适合多个模块联调。初学阶段一个项目一个 `go.mod` 就够了。

## 八、常用依赖命令

| 命令 | 作用 |
|------|------|
| `go list -m all` | 查看所有模块依赖 |
| `go list -m -u all` | 查看可升级依赖 |
| `go mod tidy` | 整理依赖 |
| `go mod download` | 下载依赖 |
| `go env GOPROXY` | 查看依赖代理 |

现代 Go 项目围绕 `go.mod` 工作，不需要把代码放到 `$GOPATH/src`。
