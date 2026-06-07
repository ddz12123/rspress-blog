# HTTP 服务端

Go 标准库 `net/http` 可以直接写 Web 服务。

Go 1.22 以后，标准库 `ServeMux` 支持更方便的路由写法：

```go
mux.HandleFunc("GET /users/{id}", handler)
```

## 一、最小 HTTP 服务

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	http.ListenAndServe(":8080", mux)
}
```

运行：

```bash
go run .
```

访问：

```text
http://127.0.0.1:8080/health
```

## 二、返回 JSON

```go
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
```

使用：

```go
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	writeJSON(w, http.StatusOK, map[string]any{
		"id":   id,
		"name": "张三",
	})
})
```

`r.PathValue("id")` 用来读取路径参数。

## 三、解析 JSON 请求体

```go
type CreateUserRequest struct {
	Name string `json:"name"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"id":   1,
		"name": req.Name,
	})
}
```

注册路由：

```go
mux.HandleFunc("POST /users", createUser)
```

## 四、完整示例

```go
package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type CreateUserRequest struct {
	Name string `json:"name"`
}

type UserResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		writeJSON(w, http.StatusOK, UserResponse{ID: id, Name: "张三"})
	})

	mux.HandleFunc("POST /users", func(w http.ResponseWriter, r *http.Request) {
		var req CreateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}

		writeJSON(w, http.StatusCreated, UserResponse{ID: "1", Name: req.Name})
	})

	log.Println("server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

## 五、中间件

中间件本质上是包装 `http.Handler`。

```go
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
```

使用：

```go
handler := logMiddleware(mux)
http.ListenAndServe(":8080", handler)
```

## 六、什么时候用框架

标准库已经能写 HTTP 服务。

框架如 Gin、Echo、Fiber 可以提供：

- 更方便的路由分组
- 参数绑定
- 中间件生态
- 统一响应封装

入门阶段先学标准库，有助于理解框架底层在做什么。
