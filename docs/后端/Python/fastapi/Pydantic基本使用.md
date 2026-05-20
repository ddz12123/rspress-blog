# Pydantic 基本使用

Pydantic 是 Python 中最流行的数据验证库，使用 Python 类型注解来定义数据结构，自动完成数据验证、序列化和文档生成。FastAPI 底层依赖 Pydantic 处理所有请求/响应数据。

官网：<https://docs.pydantic.dev>

## 1、安装

```bash
pip install pydantic
```

---

## 2、基本模型定义

继承 `BaseModel` 定义数据模型：

```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str
```

### 创建实例

```python
user = User(name="Alice", age=25, email="alice@example.com")
print(user.name)  # Alice
```

### 自动类型转换

Pydantic 会自动尝试转换类型：

```python
user = User(name="Bob", age="30", email="bob@example.com")  # age 传入字符串
print(user.age)      # 30 (int)
print(type(user.age))  # <class 'int'>
```

### 数据验证

类型不匹配时自动报错：

```python
try:
    user = User(name="Charlie", age="not a number", email="charlie@example.com")
except Exception as e:
    print(e)
    # 1 validation error for User
    # age
    #   Input should be a valid integer...
```

---

## 3、字段类型

Pydantic 支持所有 Python 基本类型和复合类型：

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Product(BaseModel):
    name: str                    # 字符串
    price: float                 # 浮点数
    quantity: int = 0            # 整数，默认值 0
    is_active: bool = True       # 布尔值
    tags: list[str] = []         # 字符串列表
    metadata: dict = {}          # 字典
    created_at: datetime         # 日期时间
    description: Optional[str] = None  # 可选字符串
```

---

## 4、可选字段与默认值

### 可选字段

使用 `Optional[T]` 或 `T | None` 声明可选字段：

```python
from typing import Optional

class Item(BaseModel):
    name: str                           # 必填
    description: Optional[str] = None   # 可选，默认 None
    price: float                        # 必填
    tax: float | None = None            # 可选，默认 None（Python 3.10+ 语法）
```

### 默认值

```python
class Config(BaseModel):
    host: str = "localhost"    # 默认值
    port: int = 8000           # 默认值
    debug: bool = False        # 默认值
```

---

## 5、字段校验（Field）

使用 `Field` 添加更详细的校验规则：

```python
from pydantic import BaseModel, Field

class User(BaseModel):
    # 必填，3-50 个字符
    username: str = Field(..., min_length=3, max_length=50, description="用户名")

    # 必填，至少 6 个字符
    password: str = Field(..., min_length=6, description="密码")

    # 可选，最多 100 个字符
    nickname: str | None = Field(None, max_length=100, description="昵称")

    # 必填，大于 0
    age: int = Field(..., gt=0, le=150, description="年龄")

    # 必填，正则校验
    phone: str = Field(..., pattern=r"^1[3-9]\d{9}$", description="手机号")
```

### Field 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `...` | 必填字段 | `Field(...)` |
| `None` | 可选字段 | `Field(None)` |
| `min_length` | 最小长度 | `Field(min_length=3)` |
| `max_length` | 最大长度 | `Field(max_length=50)` |
| `gt` | 大于 | `Field(gt=0)` |
| `ge` | 大于等于 | `Field(ge=0)` |
| `lt` | 小于 | `Field(lt=100)` |
| `le` | 小于等于 | `Field(le=100)` |
| `pattern` | 正则表达式 | `Field(pattern=r"^\d+$")` |
| `description` | 字段描述 | `Field(description="用户名")` |
| `example` | 示例值 | `Field(example="Alice")` |

---

## 6、Email 和 URL 校验

```python
from pydantic import BaseModel, EmailStr, HttpUrl

class Contact(BaseModel):
    email: EmailStr              # 邮箱格式校验
    website: HttpUrl | None = None  # URL 格式校验
    homepage: str | None = None

# pip install pydantic[email]
contact = Contact(email="alice@example.com", website="https://example.com")
```

---

## 7、嵌套模型

模型可以嵌套使用：

```python
from pydantic import BaseModel

class Address(BaseModel):
    city: str
    street: str
    zip_code: str

