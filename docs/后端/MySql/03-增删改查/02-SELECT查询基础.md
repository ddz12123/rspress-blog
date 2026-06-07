# SELECT 查询基础

`SELECT` 用来查询数据，是最常用的 SQL。

## 一、查询所有字段

```sql
SELECT *
FROM users;
```

`*` 表示查询所有字段。

本地练习时可以用 `*` 快速查看数据，但真实项目里更推荐明确写字段：

```sql
SELECT id, username, email, status
FROM users;
```

原因：

- 返回字段更明确。
- 减少不必要的数据传输。
- 避免把密码哈希、内部字段等敏感信息查出来。

## 二、查询指定字段

```sql
SELECT id, username, email
FROM users;
```

结果只包含这三个字段。

字段顺序由 `SELECT` 后面的顺序决定：

```sql
SELECT email, username, id
FROM users;
```

## 三、给字段起别名

使用 `AS` 可以给查询结果起别名：

```sql
SELECT
    id AS user_id,
    username AS name,
    email
FROM users;
```

结果列名会显示为：

```text
user_id | name | email
```

`AS` 可以省略，但建议保留，读起来更清楚。

## 四、使用 WHERE 过滤

查询 ID 为 1 的用户：

```sql
SELECT id, username, email
FROM users
WHERE id = 1;
```

查询启用状态的用户：

```sql
SELECT id, username, email
FROM users
WHERE status = 'active';
```

`WHERE` 表示只要满足条件的数据。

## 五、常见比较运算符

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `=` | 等于 | `id = 1` |
| `<>` 或 `!=` | 不等于 | `status <> 'disabled'` |
| `>` | 大于 | `age > 18` |
| `>=` | 大于等于 | `age >= 18` |
| `<` | 小于 | `age < 60` |
| `<=` | 小于等于 | `age <= 60` |

示例：

```sql
SELECT id, username, age
FROM users
WHERE age >= 18;
```

## 六、多个条件 AND / OR

同时满足多个条件：

```sql
SELECT id, username, age, status
FROM users
WHERE status = 'active' AND age >= 18;
```

满足任意一个条件：

```sql
SELECT id, username, age
FROM users
WHERE age < 18 OR age > 60;
```

复杂条件建议加括号：

```sql
SELECT id, username, age, status
FROM users
WHERE status = 'active' AND (age < 18 OR age > 60);
```

括号能让条件优先级更清楚。

## 七、范围查询 BETWEEN

查询年龄在 18 到 30 之间的用户：

```sql
SELECT id, username, age
FROM users
WHERE age BETWEEN 18 AND 30;
```

`BETWEEN 18 AND 30` 包含 18 和 30。

等价于：

```sql
WHERE age >= 18 AND age <= 30
```

## 八、集合查询 IN

查询多个指定状态：

```sql
SELECT id, username, status
FROM users
WHERE status IN ('active', 'disabled');
```

查询指定 ID：

```sql
SELECT id, username, email
FROM users
WHERE id IN (1, 2, 3);
```

`IN` 比多个 `OR` 更清晰。

## 九、模糊查询 LIKE

查询用户名以 `a` 开头的用户：

```sql
SELECT id, username
FROM users
WHERE username LIKE 'a%';
```

常见通配符：

| 通配符 | 含义 |
|--------|------|
| `%` | 任意长度任意字符 |
| `_` | 一个任意字符 |

示例：

```sql
-- 包含 tom
SELECT id, username
FROM users
WHERE username LIKE '%tom%';

-- 只有 3 个字符，并且以 t 开头
SELECT id, username
FROM users
WHERE username LIKE 't__';
```

注意：`LIKE '%关键字%'` 在数据量大时可能比较慢，后面索引章节会解释原因。

## 十、判断 NULL

查询年龄为空的用户：

```sql
SELECT id, username, age
FROM users
WHERE age IS NULL;
```

查询年龄不为空的用户：

```sql
SELECT id, username, age
FROM users
WHERE age IS NOT NULL;
```

不要写：

```sql
WHERE age = NULL
```

在 SQL 里，判断 `NULL` 要用 `IS NULL` 或 `IS NOT NULL`。
