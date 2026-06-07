# Pydantic 模型

Pydantic 负责数据校验和序列化，在 FastAPI 中用于定义请求体和响应体。本节重点讲 Pydantic 的核心用法以及和 SQLAlchemy 的配合。

## 一、Pydantic 基础

### 1.1 最简单的模型

```python
from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    age: int
    email: str
```

用法：

```python
# 自动校验类型，传错类型会报错
user = UserCreate(name="张三", age=25, email="zhangsan@example.com")

# 类型不对会抛 ValidationError
user = UserCreate(name="张三", age="不是数字", email="zhangsan@example.com")
# → ValidationError: Input should be a valid integer
```

### 1.2 可选字段和默认值

```python
class UserCreate(BaseModel):
    name: str                # 必填
    email: str               # 必填
    age: int = 0             # 可选，默认值 0
    nickname: str | None = None  # 可选，默认 None
```

```python
# 只传必填字段，其他用默认值
user = UserCreate(name="张三", email="zhangsan@example.com")
print(user.age)       # 0
print(user.nickname)  # None
```

`str | None = None` 是 Python 3.10+ 的写法，等价于 `Optional[str] = None`。

### 1.3 字段别名

当前端传的字段名和 Python 属性名不一致时，用 `alias`：

```python
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    user_name: str = Field(alias="userName")     # 前端传 userName，Python 用 user_name
    phone_number: str = Field(alias="phoneNumber")
```

```python
# 前端传 JSON：{"userName": "张三", "phoneNumber": "13800138000"}
user = UserCreate(**{"userName": "张三", "phoneNumber": "13800138000"})
#                 ↑ ** 是字典解包语法，把字典展开为关键字参数
#                 等价于：UserCreate(userName="张三", phoneNumber="13800138000")
print(user.user_name)     # 张三
```

### 1.4 字段校验

用 `Field` 添加校验规则：

```python
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)       # 长度限制
    age: int = Field(ge=0, le=150)                        # 数值范围：0 <= age <= 150
    email: str = Field(min_length=5)                      # 最短 5 个字符
    bio: str = Field(default="", max_length=500)          # 简介，最多 500 字
```

常用校验参数：

| 参数 | 适用类型 | 含义 |
|------|---------|------|
| `min_length` | str | 最小长度 |
| `max_length` | str | 最大长度 |
| `ge` | int/float | 大于等于（Greater Equal） |
| `le` | int/float | 小于等于（Less Equal） |
| `gt` | int/float | 大于（Greater Than） |
| `lt` | int/float | 小于（Less Than） |
| `pattern` | str | 正则表达式匹配 |

### 1.5 自定义校验器

当内置校验不够用时，用 `@field_validator`：

```python
from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None

    # 校验 email 格式
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("邮箱格式不正确，必须包含 @")
        return v.lower()   # 自动转小写

    # 校验手机号（中国手机号）
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and (not v.isdigit() or len(v) != 11):
            raise ValueError("手机号必须是 11 位数字")
        return v
```

```python
# 校验通过，email 自动转小写
user = UserCreate(name="张三", email="ZhangSan@Example.COM")
print(user.email)  # zhangsan@example.com

# 校验失败
user = UserCreate(name="张三", email="没有@符号")
# → ValidationError: 邮箱格式不正确，必须包含 @
```

### 1.6 多个字段联合校验

用 `@model_validator` 校验多个字段之间的关系：

```python
from pydantic import BaseModel, model_validator


class DateRange(BaseModel):
    start_date: str
    end_date: str

    @model_validator(mode="after")
    def check_dates(self) -> "DateRange":
        if self.start_date > self.end_date:
            raise ValueError("开始日期不能晚于结束日期")
        return self
```

```python
range = DateRange(start_date="2024-01-01", end_date="2024-12-31")  # 正常
range = DateRange(start_date="2024-12-31", end_date="2024-01-01")  # 报错
```

## 二、Pydantic 结合 SQLAlchemy

### 2.1 请求模型（从前端接收数据）

一般分两种：创建用、更新用。

```python
from pydantic import BaseModel, Field


# ---------- 创建：必填字段不给默认值 ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: str
    age: int = 0


# ---------- 更新：所有字段都可选 ----------
class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    age: int | None = None
    is_active: bool | None = None
```

为什么要分两个：

| | `UserCreate` | `UserUpdate` |
|---|---|---|
| 字段要求 | 必填字段不给默认值 | 全部可选 |
| HTTP 方法 | `POST /users` | `PATCH /users/{id}` |
| 原因 | 创建时必须有名字和邮箱 | 更新时只想改某个字段 |

### 2.2 响应模型（返回给前端）

用 `from_attributes = True` 让 Pydantic 可以直接读取 SQLAlchemy 的 ORM 对象：

```python
from pydantic import BaseModel
from datetime import datetime


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
```

`from_attributes` 的作用：

```python
# 没有 from_attributes：只能传字典
UserOut(**{"id": 1, "name": "张三", ...})

# 有了 from_attributes：可以直接传 ORM 对象
user_orm = db.execute(select(User).where(User.id == 1)).scalars().first()
user_out = UserOut.model_validate(user_orm)   # 自动提取字段
```

