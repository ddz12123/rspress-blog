# Pydantic 请求体

`GET` 接口通常用路径参数和查询参数。

`POST`、`PUT`、`PATCH` 通常需要接收 JSON 请求体，这时就用 Pydantic 模型。

## 一、最简单的请求体

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class UserCreate(BaseModel):
    name: str
    age: int
    email: str


@app.post("/users/")
def create_user(user: UserCreate):
    return user
```

发送 JSON：

```json
{
    "name": "张三",
    "age": 18,
    "email": "zhangsan@example.com"
}
```

FastAPI 会自动做三件事：

1. 读取请求体 JSON。
2. 用 `UserCreate` 校验数据。
3. 把校验后的数据传给 `user` 参数。

如果 `age` 传 `"abc"`，会自动返回 422 错误。

## 二、必填、默认值、可选字段

```python
from pydantic import BaseModel


class ItemCreate(BaseModel):
    name: str
    price: float
    description: str | None = None
    is_active: bool = True
```

字段规则：

| 字段 | 写法 | 是否必填 | 说明 |
|------|------|---------|------|
| `name` | `name: str` | 必填 | 没有默认值 |
| `price` | `price: float` | 必填 | 没有默认值 |
| `description` | `description: str | None = None` | 可选 | 可以不传，也可以传 `null` |
| `is_active` | `is_active: bool = True` | 可选 | 不传时默认 `True` |

注意这个容易踩坑的写法：

```python
class Demo(BaseModel):
    name: str | None
```

它表示：`name` 必须传，但值可以是字符串或 `null`。

如果想让它可以不传，要写：

```python
class Demo(BaseModel):
    name: str | None = None
```

## 三、使用 Field 添加校验

```python
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30, description="用户名")
    password: str = Field(min_length=8, max_length=128, description="密码")
    age: int = Field(ge=0, le=150, description="年龄")
```

常用参数：

| 参数 | 含义 |
|------|------|
| `min_length` | 字符串最小长度 |
| `max_length` | 字符串最大长度 |
| `ge` | 大于等于 |
| `gt` | 大于 |
| `le` | 小于等于 |
| `lt` | 小于 |
| `pattern` | 正则表达式 |
| `description` | 文档描述 |

`Field()` 不只会校验数据，也会影响 `/docs` 里显示的字段说明。

## 四、把模型转成字典

Pydantic v2 使用 `model_dump()`。

```python
user = UserCreate(username="zhangsan", password="password123", age=18)

data = user.model_dump()
print(data)
```

输出：

```python
{
    "username": "zhangsan",
    "password": "password123",
    "age": 18,
}
```

常见用法：

```python
# 排除某些字段
user.model_dump(exclude={"password"})

# 只保留某些字段
user.model_dump(include={"username", "age"})

# 只导出调用方实际传入的字段，PATCH 更新时常用
user.model_dump(exclude_unset=True)
```

## 五、创建和更新要分开写模型

创建用户时，用户名和密码通常必填。

更新用户时，用户可能只改昵称，不改密码。

所以不要一个模型到处用，建议分开：

```python
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    nickname: str | None = Field(default=None, max_length=50)


class UserUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    nickname: str | None = Field(default=None, max_length=50)
```

更新时配合 `exclude_unset=True`：

```python
@app.patch("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    update_data = user.model_dump(exclude_unset=True)
    return {"user_id": user_id, "update_data": update_data}
```

如果前端只传：

```json
{
    "nickname": "小张"
}
```

`update_data` 只有：

```python
{
    "nickname": "小张"
}
```

不会把没传的 `password` 更新成 `None`。

## 六、嵌套模型

请求体可以嵌套。

```python
from pydantic import BaseModel, Field


class Address(BaseModel):
    city: str
    street: str


class UserCreate(BaseModel):
    username: str
    address: Address
    tags: list[str] = Field(default_factory=list)
```

发送 JSON：

```json
{
    "username": "zhangsan",
    "address": {
        "city": "杭州",
        "street": "文一路"
    },
    "tags": ["vip", "new"]
}
```

`default_factory=list` 表示每次创建模型时都生成一个新的空列表。对初学者来说，这比直接写 `tags: list[str] = []` 更清晰，也更不容易和普通 Python 的可变默认值规则混淆。

## 七、自定义字段校验

内置校验不够时，用 `@field_validator`。

```python
from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_must_be_simple(cls, value: str) -> str:
        if not value.replace("_", "").isalnum():
            raise ValueError("用户名只能包含字母、数字和下划线")
        return value
```

如果校验失败，FastAPI 会把错误信息整理成 422 响应。

## 八、请求体、路径参数、查询参数一起用

```python
from typing import Annotated

from fastapi import FastAPI, Query
from pydantic import BaseModel, Field

app = FastAPI()


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=50)
    price: float | None = Field(default=None, ge=0)


@app.patch("/items/{item_id}")
def update_item(
    item_id: int,
    item: ItemUpdate,
    operator: Annotated[str | None, Query(description="操作人")] = None,
):
    return {
        "item_id": item_id,
        "operator": operator,
        "update_data": item.model_dump(exclude_unset=True),
    }
```

FastAPI 会自动判断：

| 参数 | 来源 |
|------|------|
| `item_id` | 路径参数 |
| `item` | JSON 请求体 |
| `operator` | 查询参数 |