class User(BaseModel):
    name: str
    age: int
    address: Address              # 嵌套模型
    tags: list[str] = []

user = User(
    name="Alice",
    age=25,
    address={"city": "Beijing", "street": "Main St", "zip_code": "100000"}
)
print(user.address.city)  # Beijing
```

---

## 8、模型方法

### model_dump() - 转换为字典

```python
user = User(name="Alice", age=25, address=Address(city="Beijing", street="Main St", zip_code="100000"))
data = user.model_dump()
print(data)
# {'name': 'Alice', 'age': 25, 'address': {'city': 'Beijing', 'street': 'Main St', 'zip_code': '100000'}, 'tags': []}
```

### model_dump_json() - 转换为 JSON 字符串

```python
json_str = user.model_dump_json()
print(json_str)
# {"name":"Alice","age":25,"address":{"city":"Beijing","street":"Main St","zip_code":"100000"},"tags":[]}
```

### model_validate() - 从字典验证

```python
data = {"name": "Bob", "age": 30, "address": {"city": "Shanghai", "street": "Second St", "zip_code": "200000"}}
user = User.model_validate(data)
print(user.name)  # Bob
```

### model_validate_json() - 从 JSON 字符串验证

```python
json_str = '{"name": "Charlie", "age": 35, "address": {"city": "Guangzhou", "street": "Third St", "zip_code": "510000"}}'
user = User.model_validate_json(json_str)
print(user.name)  # Charlie
```

---

## 9、模型继承

```python
from pydantic import BaseModel

class BaseUser(BaseModel):
    username: str
    email: str

class CreateUser(BaseUser):
    password: str

class UpdateUser(BaseModel):
    username: str | None = None
    email: str | None = None

class UserResponse(BaseUser):
    id: int
    is_active: bool = True
```

---

## 10、枚举类型

```python
from enum import Enum
from pydantic import BaseModel

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class User(BaseModel):
    name: str
    role: UserRole = UserRole.USER

user = User(name="Alice", role="admin")
print(user.role)  # UserRole.ADMIN
```

---

## 11、自定义校验器

使用 `@field_validator` 添加自定义校验逻辑：

```python
from pydantic import BaseModel, field_validator

class User(BaseModel):
    username: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_must_be_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("用户名只能包含字母和数字")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("两次密码不一致")
        return v
```

---

## 12、FastAPI 中的使用

### 请求体校验

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)
    email: str | None = None

@app.post("/users/")
async def create_user(user: UserCreate):
    return {"username": user.username}
```

### 响应模型

```python
class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    return {"id": user_id, "username": "Alice", "email": "alice@example.com", "password": "secret"}
    # 返回结果中不会包含 password 字段
```

### 查询参数校验

```python
from fastapi import Query

@app.get("/items/")
async def list_items(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    keyword: str | None = Query(None, max_length=50, description="搜索关键词"),
):
    return {"page": page, "page_size": page_size, "keyword": keyword}
```

---

## 13、Pydantic Settings（配置管理）

使用 `pydantic-settings` 管理环境变量：

```bash
pip install pydantic-settings
```

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "My App"
    DEBUG: bool = False
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
print(settings.DATABASE_URL)
```

`.env` 文件：

```ini
APP_NAME=FastAPI Admin
DEBUG=true
DATABASE_URL=mongodb://localhost:27017
SECRET_KEY=your-secret-key
```

---

## 总结

| 功能 | 说明 |
|------|------|
| `BaseModel` | 定义数据模型 |
| `Field` | 字段校验和元数据 |
| `Optional[T]` | 可选字段 |
| `EmailStr` | 邮箱格式校验 |
| `HttpUrl` | URL 格式校验 |
| `@field_validator` | 自定义校验器 |
| `model_dump()` | 转换为字典 |
| `model_dump_json()` | 转换为 JSON |
| `model_validate()` | 从字典验证 |
| `BaseSettings` | 环境变量配置管理 |

---

## 参考

- [Pydantic 官方文档](https://docs.pydantic.dev/)
- [Pydantic GitHub](https://github.com/pydantic/pydantic)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
