# Sorted Set 排行榜

Sorted Set 也叫 ZSet。它和 Set 一样不允许重复 member，但每个 member 会带一个 score。

Redis 会按 score 排序，所以 Sorted Set 很适合排行榜、权重排序、延迟任务时间轴等场景。

## 一、基本写入

```text
ZADD rank:article:daily 100 article:1
ZADD rank:article:daily 80 article:2
ZADD rank:article:daily 120 article:3
```

一次写入多个：

```text
ZADD rank:article:daily 90 article:4 70 article:5
```

格式：

```text
ZADD key score member
```

## 二、按分数从低到高查询

```text
ZRANGE rank:article:daily 0 -1 WITHSCORES
```

返回所有成员和分数，分数从低到高排列。

查询前 3 个：

```text
ZRANGE rank:article:daily 0 2 WITHSCORES
```

## 三、按分数从高到低查询

Redis 6.2 之后推荐使用 `ZRANGE ... REV`：

```text
ZRANGE rank:article:daily 0 2 REV WITHSCORES
```

旧命令 `ZREVRANGE` 也能查询倒序排行榜：

```text
ZREVRANGE rank:article:daily 0 2 WITHSCORES
```

后端排行榜通常使用倒序，因为分数越高排名越靠前。

## 四、增加分数

文章浏览量增加后同步排行榜分数：

```text
ZINCRBY rank:article:daily 1 article:1
ZINCRBY rank:article:daily 10 article:2
```

`ZINCRBY` 返回增加后的新分数。

## 五、查询排名

从低到高的排名：

```text
ZRANK rank:article:daily article:1
```

从高到低的排名：

```text
ZREVRANK rank:article:daily article:1
```

排名从 `0` 开始。展示给页面时通常加 1。

## 六、删除成员

```text
ZREM rank:article:daily article:5
```

删除指定分数范围：

```text
ZREMRANGEBYSCORE rank:article:daily 0 10
```

## 七、按分数区间查询

查询分数在 80 到 120 之间的文章：

```text
ZRANGEBYSCORE rank:article:daily 80 120 WITHSCORES
```

查询大于 100 的文章：

```text
ZRANGEBYSCORE rank:article:daily (100 +inf WITHSCORES
```

`(` 表示不包含边界值。

## 八、排行榜示例

日榜 key：

```text
rank:article:daily:2026-06-07
```

文章被浏览时：

```text
ZINCRBY rank:article:daily:2026-06-07 1 article:100
```

查询前 10：

```text
ZRANGE rank:article:daily:2026-06-07 0 9 REV WITHSCORES
```

设置过期时间：

```text
EXPIRE rank:article:daily:2026-06-07 604800
```

日榜只需要保留一段时间，设置 TTL 可以避免历史榜单长期占用内存。

