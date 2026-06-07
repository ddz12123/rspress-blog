# APIRouter 路由拆分

前面的例子都写在 `main.py` 里。

接口少的时候没问题，接口多了以后会变成这样：

```text
main.py
├── 用户接口 20 个
├── 商品接口 30 个
├── 订单接口 40 个
└── 登录接口 10 个
```

文件会越来越长。FastAPI 用 `APIRouter` 拆分路由。

## 一、推荐目录结构

先从最小结构开始：

```text
fastapi-demo/
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── routers/
│       ├── __init__.py
│       ├── users.py
│       └── items.py
└── .venv/
```

说明：

| 文件 | 作用 |
|------|------|
| `app/main.py` | 创建 FastAPI 应用，注册路由 |
| `app/routers/users.py` | 用户相关接口 |
| `app/routers/items.py` | 商品相关接口 |
| `__init__.py` | 让目录成为 Python 包，方便导入 |

## 二、编写 users.py

```python
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("/")
def list_users():
    return [
        {"id": 1, "username": "zhangsan"},
        {"id": 2, "username": "lisi"},
    ]


@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "username": "zhangsan"}
```

重点看这一行：

```python
router = APIRouter(prefix="/users", tags=["用户"])
```

含义：

| 参数 | 作用 |
|------|------|
| `prefix="/users"` | 这个文件里的路由统一加 `/users` 前缀 |
| `tags=["用户"]` | 在 `/docs` 里归到“用户”分组 |

所以：

```python
@router.get("/")
```

实际路径是：

```text
GET /users/
```

## 三、编写 items.py

```python
from fastapi import APIRouter

router = APIRouter(prefix="/items", tags=["商品"])


@router.get("/")
def list_items():
    return [
        {"id": 1, "name": "键盘"},
        {"id": 2, "name": "鼠标"},
    ]


@router.get("/{item_id}")
def get_item(item_id: int):
    return {"id": item_id, "name": "键盘"}
```

## 四、在 main.py 注册路由

```python
from fastapi import FastAPI

from app.routers import items, users

app = FastAPI(title="路由拆分示例")

app.include_router(users.router)
app.include_router(items.router)


@app.get("/", tags=["基础"])
def root():
    return {"message": "Hello FastAPI"}
```

启动：

```bash
fastapi dev app/main.py
```

访问：

```text
http://127.0.0.1:8000/docs
```

你会看到接口按“基础”“用户”“商品”分组展示。

## 五、二级路由前缀

如果你希望所有接口都带版本号，例如 `/api/v1`，可以在 `main.py` 里加前缀：

```python
app.include_router(users.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
```

最终路径：

```text
GET /api/v1/users/
GET /api/v1/items/
```

也可以创建一个总路由：

```python
# app/routers/api.py
from fastapi import APIRouter

from app.routers import items, users

router = APIRouter(prefix="/api/v1")
router.include_router(users.router)
router.include_router(items.router)
```

`main.py`：

```python
from fastapi import FastAPI

from app.routers.api import router as api_router

app = FastAPI()
app.include_router(api_router)
```

## 六、什么时候拆文件

建议按业务拆：

| 业务 | 文件 |
|------|------|
| 用户 | `routers/users.py` |
| 商品 | `routers/items.py` |
| 订单 | `routers/orders.py` |
| 登录认证 | `routers/auth.py` |

不要一开始就拆太细。初学阶段保持清晰最重要。
