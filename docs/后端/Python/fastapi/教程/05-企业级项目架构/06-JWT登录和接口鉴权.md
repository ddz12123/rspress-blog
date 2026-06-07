# JWT 登录和接口鉴权

企业后台接口通常不是每个接口手动判断登录，而是统一做鉴权。

本节采用参考项目里的方案：

```text
公开接口
  ↓ 白名单放行

受保护接口
  ↓ AuthMiddleware 提取 Authorization: Bearer <token>
  ↓ 校验 JWT
  ↓ payload 放到 request.state.user
  ↓ controller/service 正常执行
  ↓ 如果接口需要用户资料，再通过 get_current_user 查数据库
```

这种方式适合“默认所有业务接口都要登录”的项目。

## 一、JWT 放什么

JWT 里只放少量非敏感信息：

```json
{
    "sub": "1",
    "iat": 1710000000,
    "exp": 1710086400,
    "account": "admin"
}
```

字段说明：

| 字段 | 含义 |
|------|------|
| `sub` | 用户主键，建议转成字符串 |
| `iat` | 签发时间 |
| `exp` | 过期时间 |
| `account` | 非敏感展示信息，可选 |

不要把密码、手机号、身份证、权限明细等敏感信息直接放进 JWT。

## 二、密码哈希和 Token 工具

`app/core/security.py`：

```python
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    # 只保存哈希后的密码，禁止保存明文密码。
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(
    subject: str | int,
    extra_data: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
    }

    if extra_data:
        payload.update(extra_data)

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except InvalidTokenError:
        return None
```

关键点：

- PyJWT 解码时必须传 `algorithms=[...]`，不要让库自己从 Token 里决定算法。
- `exp` 和 `iat` 使用带时区的 UTC 时间。
- 密钥必须来自环境变量，不要写死在代码里。
- 密码必须哈希保存，不要保存明文。

> 如果你已有项目使用标准库 PBKDF2 + `hmac.compare_digest`，也可以继续使用。新项目为了代码更简单，可以直接用 FastAPI 官方安全教程里的 `pwdlib` 方案。

## 三、请求和响应模型

`app/schemas/auth_schema.py`：

```python
from pydantic import BaseModel, ConfigDict, Field


class AccountPasswordRequest(BaseModel):
    model_config = ConfigDict(
        title="账号密码请求",
        json_schema_extra={
            "example": {
                "account": "test_account",
                "password": "123456",
            }
        },
    )

    account: str = Field(min_length=1, max_length=64, title="账号")
    password: str = Field(min_length=1, max_length=128, title="密码")


class RegisterRequest(AccountPasswordRequest):
    model_config = ConfigDict(title="账号密码注册请求")


class LoginRequest(AccountPasswordRequest):
    model_config = ConfigDict(title="账号密码登录请求")


class TokenResponse(BaseModel):
    model_config = ConfigDict(title="Token 响应")

    access_token: str = Field(title="访问令牌")
    authorization: str = Field(
        title="Authorization 请求头",
        examples=["Bearer xxx.yyy.zzz"],
    )
    token_type: str = Field(default="bearer", title="令牌类型")
    expires_in: int = Field(title="过期时间，单位秒")
```

登录注册接口只接收 `account` 和 `password`。

`password_hash`、注册方式、最后登录时间等字段都由后端生成。

## 四、登录注册 service

`app/services/auth_service.py`：

```python
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.business import BusinessError
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, RegisterRequest


def register(db: Session, form: RegisterRequest) -> dict:
    exists_stmt = select(User.id).where(User.account == form.account).limit(1)
    if db.scalar(exists_stmt):
        raise BusinessError("账号已存在")

    user = User(
        account=form.account,
        password_hash=hash_password(form.password),
        status=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BusinessError("账号已存在") from exc

    db.refresh(user)
    return _create_token_data(user)


def login(db: Session, form: LoginRequest) -> dict:
    stmt = select(User).where(User.account == form.account).limit(1)
    user = db.scalar(stmt)

    if not user or not verify_password(form.password, user.password_hash):
        raise BusinessError("账号或密码错误")

    if user.status != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="用户已禁用")

    return _create_token_data(user)


def _create_token_data(user: User) -> dict:
    token = create_access_token(
        subject=user.id,
        extra_data={"account": user.account},
    )

    return {
        "access_token": token,
        "authorization": f"Bearer {token}",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
    }
```

真实项目还可以在登录成功后更新：

- `last_login_at`
- `last_login_ip`
- `last_login_type`
- 登录失败次数

## 五、controller 和 routes

`app/controllers/auth_controller.py`：

