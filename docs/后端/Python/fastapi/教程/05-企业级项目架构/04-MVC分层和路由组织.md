# MVC 分层和路由组织

这一节用“用户列表查询”讲清楚 MVC 分层怎么落地。

目标接口：

```text
GET /api/users?page=1&pageSize=10
```

文件分工：

```text
api/routes/user_routes.py      注册路由
controllers/user_controller.py 接收参数，返回统一响应
services/user_service.py       查询数据库，组织分页数据
models/user.py                 用户 ORM 模型
schemas/user_schema.py         用户响应模型
```

## 一、定义用户模型

`app/models/user.py`：

```python
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    nickname: Mapped[str | None] = mapped_column(String(64), default=None)
    status: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )
```

注意：

- `password_hash` 是数据库字段，但不要放到响应模型里。
- `models` 只描述表结构，不处理前端请求。
- 表结构变更交给 Alembic，不在启动时自动建表。

## 二、定义响应模型

`app/schemas/user_schema.py`：

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserListItem(BaseModel):
    # from_attributes=True 让 Pydantic 可以直接读取 SQLAlchemy ORM 对象。
    model_config = ConfigDict(from_attributes=True, title="用户列表项")

    id: int = Field(title="用户 ID")
    account: str = Field(title="账号")
    nickname: str | None = Field(default=None, title="昵称")
    status: int = Field(title="状态", description="1 正常，0 禁用")
    created_at: datetime = Field(title="创建时间")
    updated_at: datetime = Field(title="更新时间")


class UserListResponse(BaseModel):
    model_config = ConfigDict(title="用户列表响应")

    total: int = Field(title="总数")
    page: int = Field(title="当前页码")
    pageSize: int = Field(title="每页数量")
    items: list[UserListItem] = Field(title="用户列表")
```

响应模型的重点是“前端能看到什么”，不是数据库里有什么。

## 三、编写 service

`app/services/user_service.py`：

```python
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_list(
    db: Session,
    page: int,
    page_size: int,
    account: str | None = None,
    status: int | None = None,
) -> dict:
    # service 负责业务查询，不关心 HTTP 响应格式。
    filters = []

    account = account.strip() if account else None
    if account:
        filters.append(User.account.like(f"%{account}%"))

    if status is not None:
        filters.append(User.status == status)

    count_stmt = select(func.count()).select_from(User)
    list_stmt = select(User).order_by(User.id.desc())

    if filters:
        count_stmt = count_stmt.where(*filters)
        list_stmt = list_stmt.where(*filters)

    total = db.scalar(count_stmt) or 0
    users = db.scalars(
        list_stmt.offset((page - 1) * page_size).limit(page_size)
    ).all()

    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": users,
    }
```

这里返回的是普通字典，里面的 `items` 可以是 ORM 对象列表。后面 controller 会交给 Pydantic 响应模型过滤。

## 四、编写 controller

`app/controllers/user_controller.py`：

```python
from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.core.response import success
from app.db.session import get_db
from app.schemas.user_schema import UserListResponse
from app.services.user_service import get_user_list


def list_users_controller(
    page: Annotated[int, Query(ge=1, description="页码，从 1 开始")],
    page_size: Annotated[
        int,
        Query(alias="pageSize", ge=1, le=100, description="每页数量"),
    ],
    db: Annotated[Session, Depends(get_db)],
    account: Annotated[str | None, Query(max_length=64)] = None,
    status: Annotated[int | None, Query(ge=0, le=1)] = None,
):
    # controller 负责 HTTP 参数和统一响应，查询细节交给 service。
    page_data = get_user_list(
        db=db,
        page=page,
        page_size=page_size,
        account=account,
        status=status,
    )
    data = UserListResponse(**page_data).model_dump(mode="json")
    return success(data=data)
```

这里的 `alias="pageSize"` 表示前端传 `pageSize`，Python 代码里用 `page_size`。

## 五、注册路由

`app/api/routes/user_routes.py`：

```python
from fastapi import APIRouter

from app.controllers.user_controller import list_users_controller
from app.schemas.response_schema import ApiResponse
from app.schemas.user_schema import UserListResponse

router = APIRouter(tags=["用户"])

router.add_api_route(
    "/users",
    list_users_controller,
    methods=["GET"],
    response_model=ApiResponse[UserListResponse],
    summary="用户列表查询",
    description="分页查询用户列表，page 和 pageSize 必填。",
)
```

使用 `add_api_route()` 的好处是：路由文件更像“接口清单”，业务实现都在 controller。

如果你更喜欢装饰器，也可以这样写：

```python
@router.get("/users", response_model=ApiResponse[UserListResponse])
def list_users(...):
    ...
```

两种都能用，团队统一一种风格即可。

## 六、聚合路由

`app/api/router.py`：

```python
from fastapi import APIRouter

from app.api.routes import user_routes

api_router = APIRouter()
api_router.include_router(user_routes.router)
```

`app/main.py`：

```python
from app.api.router import api_router

app.include_router(api_router, prefix="/api")
```

最终接口路径：

```text
GET /api/users
```

## 七、分层带来的好处

| 改动 | 应该改哪里 |
|------|-----------|
| 修改 URL 或文档描述 | `api/routes` |
| 新增查询参数 | `controllers` |
| 修改查询规则 | `services` |
| 修改表字段 | `models` + Alembic |
| 修改返回字段 | `schemas` |
| 修改统一响应格式 | `core/response.py` |

代码多一点，但定位问题会快很多。
