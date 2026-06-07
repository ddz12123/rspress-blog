# 结构体 struct

结构体是 Go 里最重要的数据组织方式之一。

如果说变量只能保存一个值，那么结构体可以把多个相关字段组合成一个整体。

例如一个用户：

```go
type User struct {
	ID   int64
	Name string
	Age  int
}
```

这个 `User` 类型同时包含：

- 用户 ID
- 用户名
- 年龄

后端开发里，请求参数、响应数据、数据库模型、业务对象，基本都会大量使用结构体。

## 一、为什么需要结构体

不用结构体时，函数参数会越来越乱：

```go
func printUser(id int64, name string, age int, email string, active bool) {
	// ...
}
```

字段一多，调用方就很难看懂：

```go
printUser(1, "张三", 18, "zhangsan@example.com", true)
```

使用结构体后：

```go
type User struct {
	ID     int64
	Name   string
	Age    int
	Email  string
	Active bool
}

func printUser(user User) {
	// ...
}
```

调用时更清楚：

```go
user := User{
	ID:     1,
	Name:   "张三",
	Age:    18,
	Email:  "zhangsan@example.com",
	Active: true,
}

printUser(user)
```

结构体解决的是“把一组相关数据放在一起”的问题。

## 二、定义结构体

```go
type User struct {
	ID   int64
	Name string
	Age  int
}
```

格式：

```go
type 类型名 struct {
	字段名 字段类型
}
```

字段名首字母大小写有含义：

| 字段 | 含义 |
|------|------|
| `Name` | 首字母大写，包外可以访问 |
| `name` | 首字母小写，只能当前包访问 |

如果结构体要用于 JSON 响应、其他包访问，字段通常要大写。

## 三、创建结构体

推荐使用字段名初始化：

```go
user := User{
	ID:   1,
	Name: "张三",
	Age:  18,
}
```

这种写法最清楚，不怕字段顺序变化。

不推荐初学者使用无字段名初始化：

```go
user := User{1, "张三", 18}
```

因为以后结构体字段顺序变化，代码很容易出错。

## 四、访问和修改字段

```go
user := User{
	ID:   1,
	Name: "张三",
	Age:  18,
}

fmt.Println(user.Name)

user.Age = 20
fmt.Println(user.Age)
```

字段访问使用点号：

```go
对象.字段
```

## 五、结构体零值

结构体不赋值时，每个字段会使用对应类型的零值。

```go
var user User

fmt.Println(user.ID)   // 0
fmt.Println(user.Name) // ""
fmt.Println(user.Age)  // 0
```

常见零值：

| 类型 | 零值 |
|------|------|
| `int` / `int64` | `0` |
| `string` | `""` |
| `bool` | `false` |
| 指针 | `nil` |
| 切片 | `nil` |
| map | `nil` |

Go 很重视零值。设计结构体时，最好让零值也尽量可用。

## 六、结构体是值类型

这是结构体非常重要的一点。

把结构体赋值给另一个变量，会复制一份。

```go
package main

import "fmt"

type User struct {
	Name string
	Age  int
}

func main() {
	u1 := User{Name: "张三", Age: 18}
	u2 := u1

	u2.Name = "李四"

	fmt.Println(u1.Name) // 张三
	fmt.Println(u2.Name) // 李四
}
```

`u2 := u1` 是复制结构体值，不是让 `u1` 和 `u2` 指向同一个对象。

这点和切片、map 不一样。

### 结构体复制是浅拷贝

结构体赋值会复制字段本身，但如果字段里放的是切片、map、指针，复制后的结构体仍然可能共享底层数据。

```go
package main

import "fmt"

type User struct {
	Name string
	Tags []string
}

func main() {
	u1 := User{
		Name: "张三",
		Tags: []string{"vip"},
	}

	u2 := u1
	u2.Name = "李四"
	u2.Tags[0] = "admin"

	fmt.Println(u1.Name)    // 张三
	fmt.Println(u1.Tags[0]) // admin
}
```

为什么 `Name` 没变，但 `Tags` 变了？

- `Name` 是字符串字段，复制后各自独立。
- `Tags` 是切片字段，切片头被复制了，但底层数组还是同一个。

所以不要简单理解成“结构体复制后完全互不影响”。更准确的说法是：结构体字段会被复制，但字段内部如果引用了别的数据，就要看那个字段类型自己的行为。

## 七、函数传结构体也是复制

```go
func rename(user User) {
	user.Name = "李四"
}

func main() {
	user := User{Name: "张三"}
	rename(user)

	fmt.Println(user.Name) // 张三
}
```

为什么没改成功？

因为 `rename(user)` 传进去的是一份副本。

函数内部改的是副本，不是原来的 `user`。

## 八、用结构体指针修改原对象

如果函数要修改结构体，传指针：

```go
func rename(user *User) {
	user.Name = "李四"
}

func main() {
	user := User{Name: "张三"}
	rename(&user)

	fmt.Println(user.Name) // 李四
}
```

这里：

- `&user` 表示取 `user` 的地址。
- `*User` 表示指向 `User` 的指针。
- `user.Name` 可以直接访问字段，Go 会自动帮你处理 `(*user).Name`。

结构体和指针经常一起出现。

## 九、结构体指针初始化

直接创建结构体指针：

```go
user := &User{
	ID:   1,
	Name: "张三",
	Age:  18,
}
```

`user` 的类型是：

```go
*User
```

访问字段仍然写：

```go
fmt.Println(user.Name)
```

Go 不要求你写：

```go
fmt.Println((*user).Name)
```

## 十、构造函数写法

Go 没有传统面向对象语言里的构造函数，但常用 `NewXxx` 函数创建结构体。

