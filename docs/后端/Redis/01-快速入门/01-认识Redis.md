# 认识 Redis

Redis 是内存数据结构存储。

常见用途：

- 缓存热点数据
- 保存登录态或验证码
- 文章浏览量计数
- 接口限流
- 排行榜
- 分布式锁
- 发布订阅消息
- 简单队列

## 一、Redis 的基本模型

Redis 最基础的使用方式是 key-value：

```text
key   -> value
name  -> Tom
count -> 100
```

但 value 不只可以是字符串，还可以是多种数据结构：

| 类型 | 典型用途 |
|------|----------|
| String | 缓存 JSON、计数器、验证码 |
| Hash | 用户资料、对象字段 |
| List | 队列、最新消息列表 |
| Set | 去重集合、标签集合 |
| Sorted Set | 排行榜、权重排序 |
| Stream | 消息流、消费组 |

## 二、Redis 为什么快

常见原因：

- 数据主要放在内存里。
- 命令执行模型简单。
- 单条命令通常是原子执行。
- 提供适合业务场景的数据结构。

Redis 快不代表可以无节制使用。

需要注意：

- 内存比磁盘贵。
- 大 key 会影响性能。
- 慢命令会阻塞其他请求。
- 持久化和复制需要额外成本。

## 三、Redis 适合放什么

适合：

| 数据 | 示例 |
|------|------|
| 可重建缓存 | 用户详情缓存、文章详情缓存 |
| 临时数据 | 验证码、短信发送限制 |
| 高频计数 | 浏览量、点赞数 |
| 短期状态 | 登录态、临时 token |
| 排序数据 | 日榜、周榜 |

不适合：

| 数据 | 原因 |
|------|------|
| 超大对象 | 占内存，网络传输也慢 |
| 强一致核心数据 | Redis 常用于缓存，不应随意替代主库 |
| 没有过期策略的临时数据 | 容易长期占用内存 |
| 复杂关系查询 | 关系型数据库更适合 |

## 四、Redis 命令风格

Redis 命令通常是：

```text
COMMAND key arg1 arg2
```

示例：

```text
SET name Tom
GET name
DEL name
```

命令不区分大小写，但文档里通常大写，方便区分。

## 五、常用通用命令

| 命令 | 作用 |
|------|------|
| `EXISTS key` | 判断 key 是否存在 |
| `DEL key` | 删除 key |
| `TYPE key` | 查看 key 的类型 |
| `EXPIRE key seconds` | 设置过期时间 |
| `TTL key` | 查看剩余过期时间 |
| `KEYS pattern` | 查找 key，生产环境慎用 |
| `SCAN cursor` | 渐进式扫描 key |

示例：

```text
SET user:1:name Tom
EXISTS user:1:name
TYPE user:1:name
TTL user:1:name
DEL user:1:name
```

## 六、KEYS 和 SCAN

`KEYS *` 会一次性扫描所有 key。

```text
KEYS *
```

数据量大时会阻塞 Redis，不适合生产环境排查。

更推荐使用 `SCAN`：

```text
SCAN 0 MATCH user:* COUNT 100
```

`SCAN` 是渐进式扫描，每次返回一部分结果和下一次游标。
