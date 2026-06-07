# BSON 和常用数据类型

MongoDB 看起来像在存 JSON，但实际存储格式是 BSON。

BSON 可以理解成 JSON 的二进制扩展，它支持更多类型，例如 `ObjectId`、日期、二进制数据、Decimal128 等。

## 一、常用类型

| 类型 | 示例 | 说明 |
|------|------|------|
| String | `"张三"` | 字符串 |
| Number | `18` | 数字 |
| Boolean | `true` | 布尔值 |
| Date | `new Date()` | 日期时间 |
| Array | `["go", "mongodb"]` | 数组 |
| Object | `{ city: "杭州" }` | 嵌套对象 |
| ObjectId | `ObjectId("...")` | 常用作 `_id` |
| null | `null` | 空值 |

示例：

```javascript
db.users.insertOne({
  username: "zhangsan",
  age: 18,
  active: true,
  tags: ["vip", "new"],
  profile: {
    city: "杭州",
    bio: "后端开发"
  },
  createdAt: new Date()
})
```

## 二、ObjectId

MongoDB 默认 `_id` 是 `ObjectId`。

```javascript
{
  _id: ObjectId("665f0e0b6f8c2b5f8e123456")
}
```

`ObjectId` 不是普通字符串。

查询时要这样写：

```javascript
db.users.findOne({
  _id: ObjectId("665f0e0b6f8c2b5f8e123456")
})
```

不要写成：

```javascript
db.users.findOne({
  _id: "665f0e0b6f8c2b5f8e123456"
})
```

这两个类型不同，通常查不到数据。

## 三、日期 Date

插入当前时间：

```javascript
db.users.insertOne({
  username: "lisi",
  createdAt: new Date()
})
```

查询某个时间之后的数据：

```javascript
db.users.find({
  createdAt: {
    $gte: ISODate("2026-01-01T00:00:00Z")
  }
})
```

后端项目里通常使用 UTC 时间存储，展示时再按用户时区格式化。

## 四、数组

数组适合保存标签、角色、简单列表。

```javascript
db.posts.insertOne({
  title: "MongoDB 入门",
  tags: ["mongodb", "database", "backend"]
})
```

查询包含某个标签的文章：

```javascript
db.posts.find({
  tags: "mongodb"
})
```

MongoDB 可以直接匹配数组里是否包含这个值。

## 五、嵌套对象

```javascript
db.users.insertOne({
  username: "zhaoliu",
  profile: {
    city: "上海",
    company: "example"
  }
})
```

查询嵌套字段：

```javascript
db.users.find({
  "profile.city": "上海"
})
```

注意点号写法：

```text
"profile.city"
```

字段名本身不要包含点号，这会让查询和更新变得麻烦。

## 六、金额不要随便用浮点数

如果是金额，尽量不要用普通浮点数。

可以考虑：

- 用整数保存分，例如 `priceCent: 1999`。
- 使用 Decimal128。

初学阶段最容易理解的是用整数保存分：

```javascript
db.products.insertOne({
  name: "键盘",
  priceCent: 19900
})
```

表示 199 元。

这样可以避免浮点数精度问题。

