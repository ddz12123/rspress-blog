# Hash 对象

Hash 适合保存对象结构，一个 key 下面有多个 field。

示例：

```text
user:1
  name -> Tom
  age  -> 18
  city -> Beijing
```

Hash 常用于用户资料、商品信息、配置项等字段型数据。

## 一、写入字段

```text
HSET user:1 name Tom age 18 city Beijing
```

读取单个字段：

```text
HGET user:1 name
```

读取多个字段：

```text
HMGET user:1 name age
```

读取全部字段：

```text
HGETALL user:1
```

`HGETALL` 会返回 field 和 value 交替出现的列表。

## 二、修改字段

Hash 的字段可以单独修改：

```text
HSET user:1 city Shanghai
HGET user:1 city
```

删除字段：

```text
HDEL user:1 city
```

判断字段是否存在：

```text
HEXISTS user:1 name
```

查看字段数量：

```text
HLEN user:1
```

## 三、数字字段自增

```text
HSET article:100 title "Redis 入门" view_count 0
HINCRBY article:100 view_count 1
HINCRBY article:100 view_count 10
HGET article:100 view_count
```

小数自增使用 `HINCRBYFLOAT`：

```text
HSET product:1 price 99.9
HINCRBYFLOAT product:1 price 10.1
```

## 四、Hash 和 String JSON 的区别

| 对比 | String JSON | Hash |
|------|-------------|------|
| 读整个对象 | 方便 | 需要 `HGETALL` |
| 改单个字段 | 需要整体反序列化后重写 | 直接 `HSET` |
| 字段级计数 | 不方便 | `HINCRBY` |
| 保存复杂嵌套对象 | 更方便 | 不适合复杂嵌套 |

选择方式：

| 场景 | 选择 |
|------|------|
| 只缓存接口返回结果 | String JSON |
| 对象字段经常单独修改 | Hash |
| 需要对对象里的计数字段自增 | Hash |
| 数据结构层级很深 | String JSON |

## 五、用户资料示例

写入用户资料：

```text
HSET user:1 profile_name Tom profile_age 18 profile_city Beijing
EXPIRE user:1 1800
```

读取用户资料：

```text
HGETALL user:1
```

修改城市：

```text
HSET user:1 profile_city Shanghai
```

给用户经验值加 10：

```text
HSET user:1 exp 0
HINCRBY user:1 exp 10
```

## 六、使用注意

| 注意 | 说明 |
|------|------|
| 过期时间设置在整个 Hash key 上 | 不能给单个 field 单独设置 TTL |
| field 不宜无限增长 | field 过多会变成大 key |
| 不适合复杂查询 | Redis 不会像 SQL 一样按 field 查询 |

如果需要按 `city`、`age` 等条件筛选用户，应该使用数据库或搜索系统，不能把 Redis Hash 当成关系型表来查。

