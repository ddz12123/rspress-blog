# 过期时间和 Key 设计

Redis 经常保存临时数据和缓存数据，TTL 是非常重要的设计点。

没有过期策略的缓存会越来越多，最后占满内存。

## 一、设置过期时间

单独设置过期时间：

```text
SET user:1:profile "{\"id\":1,\"name\":\"Tom\"}"
EXPIRE user:1:profile 1800
```

写入时设置过期时间：

```text
SET user:1:profile "{\"id\":1,\"name\":\"Tom\"}" EX 1800
```

毫秒级：

```text
SET sms:code:13800138000 9527 PX 300000
```

查看 TTL：

```text
TTL user:1:profile
```

## 二、TTL 返回值

| 返回值 | 含义 |
|--------|------|
| 正整数 | 剩余秒数 |
| `-1` | key 存在，但没有过期时间 |
| `-2` | key 不存在 |

示例：

```text
SET temp:value abc
TTL temp:value
EXPIRE temp:value 60
TTL temp:value
DEL temp:value
TTL temp:value
```

## 三、移除过期时间

```text
SET temp:value abc EX 60
PERSIST temp:value
TTL temp:value
```

`PERSIST` 会移除 TTL，让 key 变成永久 key。

## 四、覆盖写入会影响 TTL

普通 `SET` 会覆盖 value，也会清除旧 TTL。

```text
SET user:1:profile old EX 60
TTL user:1:profile
SET user:1:profile new
TTL user:1:profile
```

第二次 `TTL` 会返回 `-1`。

需要保留 TTL 时可以使用 `KEEPTTL`：

```text
SET user:1:profile old EX 60
SET user:1:profile new KEEPTTL
TTL user:1:profile
```

## 五、Key 命名

推荐使用业务前缀加冒号分层：

```text
业务:实体:ID:属性
```

示例：

```text
user:1:profile
article:100:view_count
sms:code:13800138000
rate:login:ip:127.0.0.1
lock:order:10001
rank:article:daily:2026-06-07
```

常见规范：

| 规范 | 说明 |
|------|------|
| 前缀明确 | 方便按业务排查 |
| 层级稳定 | 程序拼接 key 不容易混乱 |
| ID 位置固定 | 方便批量扫描 |
| 避免超长 key | key 本身也消耗内存 |
| 避免特殊字符 | 方便命令行处理 |

## 六、Key 生命周期

不同数据设置不同 TTL：

| 数据 | TTL 示例 |
|------|----------|
| 验证码 | 5 分钟 |
| 登录失败次数 | 10 分钟 |
| 用户资料缓存 | 10 到 60 分钟 |
| 文章详情缓存 | 5 到 30 分钟 |
| 热门榜单 | 几小时到几天 |
| 分布式锁 | 几秒到几十秒 |

核心原则：

- 临时数据必须有 TTL。
- 缓存数据通常要有 TTL。
- 计数类数据需要明确同步或落库策略。
- 永久 key 要能说清楚为什么永久。

## 七、内存淘汰策略

Redis 内存达到 `maxmemory` 限制后，会按配置的淘汰策略处理 key。

常见策略：

| 策略 | 含义 |
|------|------|
| `noeviction` | 不淘汰，写入新数据时报错 |
| `allkeys-lru` | 在所有 key 中淘汰最近最少使用的 key |
| `volatile-lru` | 只在设置了过期时间的 key 中做 LRU 淘汰 |
| `allkeys-lfu` | 在所有 key 中淘汰访问频率低的 key |
| `volatile-ttl` | 优先淘汰 TTL 更短的 key |

缓存场景经常使用 `allkeys-lru` 或 `allkeys-lfu`。核心数据不能只依赖 Redis 淘汰策略保护，仍然要有主数据源。

