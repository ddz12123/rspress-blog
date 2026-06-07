# insert 新增数据

MongoDB 新增文档常用：

- `insertOne`
- `insertMany`

## 一、新增一条文档

```javascript
use mongodb_tutorial

db.users.insertOne({
  username: "zhangsan",
  email: "zhangsan@example.com",
  age: 18,
  status: "active",
  createdAt: new Date()
})
```

成功后会返回类似：

```javascript
{
  acknowledged: true,
  insertedId: ObjectId("...")
}
```

`insertedId` 就是新文档的 `_id`。

## 二、新增多条文档

```javascript
db.users.insertMany([
  {
    username: "lisi",
    email: "lisi@example.com",
    age: 20,
    status: "active",
    createdAt: new Date()
  },
  {
    username: "wangwu",
    email: "wangwu@example.com",
    age: 25,
    status: "disabled",
    createdAt: new Date()
  }
])
```

查询：

```javascript
db.users.find()
```

## 三、手动指定 _id

通常不需要手动指定 `_id`，MongoDB 会自动生成。

但有些场景可以自己指定：

```javascript
db.users.insertOne({
  _id: "user_1001",
  username: "custom_id_user"
})
```

注意：`_id` 必须唯一。

如果重复插入相同 `_id`，会报 duplicate key 错误。

## 四、插入嵌套文档

```javascript
db.posts.insertOne({
  title: "MongoDB 入门",
  content: "文档数据库基础",
  author: {
    id: ObjectId("665f0e0b6f8c2b5f8e123456"),
    username: "zhangsan"
  },
  tags: ["mongodb", "database"],
  stats: {
    views: 0,
    likes: 0
  },
  createdAt: new Date()
})
```

这就是 MongoDB 比关系型数据库更灵活的地方。

## 五、常见错误

### 1. 字段命名不统一

```javascript
{ createdAt: new Date() }
{ created_at: new Date() }
```

同一个项目里不要混用。

### 2. 时间用字符串保存

不推荐：

```javascript
{ createdAt: "2026-06-07 12:00:00" }
```

推荐：

```javascript
{ createdAt: new Date() }
```

日期类型更适合排序和范围查询。

### 3. 插入前不考虑索引

如果后面经常按 `email` 查用户，应该考虑给 `email` 建唯一索引。

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
```

索引章节会详细讲。

