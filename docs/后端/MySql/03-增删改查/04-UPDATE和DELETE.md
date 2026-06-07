# UPDATE 和 DELETE

`UPDATE` 用来修改数据，`DELETE` 用来删除数据。

这两个语句一定要谨慎，因为写错可能影响很多行。

## 一、UPDATE 修改数据

把用户 `tom` 的年龄改成 19：

```sql
UPDATE users
SET age = 19
WHERE username = 'tom';
```

结构：

```sql
UPDATE 表名
SET 字段 = 新值
WHERE 条件;
```

## 二、按主键修改最安全

推荐用主键定位要修改的数据：

```sql
UPDATE users
SET age = 19
WHERE id = 1;
```

主键是唯一的，可以保证只修改一行。

执行后查询确认：

```sql
SELECT id, username, age
FROM users
WHERE id = 1;
```

## 三、一次修改多个字段

```sql
UPDATE users
SET
    username = 'tom_new',
    age = 20,
    status = 'active'
WHERE id = 1;
```

多个字段用逗号分隔。

## 四、基于原值修改

文章浏览量加 1：

```sql
UPDATE posts
SET view_count = view_count + 1
WHERE id = 1;
```

这类写法很常见：

- 浏览量加 1
- 库存减 1
- 积分增加

## 五、不要忘记 WHERE

危险写法：

```sql
UPDATE users
SET status = 'disabled';
```

这会把整张 `users` 表所有用户都改成禁用。

修改前可以先用同样条件查询：

```sql
SELECT id, username, status
FROM users
WHERE id = 1;
```

确认结果正确后，再执行：

```sql
UPDATE users
SET status = 'disabled'
WHERE id = 1;
```

## 六、DELETE 删除数据

删除 ID 为 1 的评论：

```sql
DELETE FROM comments
WHERE id = 1;
```

结构：

```sql
DELETE FROM 表名
WHERE 条件;
```

同样建议按主键删除。

## 七、不要忘记 DELETE 的 WHERE

危险写法：

```sql
DELETE FROM users;
```

这会删除 `users` 表里的所有数据。

删除前先查询：

```sql
SELECT id, username
FROM users
WHERE id = 1;
```

确认后再删除：

```sql
DELETE FROM users
WHERE id = 1;
```

## 八、物理删除和逻辑删除

物理删除是真正删除数据：

```sql
DELETE FROM posts
WHERE id = 1;
```

逻辑删除是不删除行，只标记为已删除：

```sql
ALTER TABLE posts
ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0;
```

删除时执行：

```sql
UPDATE posts
SET is_deleted = 1
WHERE id = 1;
```

查询正常文章时过滤：

```sql
SELECT id, title
FROM posts
WHERE is_deleted = 0;
```

业务系统里经常使用逻辑删除，因为它方便恢复和审计。

## 九、清空表 TRUNCATE

`TRUNCATE` 会清空整张表：

```sql
TRUNCATE TABLE users;
```

它和 `DELETE FROM users` 都会清空数据，但使用时要非常谨慎。

本地练习时如果只是想重置练习数据，可以用它。真实环境执行前必须确认备份和影响范围。

## 十、安全操作习惯

执行 `UPDATE` / `DELETE` 前建议养成这些习惯：

1. 先写 `SELECT`，确认条件命中的数据。
2. 优先用主键作为条件。
3. 不确定影响范围时，先加 `LIMIT` 做小范围验证。
4. 重要数据修改前先备份。
5. 多步修改放进事务里，失败可以回滚。

示例：

```sql
-- 先确认要改哪一行
SELECT id, username, status
FROM users
WHERE id = 1;

-- 再执行修改
UPDATE users
SET status = 'disabled'
WHERE id = 1;
```
