# WHERE、排序和分页

这一节继续学习查询里的过滤、排序和分页。

## 一、准备文章表

先创建一张文章表：

```sql
CREATE TABLE posts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    view_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

插入几条数据：

```sql
INSERT INTO posts (user_id, title, content, status, view_count, created_at)
VALUES
    (1, 'MySQL 入门', '第一篇文章内容', 'published', 120, '2026-06-01 10:00:00'),
    (1, 'SQL 查询基础', '第二篇文章内容', 'published', 80, '2026-06-02 10:00:00'),
    (2, '索引是什么', '第三篇文章内容', 'draft', 0, '2026-06-03 10:00:00'),
    (2, '事务入门', '第四篇文章内容', 'published', 50, '2026-06-04 10:00:00'),
    (3, '备份和恢复', '第五篇文章内容', 'archived', 30, '2026-06-05 10:00:00');
```

## 二、按状态过滤

查询已发布文章：

```sql
SELECT id, title, status, view_count, created_at
FROM posts
WHERE status = 'published';
```

查询某个用户的已发布文章：

```sql
SELECT id, title, status, view_count, created_at
FROM posts
WHERE user_id = 1 AND status = 'published';
```

## 三、排序 ORDER BY

按创建时间从新到旧：

```sql
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC;
```

按浏览量从高到低：

```sql
SELECT id, title, view_count
FROM posts
ORDER BY view_count DESC;
```

排序方向：

| 写法 | 含义 |
|------|------|
| `ASC` | 升序，从小到大，默认值 |
| `DESC` | 降序，从大到小 |

## 四、多字段排序

先按状态排序，再按创建时间从新到旧：

```sql
SELECT id, title, status, created_at
FROM posts
ORDER BY status ASC, created_at DESC;
```

多字段排序的含义：

1. 先按第一个字段排序。
2. 第一个字段相同，再按第二个字段排序。
3. 继续类推。

## 五、限制返回数量 LIMIT

查询浏览量最高的 3 篇文章：

```sql
SELECT id, title, view_count
FROM posts
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 3;
```

`LIMIT 3` 表示最多返回 3 行。

## 六、分页查询

最常见的分页写法：

```sql
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

含义：

| 部分 | 含义 |
|------|------|
| `LIMIT 10` | 每页 10 条 |
| `OFFSET 0` | 跳过 0 条，从第 1 条开始 |

第 1 页：

```sql
LIMIT 10 OFFSET 0
```

第 2 页：

```sql
LIMIT 10 OFFSET 10
```

第 3 页：

```sql
LIMIT 10 OFFSET 20
```

公式：

```text
OFFSET = (page - 1) * page_size
```

## 七、分页必须配合稳定排序

分页时建议一定写 `ORDER BY`。

不推荐：

```sql
SELECT id, title
FROM posts
LIMIT 10 OFFSET 0;
```

因为没有排序时，数据库不保证每次返回顺序都符合业务预期。

推荐：

```sql
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 10 OFFSET 0;
```

加上 `id DESC` 可以让创建时间相同的数据也有稳定顺序。

## 八、统计总数 COUNT

分页接口通常还要返回总条数：

```sql
SELECT COUNT(*) AS total
FROM posts
WHERE status = 'published';
```

列表数据和总数一般是两条 SQL：

```sql
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC, id DESC
LIMIT 10 OFFSET 0;

SELECT COUNT(*) AS total
FROM posts
WHERE status = 'published';
```

## 九、查询顺序怎么写

常见查询语句顺序：

```sql
SELECT 字段
FROM 表
WHERE 条件
ORDER BY 排序
LIMIT 数量 OFFSET 偏移;
```

示例：

```sql
SELECT id, title, view_count, created_at
FROM posts
WHERE status = 'published' AND view_count >= 50
ORDER BY view_count DESC, id DESC
LIMIT 10 OFFSET 0;
```

先按这个顺序写，后面再学习更复杂的 `GROUP BY` 和 `JOIN`。
