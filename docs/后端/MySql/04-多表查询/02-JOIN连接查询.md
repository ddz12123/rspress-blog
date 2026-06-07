# JOIN 连接查询

`JOIN` 用来把多张表的数据关联起来查询。

例如文章表只有 `user_id`，如果想显示作者名，就需要连接 `users` 表。

## 一、没有 JOIN 时的问题

文章表：

| id | user_id | title |
|----|---------|-------|
| 1 | 1 | MySQL 入门 |

用户表：

| id | username |
|----|----------|
| 1 | tom |

如果只查文章表：

```sql
SELECT id, user_id, title
FROM posts;
```

只能看到 `user_id`，看不到用户名。

## 二、INNER JOIN

查询文章和作者：

```sql
SELECT
    p.id,
    p.title,
    u.username AS author_name
FROM posts AS p
INNER JOIN users AS u ON p.user_id = u.id;
```

含义：

| 部分 | 含义 |
|------|------|
| `posts AS p` | 把 `posts` 表起别名为 `p` |
| `users AS u` | 把 `users` 表起别名为 `u` |
| `ON p.user_id = u.id` | 连接条件 |

`INNER JOIN` 只返回两边都能匹配上的数据。

## 三、为什么要用表别名

不使用别名也可以：

```sql
SELECT posts.id, posts.title, users.username
FROM posts
INNER JOIN users ON posts.user_id = users.id;
```

但表多了以后会很长。

推荐写：

```sql
SELECT p.id, p.title, u.username
FROM posts AS p
INNER JOIN users AS u ON p.user_id = u.id;
```

别名简短，SQL 更清楚。

## 四、连接三张表

查询文章、作者、分类：

```sql
SELECT
    p.id,
    p.title,
    u.username AS author_name,
    c.name AS category_name,
    p.created_at
FROM posts AS p
INNER JOIN users AS u ON p.user_id = u.id
INNER JOIN categories AS c ON p.category_id = c.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC;
```

结果会包含：

- 文章标题
- 作者名
- 分类名
- 创建时间

## 五、LEFT JOIN

`LEFT JOIN` 会保留左表数据，即使右表没有匹配数据。

查询文章和评论：

```sql
SELECT
    p.id,
    p.title,
    cm.id AS comment_id,
    cm.content AS comment_content
FROM posts AS p
LEFT JOIN comments AS cm ON p.id = cm.post_id
ORDER BY p.id ASC, cm.id ASC;
```

如果某篇文章没有评论：

- 文章仍然会出现。
- 评论字段显示为 `NULL`。

## 六、INNER JOIN 和 LEFT JOIN 的区别

| 类型 | 结果 |
|------|------|
| `INNER JOIN` | 只保留两边都匹配的数据 |
| `LEFT JOIN` | 保留左表所有数据，右表没有匹配时补 `NULL` |

常见选择：

| 场景 | 推荐 |
|------|------|
| 文章必须有作者 | `INNER JOIN users` |
| 文章可能没有评论，但仍要显示文章 | `LEFT JOIN comments` |
| 分类可能为空，但仍要显示文章 | `LEFT JOIN categories` |

## 七、多对多 JOIN

查询文章和标签：

```sql
SELECT
    p.id,
    p.title,
    t.name AS tag_name
FROM posts AS p
INNER JOIN post_tags AS pt ON p.id = pt.post_id
INNER JOIN tags AS t ON pt.tag_id = t.id
ORDER BY p.id ASC, t.id ASC;
```

关系链路：

```text
posts.id -> post_tags.post_id
post_tags.tag_id -> tags.id
```

如果一篇文章有两个标签，结果里这篇文章会出现两行。

## 八、给查询结果去重 DISTINCT

查询有标签的文章 ID：

```sql
SELECT DISTINCT p.id, p.title
FROM posts AS p
INNER JOIN post_tags AS pt ON p.id = pt.post_id;
```

`DISTINCT` 会去掉完全重复的结果行。

注意：`DISTINCT` 是对整行结果去重，不是只对某一个字段去重。

## 九、常见错误：忘记 ON 条件

错误示例：

```sql
SELECT p.id, p.title, u.username
FROM posts AS p
INNER JOIN users AS u;
```

缺少 `ON p.user_id = u.id` 会导致结果异常，可能产生大量无意义组合。

正确写法：

```sql
SELECT p.id, p.title, u.username
FROM posts AS p
INNER JOIN users AS u ON p.user_id = u.id;
```

## 十、JOIN 查询模板

```sql
SELECT
    主表字段,
    关联表字段
FROM 主表 AS a
INNER JOIN 关联表 AS b ON a.外键 = b.主键
WHERE 条件
ORDER BY 排序;
```

博客文章列表常用模板：

```sql
SELECT
    p.id,
    p.title,
    u.username AS author_name,
    c.name AS category_name,
    p.view_count,
    p.created_at
FROM posts AS p
INNER JOIN users AS u ON p.user_id = u.id
INNER JOIN categories AS c ON p.category_id = c.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC, p.id DESC
LIMIT 10 OFFSET 0;
```
