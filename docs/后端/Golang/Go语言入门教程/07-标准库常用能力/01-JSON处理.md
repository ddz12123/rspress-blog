# JSON 处理

后端接口最常见的数据格式就是 JSON。

Go 标准库使用 `encoding/json` 处理 JSON。

## 一、结构体转 JSON

```go
package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	user := User{ID: 1, Name: "张三", Age: 18}

	data, err := json.Marshal(user)
	if err != nil {
		fmt.Println("编码失败:", err)
		return
	}

	fmt.Println(string(data))
}
```

输出：

```json
{"id":1,"name":"张三","age":18}
```

## 二、JSON 转结构体

```go
text := `{"id":1,"name":"张三","age":18}`

var user User
err := json.Unmarshal([]byte(text), &user)
if err != nil {
	fmt.Println("解析失败:", err)
	return
}

fmt.Println(user.Name)
```

注意：`json.Unmarshal` 第二个参数要传指针：

```go
&user
```

因为它需要把解析结果写入 `user`。

## 三、字段必须导出

错误示例：

```go
type User struct {
	name string `json:"name"`
}
```

`name` 小写，`encoding/json` 不能访问，编码结果会缺字段。

正确：

```go
type User struct {
	Name string `json:"name"`
}
```

## 四、omitempty

```go
type User struct {
	ID       int64  `json:"id"`
	Nickname string `json:"nickname,omitempty"`
}
```

当 `Nickname` 是空字符串时，JSON 会省略这个字段。

## 五、处理请求体

HTTP 服务里常这样解析 JSON：

```go
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	// 使用 req
}
```

响应 JSON：

```go
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resp)
```

## 六、完整 HTTP JSON 示例

```go
package main

import (
	"encoding/json"
	"net/http"
)

type CreateUserRequest struct {
	Name string `json:"name"`
}

type UserResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	resp := UserResponse{ID: 1, Name: req.Name}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /users", createUser)

	http.ListenAndServe(":8080", mux)
}
```

Go 1.22 以后，标准库 `ServeMux` 支持 `"POST /users"` 这种方法 + 路径匹配。
