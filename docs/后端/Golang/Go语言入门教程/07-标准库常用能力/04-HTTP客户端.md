# HTTP 客户端

Go 标准库 `net/http` 可以发送 HTTP 请求。

## 一、最简单的 GET

```go
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	resp, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("请求失败:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}

	fmt.Println(string(body))
}
```

请求成功后，一定要关闭响应体：

```go
defer resp.Body.Close()
```

## 二、使用 http.Client

实际项目建议自己创建 `http.Client`，并设置超时。

```go
client := &http.Client{
	Timeout: 5 * time.Second,
}

resp, err := client.Get("https://example.com")
```

不设置超时可能导致请求长时间挂住。

## 三、发送 JSON POST

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type LoginRequest struct {
	Account  string `json:"account"`
	Password string `json:"password"`
}

func main() {
	reqBody := LoginRequest{
		Account:  "admin",
		Password: "123456",
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		fmt.Println(err)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(
		"http://127.0.0.1:8080/login",
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(resp.StatusCode)
	fmt.Println(string(body))
}
```

## 四、自定义请求头

```go
req, err := http.NewRequest("GET", "https://example.com", nil)
if err != nil {
	return err
}

req.Header.Set("Authorization", "Bearer token")
req.Header.Set("User-Agent", "my-app")

resp, err := client.Do(req)
```

## 五、使用 context 控制超时

```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

req, err := http.NewRequestWithContext(ctx, "GET", "https://example.com", nil)
if err != nil {
	return err
}

resp, err := client.Do(req)
```

后端服务中，通常使用请求上下文：

```go
req, err := http.NewRequestWithContext(r.Context(), "GET", url, nil)
```

## 六、使用建议

- 生产代码不要忘记设置超时。
- 请求成功后必须关闭 `resp.Body`。
- JSON 请求要设置 `Content-Type: application/json`。
- 需要取消或超时时使用 context。
