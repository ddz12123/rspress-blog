# benchmark 性能测试

Go 内置 benchmark，用来测试函数性能。

benchmark 函数命名：

```go
func BenchmarkXxx(b *testing.B) {
}
```

## 一、最小示例

被测函数：

```go
func Add(a, b int) int {
	return a + b
}
```

benchmark：

```go
func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Add(1, 2)
	}
}
```

运行：

```bash
go test -bench=.
```

输出类似：

```text
BenchmarkAdd-12    1000000000    0.3 ns/op
```

`b.N` 由 Go 测试工具自动调整。

## 二、避免编译器优化

如果结果完全没被使用，编译器可能优化掉代码。

可以用包级变量接收结果：

```go
var result int

func BenchmarkAdd(b *testing.B) {
	var r int
	for i := 0; i < b.N; i++ {
		r = Add(1, 2)
	}
	result = r
}
```

## 三、测试内存分配

```bash
go test -bench=. -benchmem
```

输出会包含：

```text
B/op
allocs/op
```

说明：

| 字段 | 含义 |
|------|------|
| `ns/op` | 每次操作耗时 |
| `B/op` | 每次操作分配字节数 |
| `allocs/op` | 每次操作分配次数 |

## 四、什么时候写 benchmark

适合：

- 核心算法
- 高频工具函数
- JSON 编解码优化
- 批量数据处理
- 网络服务热点路径

不适合：

- 普通业务 CRUD 一上来就 benchmark
- 没有性能问题时过早优化

先保证正确，再考虑性能。

## 五、性能优化建议

- 先用 benchmark 或 profile 找瓶颈。
- 不要凭感觉优化。
- 每次优化后重新测试。
- 优化不能破坏代码可读性和正确性。