```python
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.response import success
from app.db.session import get_db
from app.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import login, register


def register_controller(
    form: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    token_data = register(db, form)
    data = TokenResponse(**token_data).model_dump(mode="json")
    return success(data=data, msg="注册成功")


def login_controller(
    form: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    token_data = login(db, form)
    data = TokenResponse(**token_data).model_dump(mode="json")
    return success(data=data, msg="登录成功")
```

`app/api/routes/auth_routes.py`：

```python
from fastapi import APIRouter

from app.controllers import auth_controller
from app.schemas.auth_schema import TokenResponse
from app.schemas.response_schema import ApiResponse

router = APIRouter(prefix="/auth", tags=["鉴权"])

router.add_api_route(
    "/register",
    auth_controller.register_controller,
    methods=["POST"],
    response_model=ApiResponse[TokenResponse],
    summary="账号密码注册",
)

router.add_api_route(
    "/login",
    auth_controller.login_controller,
    methods=["POST"],
    response_model=ApiResponse[TokenResponse],
    summary="账号密码登录",
)
```

最终路径：

```text
POST /api/auth/register
POST /api/auth/login
```

## 六、全局 JWT 中间件

`app/middlewares/auth_middleware.py`：

```python
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings
from app.core.response import fail
from app.core.security import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    # 白名单放行，其余接口必须携带 Bearer Token。
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or self._is_public_path(request.url.path):
            return await call_next(request)

        token = self._get_bearer_token(request)
        if not token:
            return JSONResponse(status_code=401, content=fail(msg="缺少 Token"))

        payload = decode_access_token(token)
        if not payload:
            return JSONResponse(status_code=401, content=fail(msg="Token 无效或已过期"))

        # 后续依赖可以从 request.state.user 读取 JWT payload。
        request.state.user = payload
        return await call_next(request)

    @staticmethod
    def _get_bearer_token(request: Request) -> str | None:
        authorization = request.headers.get("Authorization", "")

        if not authorization.lower().startswith("bearer "):
            return None

        return authorization.split(" ", 1)[1].strip()

    @staticmethod
    def _is_public_path(path: str) -> bool:
        for item in settings.auth_exclude_paths:
            if item.endswith("*") and path.startswith(item[:-1]):
                return True
            if path == item:
                return True

        return False
```

`app/main.py` 注册：

```python
from app.middlewares.auth_middleware import AuthMiddleware

app.add_middleware(AuthMiddleware)
```

白名单来自 `settings.auth_exclude_paths`：

```python
[
    "/",
    "/docs*",
    "/redoc*",
    "/openapi.json",
    "/api/health",
    "/api/auth/register",
    "/api/auth/login",
]
```

新增公开接口时，加到白名单：

```python
"/api/public/*"
```

## 七、获取当前用户

有些接口只需要 Token 有效，中间件已经够了。

如果接口需要当前用户资料，再用依赖查询数据库。

`app/dependencies/auth.py`：

```python
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User


def get_current_payload(request: Request) -> dict[str, Any]:
    payload = getattr(request.state, "user", None)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")
    return payload


def get_current_user(
    payload: Annotated[dict[str, Any], Depends(get_current_payload)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效")

    try:
        user = db.get(User, int(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Token 无效") from exc

    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    if user.status != 1:
        raise HTTPException(status_code=403, detail="用户已禁用")

    return user
```

路由使用：

```python
from typing import Annotated

from fastapi import Depends

from app.dependencies.auth import get_current_user
from app.models.user import User


def me_controller(current_user: Annotated[User, Depends(get_current_user)]):
    return success(data={"id": current_user.id, "account": current_user.account})
```

## 八、Swagger Authorize

如果使用全局中间件，Swagger 不一定自动知道所有接口都需要 Bearer Token。

可以自定义 OpenAPI，给文档加 Bearer 鉴权方案：

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def configure_openapi(app: FastAPI) -> None:
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})[
            "BearerAuth"
        ] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
        openapi_schema["security"] = [{"BearerAuth": []}]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
```

登录后拿到 `access_token`，在 Swagger 右上角 `Authorize` 里只填原始 Token，不要手动加 `Bearer`。

## 九、中间件方案和依赖方案怎么选

| 方案 | 适合场景 |
|------|---------|
| 全局中间件 + 白名单 | 后台系统，默认大多数接口需要登录 |
| `OAuth2PasswordBearer` 依赖 | 接口级权限差异大，希望 OpenAPI 自动表达安全依赖 |

FastAPI 官方安全教程主要展示 `OAuth2PasswordBearer` 依赖方案。参考项目采用全局中间件方案，两种都能做 JWT，关键是团队内部保持一致。