在 FastAPI 路由中不需要手动转换，声明 `response_model` 就行：

```python
@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    return user  # FastAPI 自动用 UserOut 过滤字段
```

### 2.3 隐藏敏感字段

响应模型里不写某个字段，就不会返回给前端：

```python
# 数据库 Model
class User(Base):
    __tablename__ = "users"
    id       = Column(Integer, primary_key=True)
    name     = Column(String(50))
    email    = Column(String(100))
    password = Column(String(128))     # 密码字段
    is_deleted = Column(Boolean)

# 响应模型：只暴露需要的字段
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    # password 和 is_deleted 不写 → 前端看不到

    model_config = {"from_attributes": True}
```

### 2.4 从 ORM 对象创建 Pydantic 模型

两种方式：

```python
# 方式一：model_validate（推荐）
user_out = UserOut.model_validate(user_orm)

# 方式二：拆包
user_out = UserOut(**{c.name: getattr(user_orm, c.name) for c in user_orm.__table__.columns})
```

日常开发用方式一，FastAPI 声明了 `response_model` 后会自动处理，不需要手动调。

### 2.5 从 Pydantic 模型创建 ORM 对象

```python
user_in = UserCreate(name="张三", email="zhangsan@example.com", age=25)

# model_dump() 把 Pydantic 模型转成字典
user = User(**user_in.model_dump())
# 等价于 User(name="张三", email="zhangsan@example.com", age=25)
```

`model_dump()` 的常用参数：

```python
user_in = UserCreate(name="张三", email="zhangsan@example.com", age=25)

# 全部字段
user_in.model_dump()
# {'name': '张三', 'email': 'zhangsan@example.com', 'age': 25}

# 排除某些字段
user_in.model_dump(exclude={"age"})
# {'name': '张三', 'email': 'zhangsan@example.com'}

# 只包含某些字段
user_in.model_dump(include={"name", "email"})
# {'name': '张三', 'email': 'zhangsan@example.com'}

# 只包含前端实际传了的字段（更新时用）
user_in = UserUpdate(name="新名字")  # 只传了 name
user_in.model_dump(exclude_unset=True)
# {'name': '新名字'}
```

## 三、分页响应模型

列表接口通常需要返回总数 + 当前页数据：

```python
from pydantic import BaseModel


class PageParams(BaseModel):
    """请求参数"""
    skip: int = 0
    limit: int = 10


class UserListOut(BaseModel):
    """响应结构"""
    total: int
    items: list[UserOut]

    model_config = {"from_attributes": True}
```

路由中使用：

```python
@app.get("/users/", response_model=UserListOut)
def list_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    total = db.execute(select(func.count()).select_from(User)).scalar()
    items = db.execute(select(User).offset(skip).limit(limit)).scalars().all()
    return {"total": total, "items": items}
```

前端拿到的数据结构：

```json
{
    "total": 100,
    "items": [
        {"id": 1, "name": "张三", "email": "zhangsan@example.com"},
        {"id": 2, "name": "李四", "email": "lisi@example.com"}
    ]
}
```

## 四、嵌套模型

模型之间可以嵌套，适合有关联关系的场景：

```python
from pydantic import BaseModel
from datetime import datetime


# 标签模型
class TagOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


# 文章模型（嵌套标签）
class ArticleOut(BaseModel):
    id: int
    title: str
    created_at: datetime | None = None
    tags: list[TagOut] = []          # 嵌套标签列表

    model_config = {"from_attributes": True}


# 用户模型（嵌套文章列表）
class UserDetailOut(BaseModel):
    id: int
    name: str
    email: str
    articles: list[ArticleOut] = []  # 嵌套文章列表

    model_config = {"from_attributes": True}
```

返回的数据结构：

```json
{
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "articles": [
        {
            "id": 1,
            "title": "FastAPI 入门",
            "tags": [
                {"id": 1, "name": "Python"},
                {"id": 2, "name": "FastAPI"}
            ]
        }
    ]
}
```

配合 `joinedload` 或 `selectinload` 预加载关联数据，避免 N+1 查询问题。

## 五、完整示例

```python
from pydantic import BaseModel, Field
from datetime import datetime


# ---------- 请求 ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: str
    age: int = Field(default=0, ge=0, le=150)


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    age: int | None = None
    is_active: bool | None = None


# ---------- 响应 ----------
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: int
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserListOut(BaseModel):
    total: int
    items: list[UserOut]

    model_config = {"from_attributes": True}
```

### 各模型的职责

| 模型 | 方向 | 职责 |
|------|------|------|
| `UserCreate` | 前端 → 后端 | 校验创建请求，必填字段检查 |
| `UserUpdate` | 前端 → 后端 | 校验更新请求，字段都可选 |
| `UserOut` | 后端 → 前端 | 过滤响应字段，隐藏敏感信息 |
| `UserListOut` | 后端 → 前端 | 列表响应，包含分页信息 |
