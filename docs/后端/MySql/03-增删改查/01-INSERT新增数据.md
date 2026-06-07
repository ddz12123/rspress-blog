# INSERT 新增数据

`INSERT` 用来往表里新增数据。

这一节继续使用 `users` 表：

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    age TINYINT UNSIGNED NULL,
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 一、插入一条数据

```sql
INSERT INTO users (username, email, age)
VALUES ('tom', 'tom@example.com', 18);
```

结构：

```sql
INSERT INTO 表名 (字段1, 字段2, 字段3)
VALUES (值1, 值2, 值3);
```

字段和值要一一对应：

```text
username -> 'tom'
email    -> 'tom@example.com'
age      -> 18
```

## 二、为什么建议写字段名

MySQL 允许这样写：

```sql
INSERT INTO users
VALUES (NULL, 'tom', 'tom@example.com', 18, 'active', NOW());
```

但不建议这样写。

原因：

- 必须记住表里所有字段顺序。
- 表结构变化后容易插错。
- 可读性差。

推荐始终写字段名：

```sql
INSERT INTO users (username, email, age)
VALUES ('tom', 'tom@example.com', 18);
```

## 三、插入多条数据

```sql
INSERT INTO users (username, email, age)
VALUES
    ('jack', 'jack@example.com', 20),
    ('lucy', 'lucy@example.com', 22),
    ('lily', 'lily@example.com', NULL);
```

一条 `INSERT` 可以插入多行，适合导入少量初始数据。

## 四、省略有默认值的字段

`id` 是自增主键，可以省略。

`status` 有默认值，也可以省略：

```sql
status ENUM('active', 'disabled') NOT NULL DEFAULT 'active'
```

`created_at` 有默认当前时间，也可以省略：

```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
```

所以这条 SQL 是合法的：

```sql
INSERT INTO users (username, email)
VALUES ('rose', 'rose@example.com');
```

查询：

```sql
SELECT id, username, email, status, created_at
FROM users
WHERE username = 'rose';
```

可以看到 `status` 和 `created_at` 自动生成了值。

## 五、插入 NULL

如果字段允许为空，可以插入 `NULL`：

```sql
INSERT INTO users (username, email, age)
VALUES ('no_age_user', 'no_age@example.com', NULL);
```

注意：

- `NULL` 表示没有值，不是空字符串。
- `NULL` 不等于 `0`。
- `NULL` 不等于 `''`。

如果字段是 `NOT NULL`，插入 `NULL` 会报错。

## 六、字符串要用单引号

字符串和日期时间通常用单引号包起来：

```sql
INSERT INTO users (username, email, age)
VALUES ('tom', 'tom@example.com', 18);
```

数字不用单引号：

```sql
18
```

本地练习时建议：

- SQL 关键字大写。
- 字符串使用单引号。
- 字段名不用引号。

## 七、查看刚插入的数据

```sql
SELECT id, username, email, age, status, created_at
FROM users
ORDER BY id DESC;
```

`ORDER BY id DESC` 表示按 `id` 从大到小排序，新插入的数据通常排在前面。

## 八、获取自增 ID

插入一条数据后，可以查询本次连接最近生成的自增 ID：

```sql
SELECT LAST_INSERT_ID();
```

例如：

```sql
INSERT INTO users (username, email)
VALUES ('new_user', 'new_user@example.com');

SELECT LAST_INSERT_ID();
```

后端创建数据后，经常需要拿到这个 ID，用于继续创建关联数据。

## 九、唯一约束冲突

如果 `email` 有唯一约束：

```sql
email VARCHAR(100) NOT NULL UNIQUE
```

重复插入相同邮箱会失败：

```sql
INSERT INTO users (username, email)
VALUES ('tom2', 'tom@example.com');
```

常见报错类似：

```text
Duplicate entry 'tom@example.com' for key
```

这说明唯一约束生效了。

## 十、练习

向 `users` 表插入 3 个用户：

| username | email | age |
|----------|-------|-----|
| `alice` | `alice@example.com` | 19 |
| `bob` | `bob@example.com` | 21 |
| `cindy` | `cindy@example.com` | 空 |

参考 SQL：

```sql
INSERT INTO users (username, email, age)
VALUES
    ('alice', 'alice@example.com', 19),
    ('bob', 'bob@example.com', 21),
    ('cindy', 'cindy@example.com', NULL);
```
