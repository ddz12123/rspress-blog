# CRUD 操作

把数据库操作封装成函数，和路由逻辑分开，方便复用和测试。

## 一、新增（Create）

### 1.1 基本写法

```python
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(**user_in.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
```

### 1.2 逐行拆解

```python
def create_user(db: Session, user_in: UserCreate) -> User:
```

- `db: Session` — 类型提示，告诉编辑器 `db` 是一个 SQLAlchemy 会话对象，IDE 能自动补全 `.add()`、`.commit()` 等方法
- `user_in: UserCreate` — 类型提示，`user_in` 是一个 Pydantic 模型对象
- `-> User` — 返回值类型提示，表示这个函数返回一个 `User` ORM 对象

```python
user = User(**user_in.model_dump())
```

这行做了两件事，分开看：

**第一步：`user_in.model_dump()`**

把 Pydantic 模型转成字典：

```python
user_in = UserCreate(name="张三", email="zhangsan@example.com", age=25)

user_in.model_dump()
# 结果：{'name': '张三', 'email': 'zhangsan@example.com', 'age': 25}
```

**第二步：`**` 字典解包**

`**` 是 Python 的字典解包语法，把字典的键值对展开为关键字参数：

```python
# 这两行是等价的：
User(**{'name': '张三', 'email': 'zhangsan@example.com', 'age': 25})
User(name='张三', email='zhangsan@example.com', age=25)
```

所以完整过程是：

```python
# 原始写法（手动一个个写）
user = User(name="张三", email="zhangsan@example.com", age=25)

# 等价写法（用 ** 自动展开）
user = User(**user_in.model_dump())

# 拆开看就是：
# 1. user_in.model_dump()  →  {'name': '张三', 'email': 'zhangsan@example.com', 'age': 25}
# 2. **{'name': '张三', ...}  →  name='张三', email='zhangsan@example.com', age=25
# 3. User(name='张三', ...)  →  创建 User 对象
```

> **`*` 和 `**` 的区别：**
> - `*` 用于列表/元组解包：`func(*[1, 2, 3])` 等价于 `func(1, 2, 3)`
> - `**` 用于字典解包：`func(**{'a': 1, 'b': 2})` 等价于 `func(a=1, b=2)`

```python
db.add(user)
db.commit()
db.refresh(user)
return user
```

- `db.add(user)` — 把对象加入会话（还没写入数据库）
- `db.commit()` — 提交事务，真正写入数据库
- `db.refresh(user)` — 刷新对象，拿到数据库自动生成的值（如 `id`、`created_at`）
- `return user` — 返回 ORM 对象

### 1.3 完整流程图

```
前端发请求
  ↓
Pydantic 校验数据 → UserCreate(name="张三", email="zhangsan@example.com")
  ↓
model_dump()      → {'name': '张三', 'email': 'zhangsan@example.com', 'age': 0}
  ↓
** 解包            → name='张三', email='zhangsan@example.com', age=0
  ↓
User(...)          → 创建 ORM 对象
  ↓
db.add + commit    → 写入数据库
  ↓
db.refresh         → 拿到 id、created_at
  ↓
return user        → 返回给路由函数
```

## 二、查询（Read）

### 2.1 查询单条

```python
from sqlalchemy import select


def get_user(db: Session, user_id: int) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = db.execute(stmt)
    return result.scalars().first()
```

逐步拆解：

```python
stmt = select(User)                  # SELECT * FROM users
       .where(User.id == user_id)    # WHERE id = ?

result = db.execute(stmt)            # 执行 SQL，返回 Result 对象
user = result.scalars().first()      # 取出第一行 ORM 对象
```

| 方法 | 作用 |
|------|------|
| `select(User)` | 构建查询语句 |
| `.where(...)` | 添加条件 |
| `db.execute(stmt)` | 执行查询 |
| `.scalars()` | 从每行结果中取出第一个值（即 ORM 对象本身） |
| `.first()` | 取第一条，没有返回 `None` |

**`-> User | None` 是什么意思：**

这是 Python 3.10+ 的类型提示语法，表示返回值要么是 `User` 对象，要么是 `None`：

```python
# 找到了 → 返回 User 对象
# 没找到 → 返回 None
user = get_user(db, user_id=999)
if user is None:
    print("用户不存在")
else:
    print(user.name)
```

`User | None` 等价于旧写法 `Optional[User]`。

### 2.2 查询列表

```python
def get_users(db: Session, skip: int = 0, limit: int = 10) -> list[User]:
    stmt = select(User).offset(skip).limit(limit)
    result = db.execute(stmt)
    return result.scalars().all()
```

- `skip: int = 0` — 参数有默认值，不传时默认为 0
- `-> list[User]` — 返回一个列表，里面每个元素都是 `User` 对象
- `.offset(skip)` — 跳过前 N 条（分页用）
- `.limit(limit)` — 最多返回 N 条
- `.scalars().all()` — 取出所有 ORM 对象

### 2.3 条件查询

```python
def get_active_users(db: Session) -> list[User]:
    stmt = select(User).where(User.is_active == True)
    result = db.execute(stmt)
    return result.scalars().all()
```

常用条件写法：

