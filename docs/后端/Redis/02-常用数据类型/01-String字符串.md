# String 字符串

String 是 Redis 最基础的数据类型，一个 key 对应一个 value。

value 可以是普通字符串、数字字符串、JSON 字符串或二进制内容。后端项目里最常见的用法是缓存一段数据、保存验证码、做计数器。

## 一、基本读写

```text
SET name Tom
GET name
DEL name
```

执行结果：

```text
GET name
"Tom"
```

覆盖写入：

```text
SET name Jerry
GET name
```

`SET` 默认会覆盖旧值。

## 二、设置过期时间

写入时直接设置过期时间：

```text
SET code:login:13800138000 9527 EX 300
```

含义：

| 部分 | 说明 |
|------|------|
| `code:login:13800138000` | 登录验证码 key |
| `9527` | 验证码 |
| `EX 300` | 300 秒后过期 |

查看剩余时间：

```text
TTL code:login:13800138000
```

毫秒级过期时间使用 `PX`：

```text
SET temp:value abc PX 5000
```

## 三、一次写入多个值

```text
MSET user:1:name Tom user:1:city Beijing
MGET user:1:name user:1:city
```

`MSET` 和 `MGET` 适合一次处理多个 String key，减少网络往返次数。

## 四、计数器

Redis 对数字字符串提供原子自增和自减命令。

```text
SET article:100:view_count 0
INCR article:100:view_count
INCR article:100:view_count
GET article:100:view_count
```

一次增加指定数量：

```text
INCRBY article:100:view_count 10
```

自减：

```text
DECR article:100:view_count
DECRBY article:100:view_count 5
```

常见场景：

| 场景 | key 示例 |
|------|----------|
| 文章浏览量 | `article:100:view_count` |
| 登录失败次数 | `login_fail:user:1` |
| 接口访问次数 | `rate:api:user:1` |

## 五、只在不存在时写入

`SETNX` 表示 set if not exists。

```text
SETNX lock:order:10001 processing
```

返回值：

| 返回 | 含义 |
|------|------|
| `1` | 写入成功 |
| `0` | key 已存在，写入失败 |

更常用的是在 `SET` 里同时加 `NX` 和过期时间：

```text
SET lock:order:10001 processing NX EX 30
```

这类命令常用于简单分布式锁。锁必须设置过期时间，避免业务异常后锁永远不释放。

## 六、读取后删除

`GETDEL` 会读取 value，并立即删除 key。

```text
SET code:login:13800138000 9527 EX 300
GETDEL code:login:13800138000
GET code:login:13800138000
```

适合一次性验证码、一次性 token 这类数据。

## 七、缓存 JSON

后端经常把数据库查询结果序列化成 JSON，再存入 Redis。

```text
SET user:1:profile "{\"id\":1,\"name\":\"Tom\",\"age\":18}" EX 1800
GET user:1:profile
```

注意点：

| 注意 | 原因 |
|------|------|
| 设置 TTL | 避免缓存长期不更新 |
| 控制 value 大小 | 大 value 会增加网络和内存压力 |
| 修改字段时整体重写 | String 不适合频繁改局部字段 |

如果对象字段需要单独修改，Hash 更合适。

