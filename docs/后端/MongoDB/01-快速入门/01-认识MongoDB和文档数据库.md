# 认识 MongoDB 和文档数据库

MongoDB 是一个文档数据库。

它不像 MySQL 那样把数据存成固定的表格行列，而是把一条数据存成一个类似 JSON 的文档。

## 一、文档长什么样

一个用户文档可以这样表示：

```javascript
{
  _id: ObjectId("665f0e0b6f8c2b5f8e123456"),
  username: "zhangsan",
  email: "zhangsan@example.com",
  age: 18,
  tags: ["vip", "new"],
  profile: {
    city: "杭州",
    bio: "后端开发"
  },
  createdAt: new Date()
}
```

可以看到，文档里可以有：

- 字符串
- 数字
- 数组
- 嵌套对象
- 日期
- ObjectId

这就是 MongoDB 灵活的地方。

## 二、MongoDB 的层级

MongoDB 常见层级：

```text
MongoDB 实例
└── database 数据库
    └── collection 集合
        └── document 文档
```

举例：

```text
mongodb_tutorial
└── users
    ├── 用户文档 1
    ├── 用户文档 2
    └── 用户文档 3
```

## 三、集合和表有什么不同

MySQL 表通常要求每一行都有相同字段。

MongoDB 集合里的文档可以不完全相同：

```javascript
{ username: "zhangsan", age: 18 }
{ username: "lisi", email: "lisi@example.com" }
```

这很灵活，但也意味着你更要自律。

真实项目里，后端代码通常仍然会规定清楚字段结构，避免同一个集合里数据乱七八糟。

## 四、MongoDB 适合什么场景

适合：

- 数据结构变化较快的业务。
- 文档型数据，例如文章、商品、日志、配置。
- 需要保存嵌套结构的数据。
- 读写量较大、需要水平扩展的场景。

不代表所有场景都应该用 MongoDB。

如果业务强依赖复杂 JOIN、强关系约束、财务级事务一致性，关系型数据库仍然更常见。

## 五、MongoDB 不是没有约束

很多新手会误解：

> MongoDB 不用建表，所以可以随便存。

这是错误的。

MongoDB 的集合虽然灵活，但真实项目仍然要考虑：

- 字段命名是否统一。
- 哪些字段必填。
- 哪些字段需要索引。
- 文档是否会无限变大。
- 数据之间是内嵌还是引用。

MongoDB 的重点不是“随便存”，而是“用文档模型更自然地表达业务数据”。

