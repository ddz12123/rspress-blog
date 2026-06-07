# find 查询基础

MongoDB 查询常用：

- `findOne`
- `find`

## 一、查询一条数据

```javascript
db.users.findOne({
  username: "zhangsan"
})
```

如果匹配到多条，`findOne` 只返回第一条。

## 二、查询多条数据

```javascript
db.users.find({
  status: "active"
})
```

查询全部：

```javascript
db.users.find()
```

实际项目不要随便查询全部大集合，数据多了会很慢。

## 三、格式化输出

```javascript
db.users.find().pretty()
```

新版 `mongosh` 输出已经比较友好，`pretty()` 主要用于让结果更容易阅读。

## 四、按 _id 查询

如果 `_id` 是 ObjectId：

```javascript
db.users.findOne({
  _id: ObjectId("665f0e0b6f8c2b5f8e123456")
})
```

注意不要写成字符串。

```javascript
db.users.findOne({
  _id: "665f0e0b6f8c2b5f8e123456"
})
```

这通常查不到，因为类型不一样。

## 五、查询嵌套字段

文档：

```javascript
{
  username: "zhangsan",
  profile: {
    city: "杭州"
  }
}
```

查询：

```javascript
db.users.find({
  "profile.city": "杭州"
})
```

嵌套字段使用点号路径。

## 六、查询数组

文档：

```javascript
{
  title: "MongoDB 入门",
  tags: ["mongodb", "database"]
}
```

查询包含 `mongodb` 标签的文章：

```javascript
db.posts.find({
  tags: "mongodb"
})
```

MongoDB 会匹配数组里是否包含这个值。

## 七、只返回部分字段

只返回 `username` 和 `email`：

```javascript
db.users.find(
  { status: "active" },
  { username: 1, email: 1 }
)
```

默认会返回 `_id`。

如果不想返回 `_id`：

```javascript
db.users.find(
  { status: "active" },
  { _id: 0, username: 1, email: 1 }
)
```

第二个参数叫投影，用来控制返回哪些字段。