```go
type User struct {
	ID   int64
	Name string
	Age  int
}

func NewUser(id int64, name string, age int) *User {
	return &User{
		ID:   id,
		Name: name,
		Age:  age,
	}
}
```

使用：

```go
user := NewUser(1, "张三", 18)
```

什么时候需要构造函数？

- 创建对象时需要默认值。
- 创建对象时需要校验参数。
- 结构体字段不希望外部随便改。

示例：

```go
type User struct {
	id   int64
	name string
}

func NewUser(id int64, name string) (*User, error) {
	if name == "" {
		return nil, errors.New("用户名不能为空")
	}

	return &User{id: id, name: name}, nil
}
```

字段小写后，外部包不能直接改，只能通过你提供的方法操作。

## 十一、结构体方法

结构体可以绑定方法。

```go
type User struct {
	Name string
	Age  int
}

func (u User) SayHello() string {
	return "你好，我是" + u.Name
}
```

使用：

```go
user := User{Name: "张三"}
fmt.Println(user.SayHello())
```

如果方法要修改结构体字段，用指针接收者：

```go
func (u *User) Grow() {
	u.Age++
}
```

使用：

```go
user := User{Name: "张三", Age: 18}
user.Grow()

fmt.Println(user.Age) // 19
```

## 十二、嵌套结构体

结构体字段也可以是另一个结构体。

```go
type Address struct {
	City   string
	Street string
}

type User struct {
	ID      int64
	Name    string
	Address Address
}
```

初始化：

```go
user := User{
	ID:   1,
	Name: "张三",
	Address: Address{
		City:   "杭州",
		Street: "文一路",
	},
}

fmt.Println(user.Address.City)
```

嵌套结构体适合表达“包含关系”。

例如：

- 用户有地址。
- 订单有收货信息。
- 文章有作者信息。

## 十三、匿名字段和结构体嵌入

Go 可以把一个结构体嵌入另一个结构体。

```go
type BaseModel struct {
	ID int64
}

type User struct {
	BaseModel
	Name string
}
```

使用：

```go
user := User{
	BaseModel: BaseModel{ID: 1},
	Name:      "张三",
}

fmt.Println(user.ID)
```

虽然 `ID` 在 `BaseModel` 里，但可以直接写 `user.ID`。

这不是传统继承，更像字段提升。初学时不要把它理解成 Java 的 `extends`。

## 十四、结构体标签

结构体标签是字段后面的元信息。

```go
type User struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}
```

JSON 编码时，会使用标签里的名字：

```json
{
    "id": 1,
    "name": "张三",
    "age": 18
}
```

如果没有标签，默认使用字段名：

```json
{
    "ID": 1,
    "Name": "张三",
    "Age": 18
}
```

后端接口通常会写 JSON 标签，让响应字段符合前端习惯。

## 十五、omitempty

`omitempty` 表示字段是零值时，JSON 编码可以省略。

```go
type User struct {
	ID       int64  `json:"id"`
	Nickname string `json:"nickname,omitempty"`
}
```

如果 `Nickname` 是空字符串，输出 JSON 时可以不出现这个字段。

注意：`omitempty` 会把零值省略。

| 类型 | 会被省略的值 |
|------|-------------|
| `string` | `""` |
| `int` | `0` |
| `bool` | `false` |
| 指针 | `nil` |
| 切片 | `nil` 或空切片 |

如果你需要区分“没传”和“传了零值”，可以使用指针字段。

## 十六、请求结构体和响应结构体要分开

后端项目里，不要一个结构体到处用。

创建用户请求：

```go
type CreateUserRequest struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
```

用户响应：

```go
type UserResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}
```

数据库模型：

```go
type UserModel struct {
	ID           int64
	Name         string
	Age          int
	PasswordHash string
}
```

为什么分开？

| 结构体 | 作用 |
|------|------|
| `CreateUserRequest` | 接收前端传来的创建参数 |
| `UserResponse` | 返回给前端，隐藏敏感字段 |
| `UserModel` | 数据库存储结构 |

例如 `PasswordHash` 只能在数据库模型里，绝对不能返回给前端。

## 十七、结构体常见坑

### 1. 字段小写导致 JSON 为空

```go
type User struct {
	name string `json:"name"`
}
```

`encoding/json` 只能访问导出字段。`name` 是小写，编码时不会输出。

正确：

```go
type User struct {
	Name string `json:"name"`
}
```

### 2. 忘记结构体是值拷贝

```go
func update(user User) {
	user.Name = "李四"
}
```

这种修改不会影响外部对象。要修改原对象，使用指针：

```go
func update(user *User) {
	user.Name = "李四"
}
```

### 3. 结构体嵌套太深

结构体可以嵌套，但不要过度嵌套。层级太深会让代码难读。

## 十八、完整示例

```go
package main

import (
	"encoding/json"
	"fmt"
)

type CreateUserRequest struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

type User struct {
	ID   int64
	Name string
	Age  int
}

type UserResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func NewUser(id int64, req CreateUserRequest) *User {
	return &User{
		ID:   id,
		Name: req.Name,
		Age:  req.Age,
	}
}

func ToUserResponse(user *User) UserResponse {
	return UserResponse{
		ID:   user.ID,
		Name: user.Name,
		Age:  user.Age,
	}
}

func main() {
	req := CreateUserRequest{Name: "张三", Age: 18}
	user := NewUser(1, req)
	resp := ToUserResponse(user)

	data, err := json.Marshal(resp)
	if err != nil {
		fmt.Println("JSON 编码失败:", err)
		return
	}

	fmt.Println(string(data))
}
```

这就是后端项目里结构体的典型用法：

```text
请求结构体 → 业务结构体/数据库结构体 → 响应结构体
```

结构体学扎实后，Go 的后端代码会清楚很多。
