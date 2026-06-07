# 认识 MySQL 和数据库

MySQL 是一个关系型数据库管理系统。

简单理解：

```text
前端页面 / 后端服务 / 管理工具
        ↓ 发送 SQL
MySQL 数据库
        ↓ 保存、查询、修改数据
返回结果
```

它适合保存这些结构化数据：

- 用户账号
- 商品信息
- 订单记录
- 博客文章
- 评论数据
- 后台管理系统配置

## 一、为什么不用普通文件保存数据

假设用一个 `users.txt` 文件保存用户：

```text
1,Tom,tom@example.com
2,Jack,jack@example.com
```

刚开始看起来可以，但业务一复杂就会遇到问题：

| 需求 | 普通文件的问题 |
------|----------------|
| 根据邮箱快速查用户 | 需要自己写搜索逻辑 |
| 防止两个用户邮箱重复 | 需要自己检查并处理并发 |
| 用户和文章关联 | 文件之间关系难维护 |
| 批量修改数据 | 容易写错，缺少回滚能力 |
| 多个人同时访问 | 容易出现数据覆盖 |

数据库就是专门解决这些问题的工具。

## 二、关系型数据库是什么

关系型数据库把数据放在一张张表里。

用户表可以这样理解：

| id | username | email |
|----|----------|-------|
| 1 | tom | tom@example.com |
| 2 | jack | jack@example.com |

文章表可以这样理解：

| id | user_id | title |
|----|---------|-------|
| 1 | 1 | MySQL 入门 |
| 2 | 1 | SQL 查询基础 |

这里的 `posts.user_id = users.id` 表示文章属于哪个用户。

这就是“关系”的意思：一张表的数据可以和另一张表的数据建立关联。

## 三、数据库、表、字段、记录

先记住这几个词：

| 名称 | 类比 Excel | 示例 |
|------|------------|------|
| 数据库 | 一个工作簿 | `mysql_tutorial` |
| 表 | 一个工作表 | `users` |
| 字段 | 一列 | `username` |
| 记录 | 一行 | 一个用户的数据 |

创建数据库：

```sql
CREATE DATABASE mysql_tutorial;
```

创建表：

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);
```

插入一条记录：

```sql
INSERT INTO users (username, email)
VALUES ('tom', 'tom@example.com');
```

查询记录：

```sql
SELECT id, username, email
FROM users;
```

## 四、SQL 是什么

SQL 是操作关系型数据库的语言。

常见 SQL 可以分成几类：

| 类型 | 常用语句 | 作用 |
|------|----------|------|
| 定义结构 | `CREATE`、`ALTER`、`DROP` | 创建、修改、删除库表结构 |
| 操作数据 | `INSERT`、`UPDATE`、`DELETE` | 新增、修改、删除数据 |
| 查询数据 | `SELECT` | 查询数据 |
| 控制事务 | `START TRANSACTION`、`COMMIT`、`ROLLBACK` | 控制一组 SQL 的提交和回滚 |
| 管理权限 | `CREATE USER`、`GRANT`、`REVOKE` | 创建用户和授权 |

本地练习时最常用的是：

```sql
SELECT
INSERT
UPDATE
DELETE
CREATE TABLE
```

## 五、MySQL 在后端里的位置

一个常见 Web 项目大概是这样：

```text
浏览器
  ↓ HTTP 请求
后端接口
  ↓ SQL
MySQL
  ↓ 查询结果
后端接口
  ↓ JSON 响应
浏览器
```

后端代码不会直接把所有数据放在内存里，而是通过 SQL 把数据保存到 MySQL。

例如用户注册时，后端可能执行：

```sql
INSERT INTO users (username, email, password_hash)
VALUES ('tom', 'tom@example.com', '加密后的密码');
```

用户登录时，后端可能执行：

```sql
SELECT id, username, password_hash
FROM users
WHERE email = 'tom@example.com';
```

## 六、先记住一个原则

数据库不是只会“存数据”的地方，它还负责：

- 保证数据结构清晰
- 保证关键数据不重复
- 保证多条操作的一致性
- 帮助快速查询
- 管理不同账号的权限

后面每一章都会围绕这些能力展开。
