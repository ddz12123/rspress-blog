# 认识 FastAPI

FastAPI 是一个用 Python 写 Web API 的框架。

简单理解：

```text
浏览器 / 前端 / App
        ↓ 发送 HTTP 请求
FastAPI 后端
        ↓ 查询数据、处理业务
返回 JSON 响应
```

它适合写这些东西：

- 给前端页面调用的接口
- 给移动 App 调用的接口
- 后台管理系统接口
- 微服务接口
- 内部工具接口

## 一、什么是 API

API 可以理解为“后端提供给别人调用的入口”。

比如一个用户系统可能提供这些 API：

| 地址 | 方法 | 含义 |
|------|------|------|
| `/users/` | `GET` | 查询用户列表 |
| `/users/1` | `GET` | 查询 ID 为 1 的用户 |
| `/users/` | `POST` | 创建用户 |
| `/users/1` | `PATCH` | 修改 ID 为 1 的用户 |
| `/users/1` | `DELETE` | 删除 ID 为 1 的用户 |

FastAPI 的工作就是把这些地址和 Python 函数对应起来。

## 二、最小 FastAPI 程序

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello FastAPI"}
```

逐行看：

```python
from fastapi import FastAPI
```

从 `fastapi` 包里导入 `FastAPI` 类。

```python
app = FastAPI()
```

创建一个 FastAPI 应用。后面所有接口都挂在这个 `app` 上。

```python
@app.get("/")
```

这是一个装饰器，意思是：当有人用 `GET` 方法访问 `/` 时，执行下面这个函数。

```python
async def root():
```

定义一个函数。`async` 表示它可以执行异步操作，比如等待网络请求、数据库查询。

刚开始你可以先记住：

- 函数里没有 `await` 时，写 `def` 或 `async def` 都能工作。
- 如果函数里要 `await` 异步库，就写 `async def`。
- 使用普通同步数据库库时，路由函数写 `def` 也很常见。

```python
return {"message": "Hello FastAPI"}
```

返回一个 Python 字典。FastAPI 会自动把它转换成 JSON：

```json
{
    "message": "Hello FastAPI"
}
```

## 三、FastAPI 为什么适合新手

### 1. 写法接近普通 Python 函数

```python
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id}
```

`user_id: int` 不只是注释，它会让 FastAPI 自动做这些事：

- 从 URL 里取出 `user_id`
- 把字符串转换成整数
- 转换失败时自动返回错误
- 在接口文档里显示参数类型

### 2. 自动生成接口文档

项目启动后访问：

```text
http://127.0.0.1:8000/docs
```

就能看到 Swagger UI，可以直接在浏览器里测试接口。

### 3. 和 Pydantic 配合做数据校验

请求体通常用 Pydantic 模型描述：

```python
from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    age: int
```

FastAPI 收到 JSON 后，会自动检查：

- `name` 是不是字符串
- `age` 能不能转成整数
- 缺字段时返回 422 错误

## 四、先记住几个词

| 词 | 简单解释 |
|------|---------|
| 路由 | 一个 URL 地址和一个 Python 函数的绑定关系 |
| 请求 | 客户端发给后端的数据 |
| 响应 | 后端返回给客户端的数据 |
| 路径参数 | URL 路径里的参数，例如 `/users/{user_id}` |
| 查询参数 | URL 问号后面的参数，例如 `/users/?page=1` |
| 请求体 | `POST`、`PUT`、`PATCH` 里发送的 JSON 数据 |
| 响应模型 | 限制接口返回字段和类型的 Pydantic 模型 |

这些概念后面会配合代码一点点展开。
