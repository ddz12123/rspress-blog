# 事务和 Lua 脚本

Redis 的事务和 MySQL 事务不是一回事。

Redis 事务可以把多个命令排队，然后一次执行。它保证执行期间不会插入其他客户端命令，但不提供 SQL 那种自动回滚能力。

## 一、MULTI 和 EXEC

事务从 `MULTI` 开始：

```text
MULTI
SET user:1:name Tom
INCR article:100:view_count
EXEC
```

执行流程：

```text
MULTI 之后的命令先进入队列
EXEC 时按顺序执行队列里的命令
```

取消事务：

```text
MULTI
SET name Tom
DISCARD
```

## 二、事务没有自动回滚

示例：

```text
SET count abc
MULTI
INCR count
SET name Tom
EXEC
```

`INCR count` 会因为 value 不是整数而失败，但 `SET name Tom` 仍然可能执行。

所以 Redis 事务不能按 MySQL 的回滚思路理解。

## 三、WATCH 乐观锁

`WATCH` 用来监视 key。如果事务执行前 key 被其他客户端修改，`EXEC` 会失败。

客户端 A：

```text
WATCH stock:100
GET stock:100
MULTI
DECR stock:100
EXEC
```

客户端 B 在 A 执行 `EXEC` 前修改：

```text
SET stock:100 20
```

此时客户端 A 的 `EXEC` 会返回空结果，表示事务没有执行。

常见用途：

| 场景 | 说明 |
|------|------|
| 扣库存 | 读取库存后再扣减 |
| 余额变更 | 修改前检查余额 |
| 并发更新 | 防止覆盖其他客户端修改 |

实际项目里通常由客户端库封装重试逻辑。

## 四、Lua 脚本

Redis 可以执行 Lua 脚本。脚本执行期间是原子的，中途不会被其他命令插入。

基本格式：

```text
EVAL "return redis.call('GET', KEYS[1])" 1 name
```

含义：

| 参数 | 说明 |
|------|------|
| Lua 字符串 | 要执行的脚本 |
| `1` | 传入的 key 数量 |
| `name` | `KEYS[1]` |

## 五、分布式锁释放脚本

加锁：

```text
SET lock:order:10001 request-123 NX EX 30
```

释放锁时必须先判断 value 是否属于当前请求，再删除 key。

Lua 脚本：

```text
EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end" 1 lock:order:10001 request-123
```

逻辑：

```text
if GET lock_key == request_id:
    DEL lock_key
else:
    return 0
```

这样可以避免误删其他请求后来创建的锁。

## 六、Lua 使用注意

| 注意 | 说明 |
|------|------|
| 脚本要短 | 长脚本会阻塞 Redis |
| key 通过 `KEYS` 传入 | 不要在脚本里拼接隐藏 key |
| 参数通过 `ARGV` 传入 | 方便复用脚本 |
| 不要执行不确定耗时操作 | Redis 主线程会被阻塞 |

Lua 适合封装“检查再修改”的原子逻辑，例如限流、扣库存、释放锁。

