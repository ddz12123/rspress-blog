# List 和 Set

List 是有顺序的列表，允许重复元素。

Set 是无序集合，不允许重复元素。

这两个类型经常用于队列、最新列表、标签集合、点赞去重等场景。

## 一、List 基本命令

从左侧插入：

```text
LPUSH notice:list msg1
LPUSH notice:list msg2
```

从右侧插入：

```text
RPUSH notice:list msg3
```

查看范围：

```text
LRANGE notice:list 0 -1
```

从左侧弹出：

```text
LPOP notice:list
```

从右侧弹出：

```text
RPOP notice:list
```

查看长度：

```text
LLEN notice:list
```

## 二、List 做队列

生产者从右侧写入：

```text
RPUSH queue:email "send email to user 1"
RPUSH queue:email "send email to user 2"
```

消费者从左侧取出：

```text
LPOP queue:email
```

如果队列为空，`LPOP` 会立刻返回空。阻塞读取可以使用 `BLPOP`：

```text
BLPOP queue:email 5
```

含义：

| 参数 | 说明 |
|------|------|
| `queue:email` | 队列 key |
| `5` | 最多阻塞 5 秒 |

List 可以做简单队列，但复杂消息确认、重试和消费组更适合使用 Stream 或专门的消息队列。

## 三、List 做最新列表

保存最新 5 条文章 ID：

```text
LPUSH article:latest 1005
LPUSH article:latest 1004
LPUSH article:latest 1003
LPUSH article:latest 1002
LPUSH article:latest 1001
LTRIM article:latest 0 4
LRANGE article:latest 0 -1
```

`LTRIM` 用于保留指定范围，避免列表无限增长。

## 四、Set 基本命令

添加元素：

```text
SADD article:100:tags redis mysql backend
```

查看全部元素：

```text
SMEMBERS article:100:tags
```

判断元素是否存在：

```text
SISMEMBER article:100:tags redis
```

删除元素：

```text
SREM article:100:tags mysql
```

查看数量：

```text
SCARD article:100:tags
```

## 五、Set 做去重

记录哪些用户点赞了文章：

```text
SADD article:100:liked_users 1
SADD article:100:liked_users 2
SADD article:100:liked_users 1
SCARD article:100:liked_users
```

同一个用户 ID 重复添加不会产生重复数据。

判断用户是否点过赞：

```text
SISMEMBER article:100:liked_users 1
```

## 六、集合运算

准备数据：

```text
SADD user:1:tags redis mysql go
SADD user:2:tags redis docker linux
```

交集：

```text
SINTER user:1:tags user:2:tags
```

并集：

```text
SUNION user:1:tags user:2:tags
```

差集：

```text
SDIFF user:1:tags user:2:tags
```

常见场景：

| 命令 | 场景 |
|------|------|
| `SINTER` | 共同关注、共同标签 |
| `SUNION` | 汇总多个集合 |
| `SDIFF` | A 有但 B 没有的数据 |

## 七、选择 List 还是 Set

| 需求 | 类型 |
|------|------|
| 保留顺序 | List |
| 允许重复 | List |
| 队列 | List / Stream |
| 去重 | Set |
| 判断是否存在 | Set |
| 集合交并差 | Set |