```python
# 等于
.where(User.name == "张三")

# 不等于
.where(User.is_active != False)

# 大于 / 小于
.where(User.age > 18)
.where(User.age < 60)

# IN 查询
.where(User.name.in_(["张三", "李四", "王五"]))

# LIKE 模糊查询
.where(User.name.contains("张"))         # LIKE '%张%'
.where(User.name.like("张%"))            # LIKE '张%'
.where(User.name.startswith("张"))       # LIKE '张%'

# 多条件 AND
.where(User.is_active == True, User.age > 18)

# 多条件 OR
from sqlalchemy import or_
.where(or_(User.name == "张三", User.name == "李四"))
```

### 2.4 排序

```python
from sqlalchemy import desc

# 升序（默认）
stmt = select(User).order_by(User.id)

# 降序
stmt = select(User).order_by(desc(User.created_at))

# 多字段排序
stmt = select(User).order_by(User.is_active, desc(User.created_at))
```

### 2.5 统计数量

```python
from sqlalchemy import func

def count_users(db: Session) -> int:
    stmt = select(func.count()).select_from(User)
    result = db.execute(stmt)
    return result.scalar()
```

等价于 `SELECT COUNT(*) FROM users`。

- `.scalar()` — 取出单个值（不是 ORM 对象，是普通 Python 值）

## 三、修改（Update）

### 3.1 基本写法

```python
def update_user(db: Session, user_id: int, user_in: UserUpdate) -> User | None:
    # 1. 先查出来
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalars().first()
    if not user:
        return None

    # 2. 只更新传了值的字段（跳过 None）
    update_data = user_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    # 3. 提交
    db.commit()
    db.refresh(user)
    return user
```

### 3.2 逐行拆解

```python
if not user:
    return None
```

`if not user` — 当 `user` 是 `None` 时条件成立。Python 中 `None` 的布尔值为 `False`，所以 `not None` 为 `True`。

```python
update_data = user_in.model_dump(exclude_unset=True)
```

`exclude_unset=True` — 只包含前端实际传了的字段：

```python
# 前端只传了 name，没传 email 和 age
user_in = UserUpdate(name="新名字")

user_in.model_dump()
# {'name': '新名字', 'email': None, 'age': None, 'is_active': None}
# ↑ 所有字段都出来了，没传的也是 None，会把原来的值覆盖掉

user_in.model_dump(exclude_unset=True)
# {'name': '新名字'}
# ↑ 只有前端实际传了的字段
```

```python
for key, value in update_data.items():
    setattr(user, key, value)
```

**`.items()` 是什么：**

字典的方法，返回键值对：

```python
update_data = {'name': '新名字', 'age': 30}

for key, value in update_data.items():
    print(key, value)

# 输出：
# name 新名字
# age 30
```

**`setattr()` 是什么：**

Python 内置函数，用来设置对象的属性，`setattr(obj, name, value)` 等价于 `obj.name = value`：

```python
user = User(name="张三", age=25)

# 这两种写法等价：
user.name = "李四"
setattr(user, "name", "李四")

# 用 setattr 的好处是属性名可以是变量
field = "name"
setattr(user, field, "李四")   # 动态设置属性
# user.name → "李四"
```

所以这段循环的意思是：遍历字典，把每个字段的值设置到 user 对象上：

```python
# update_data = {'name': '新名字', 'age': 30}
# 循环执行：
#   setattr(user, 'name', '新名字')  →  user.name = '新名字'
#   setattr(user, 'age', 30)         →  user.age = 30
```

## 四、删除（Delete）

### 4.1 基本写法

```python
def delete_user(db: Session, user_id: int) -> bool:
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalars().first()
    if not user:
        return False

    db.delete(user)
    db.commit()
    return True
```

- `-> bool` — 返回布尔值，`True` 表示删除成功，`False` 表示没找到

### 4.2 软删除 vs 硬删除

```python
# 硬删除：真的从数据库删掉（上面的写法）
db.delete(user)

# 软删除：只标记，数据还在（推荐生产环境用）
user.is_deleted = True
db.commit()
```

| | 硬删除 | 软删除 |
|---|---|---|
| 数据 | 没了 | 还在，标记 `is_deleted=True` |
| 恢复 | 不可能 | 改回 `False` 就行 |
| 适合 | 临时数据、测试 | 用户、订单等重要数据 |

## 五、Python 语法速查

本节用到的 Python 语法，初学者容易困惑的点：

| 语法 | 含义 | 示例 |
|------|------|------|
| `**dict` | 字典解包，展开为关键字参数 | `func(**{'a': 1})` → `func(a=1)` |
| `-> Type` | 函数返回值类型提示 | `def f() -> int:` |
| `Type \| None` | 联合类型，可以是 Type 或 None | `User \| None` |
| `param: Type` | 参数类型提示 | `db: Session` |
| `param = 默认值` | 参数有默认值 | `skip: int = 0` |
| `if not x` | x 为 None/False/0/空时成立 | `if not user:` |
| `dict.items()` | 遍历字典的键值对 | `for k, v in d.items():` |
| `setattr(obj, name, val)` | 设置对象属性 | `setattr(user, 'name', '张三')` |
