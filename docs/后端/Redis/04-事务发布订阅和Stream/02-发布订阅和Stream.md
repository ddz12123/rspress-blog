# 发布订阅和 Stream

Redis 有两类常见消息能力：

- Pub/Sub：轻量发布订阅，消息不持久化。
- Stream：消息流，支持持久化、消费组和消息确认。

## 一、Pub/Sub 基本使用

订阅频道：

```text
SUBSCRIBE notice
```

另一个客户端发布消息：

```text
PUBLISH notice "hello redis"
```

订阅端会收到消息。

## 二、Pub/Sub 特点

| 特点 | 说明 |
|------|------|
| 实时 | 在线订阅者能收到消息 |
| 不持久化 | 没有订阅者时消息会丢失 |
| 没有确认机制 | 发送后不关心消费是否成功 |
| 使用简单 | 适合轻量通知 |

适合场景：

- 后台进程之间的简单通知
- WebSocket 节点广播消息
- 配置变更通知

不适合场景：

- 订单消息
- 支付回调处理
- 必须可靠消费的任务

可靠任务更适合 Stream 或专门的消息队列。

## 三、Stream 写入消息

写入一条消息：

```text
XADD stream:orders * order_id 10001 user_id 1 status created
```

`*` 表示由 Redis 自动生成消息 ID。

查看消息：

```text
XRANGE stream:orders - +
```

限制数量：

```text
XRANGE stream:orders - + COUNT 10
```

## 四、读取 Stream

从开头读取：

```text
XREAD COUNT 2 STREAMS stream:orders 0
```

阻塞读取新消息：

```text
XREAD BLOCK 5000 STREAMS stream:orders $
```

含义：

| 参数 | 说明 |
|------|------|
| `BLOCK 5000` | 最多阻塞 5000 毫秒 |
| `$` | 从最新消息之后开始读 |

## 五、消费组

创建消费组：

```text
XGROUP CREATE stream:orders order_workers 0 MKSTREAM
```

含义：

| 参数 | 说明 |
|------|------|
| `stream:orders` | Stream key |
| `order_workers` | 消费组名称 |
| `0` | 从头开始消费 |
| `MKSTREAM` | Stream 不存在时自动创建 |

消费者读取消息：

```text
XREADGROUP GROUP order_workers worker-1 COUNT 10 STREAMS stream:orders >
```

`>` 表示读取消费组里还没有投递过的新消息。

确认消息：

```text
XACK stream:orders order_workers 1700000000000-0
```

实际消息 ID 以 `XADD` 返回值为准。

## 六、查看待确认消息

```text
XPENDING stream:orders order_workers
```

待确认消息表示已经投递给消费者，但还没有 `XACK`。

如果消费者宕机，消息会留在 pending 列表里，需要由恢复逻辑处理。

## 七、Pub/Sub 和 Stream 选择

| 需求 | 选择 |
|------|------|
| 在线广播 | Pub/Sub |
| 消息允许丢失 | Pub/Sub |
| 需要保存消息 | Stream |
| 需要消费组 | Stream |
| 需要确认和重试 | Stream |
| 高级消息队列能力 | Kafka / RabbitMQ 等专门 MQ |

