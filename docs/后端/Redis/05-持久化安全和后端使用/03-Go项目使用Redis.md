# Go 项目使用 Redis

Go 后端常用 `github.com/redis/go-redis/v9` 连接 Redis。

这一篇记录连接、读写、过期时间、缓存封装和简单锁的写法。

## 一、安装依赖

```bash
go get github.com/redis/go-redis/v9
```

## 二、创建客户端

```go
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	defer rdb.Close()

	if err := rdb.Ping(ctx).Err(); err != nil {
		panic(err)
	}

	fmt.Println("redis connected")
}
```

常用配置：

| 配置 | 说明 |
|------|------|
| `Addr` | Redis 地址 |
| `Password` | 密码，没有密码则为空字符串 |
| `DB` | 数据库编号 |
| `PoolSize` | 连接池大小 |
| `MinIdleConns` | 最小空闲连接数 |

## 三、String 读写

```go
ctx := context.Background()

err := rdb.Set(ctx, "user:1:name", "Tom", 30*time.Minute).Err()
if err != nil {
	return err
}

name, err := rdb.Get(ctx, "user:1:name").Result()
if err == redis.Nil {
	// key 不存在
	return nil
}
if err != nil {
	return err
}

fmt.Println(name)
```

过期时间传 `0` 表示不设置 TTL：

```go
err := rdb.Set(ctx, "site:name", "blog", 0).Err()
```

## 四、缓存 JSON

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type UserProfile struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func SetUserProfile(ctx context.Context, rdb *redis.Client, user UserProfile) error {
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("user:%d:profile", user.ID)
	return rdb.Set(ctx, key, data, 30*time.Minute).Err()
}

func GetUserProfile(ctx context.Context, rdb *redis.Client, id int64) (*UserProfile, error) {
	key := fmt.Sprintf("user:%d:profile", id)

	data, err := rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var user UserProfile
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, err
	}

	return &user, nil
}
```

实际项目里应把数据库查询放在缓存未命中之后。

## 五、Hash 读写

```go
err := rdb.HSet(ctx, "user:1", map[string]any{
	"name": "Tom",
	"age":  18,
	"city": "Beijing",
}).Err()
if err != nil {
	return err
}

name, err := rdb.HGet(ctx, "user:1", "name").Result()
if err != nil {
	return err
}

values, err := rdb.HGetAll(ctx, "user:1").Result()
if err != nil {
	return err
}

fmt.Println(name, values)
```

Hash key 设置过期时间：

```go
err := rdb.Expire(ctx, "user:1", 30*time.Minute).Err()
```

## 六、计数器

```go
count, err := rdb.Incr(ctx, "article:100:view_count").Result()
if err != nil {
	return err
}

fmt.Println(count)
```

一次增加指定数量：

```go
count, err := rdb.IncrBy(ctx, "article:100:view_count", 10).Result()
```

## 七、简单分布式锁

加锁：

```go
lockKey := "lock:order:10001"
requestID := "request-123"

ok, err := rdb.SetNX(ctx, lockKey, requestID, 30*time.Second).Result()
if err != nil {
	return err
}
if !ok {
	return errors.New("lock already exists")
}
```

释放锁必须判断 value：

```go
script := redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
else
	return 0
end
`)

_, err = script.Run(ctx, rdb, []string{lockKey}, requestID).Result()
if err != nil {
	return err
}
```

上面代码需要导入 `errors`。

注意：这只是简单锁写法。复杂场景需要考虑锁续期、业务执行超时、主从切换等问题。

## 八、连接池配置

```go
rdb := redis.NewClient(&redis.Options{
	Addr:         "localhost:6379",
	Password:     "",
	DB:           0,
	PoolSize:     20,
	MinIdleConns: 5,
})
```

建议：

| 配置 | 说明 |
|------|------|
| `PoolSize` | 根据并发量和 Redis 能力设置 |
| `MinIdleConns` | 保留少量空闲连接 |
| `ReadTimeout` | 设置读超时 |
| `WriteTimeout` | 设置写超时 |

不要每次请求都创建新的 Redis client。项目启动时创建一次，作为共享依赖传入业务代码。

## 九、缓存查询流程

```go
func GetArticleDetail(ctx context.Context, rdb *redis.Client, id int64) (*Article, error) {
	key := fmt.Sprintf("article:%d:detail", id)

	data, err := rdb.Get(ctx, key).Bytes()
	if err == nil {
		if string(data) == "__NULL__" {
			return nil, nil
		}

		var article Article
		if err := json.Unmarshal(data, &article); err != nil {
			return nil, err
		}
		return &article, nil
	}
	if err != redis.Nil {
		return nil, err
	}

	article, err := QueryArticleFromDB(ctx, id)
	if err != nil {
		return nil, err
	}
	if article == nil {
		_ = rdb.Set(ctx, key, "__NULL__", time.Minute).Err()
		return nil, nil
	}

	cacheData, err := json.Marshal(article)
	if err != nil {
		return nil, err
	}

	_ = rdb.Set(ctx, key, cacheData, 30*time.Minute).Err()
	return article, nil
}
```

这里的 `Article` 和 `QueryArticleFromDB` 是业务代码里的类型和函数。缓存写入失败不一定要让主流程失败，具体取决于业务要求。
