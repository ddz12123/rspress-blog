# update 和 delete

本节学习修改和删除文档。

常用方法：

- `updateOne`
- `updateMany`
- `deleteOne`
- `deleteMany`

## 一、修改一条数据

```javascript
db.users.updateOne(
  { username: "zhangsan" },
  {
    $set: {
      age: 20,
      updatedAt: new Date()
    }
  }
)
```

第一个参数是查询条件。

第二个参数是更新内容。

## 二、$set

`$set` 表示设置字段值。

```javascript
db.users.updateOne(
  { username: "zhangsan" },
  {
    $set: {
      status: "disabled"
    }
  }
)
```

如果字段不存在，`$set` 会创建这个字段。

## 三、$inc

`$inc` 表示数字递增。

```javascript
db.posts.updateOne(
  { title: "MongoDB 入门" },
  {
    $inc: {
      "stats.views": 1
    }
  }
)
```

适合浏览量、点赞数这类计数。

## 四、更新数组

给标签数组添加一个值：

```javascript
db.posts.updateOne(
  { title: "MongoDB 入门" },
  {
    $addToSet: {
      tags: "backend"
    }
  }
)
```

`$addToSet` 会避免重复添加。

如果允许重复，可以用 `$push`：

```javascript
db.posts.updateOne(
  { title: "MongoDB 入门" },
  {
    $push: {
      tags: "backend"
    }
  }
)
```

## 五、批量修改

```javascript
db.users.updateMany(
  { status: "pending" },
  {
    $set: {
      status: "active",
      updatedAt: new Date()
    }
  }
)
```

批量更新前一定要确认查询条件。

可以先执行：

```javascript
db.users.find({ status: "pending" })
```

确认数据没问题再更新。

## 六、删除一条数据

```javascript
db.users.deleteOne({
  username: "wangwu"
})
```

## 七、批量删除

```javascript
db.users.deleteMany({
  status: "disabled"
})
```

批量删除很危险。

不要写：

```javascript
db.users.deleteMany({})
```

这会删除整个集合里的所有文档。

## 八、软删除

真实业务里经常不直接删除，而是标记删除。

```javascript
db.posts.updateOne(
  { _id: ObjectId("665f0e0b6f8c2b5f8e123456") },
  {
    $set: {
      deletedAt: new Date(),
      updatedAt: new Date()
    }
  }
)
```

查询时过滤：

```javascript
db.posts.find({
  deletedAt: null
})
```

软删除可以降低误删风险，也方便做审计和恢复。

