---
title: Rspress 常用 Markdown 语法自查
description: Rspress 中常用的 Markdown 扩展语法速查表，方便写作时快速参考。
---

# Rspress 常用 Markdown 语法自查

在使用 Rspress 编写文档时，除了支持标准的 Markdown 语法（如加粗、斜体、列表、表格等）之外，还提供了一些非常实用的扩展语法，能大大提升文档的阅读体验。

> **参考链接：**
> - [Rspress 官方指南 - 提示容器 (Container)](https://rspress.rs/zh/guide/use-mdx/container)
> - [Rspress 官方指南 - 代码块 (Code Blocks)](https://rspress.rs/zh/guide/use-mdx/code-blocks)

以下是写作中最常用到的 Rspress 扩展语法速查表。

## 1. 提示容器 (Callouts)

提示容器非常适合用来突出显示某些重要的信息、警告或者补充说明。你可以在 `:::` 后面加上自定义的标题。

### 默认提示 (Info)

```markdown
:::info 补充信息
这是一个 `info` 类型的提示框，用于提供额外的参考信息。
:::
```

### 建议语 (Tip)

```markdown
:::tip 实用技巧
这是一个 `tip` 类型的提示框，常用来写一些小贴士、最佳实践等。
:::
```

### 警告 (Warning)

```markdown
:::warning 请注意
这是一个 `warning` 类型的提示框，用来提醒读者注意潜在的坑或者需要小心的地方。
:::
```

### 危险/错误 (Danger)

```markdown
:::danger 危险操作
这是一个 `danger` 类型的提示框，表示该操作可能会导致严重后果或报错。
:::
```

### 折叠详情 (Details)

```markdown
:::details 点击展开查看代码/详情
这是一个 `details` 类型的折叠框。
很适合用来放一段很长的日志、进阶补充说明或者大段源码，默认是收起的，不占用版面。
:::
```

---

## 2. 代码块高级用法 (Code Blocks)

Rspress 对代码块做了很多增强，除了基础的代码高亮外，还可以加上文件标题、高亮特定行等。

### 添加文件标题

在代码块语言后面加上 `title="文件名"`，可以在代码块顶部显示一个标题栏。

````markdown
```js title="src/index.js"
const a = 1;
console.log(a);
```
````

### 高亮指定行

通过在大括号 `{}` 中指定行号，可以高亮某一行或某几行代码。
- `{1}`：高亮第 1 行
- `{1,3}`：高亮第 1 行和第 3 行
- `{1-3}`：高亮第 1 到 3 行
- `{1,3-5}`：混合用法

````markdown
```ts {1,3-5} title="example.ts"
// 这行会被高亮 (第 1 行)
const b = 2; // 这行正常 (第 2 行)
// 这行会被高亮 (第 3 行)
// 这行会被高亮 (第 4 行)
// 这行会被高亮 (第 5 行)
const c = 3; // 这行正常 (第 6 行)
```
````

---

## 3. Frontmatter (文档头部元信息)

通常写在 Markdown 文件的最顶部，用 `---` 包裹，用来配置当前页面的属性。

```yaml
---
title: 文章标题            # 覆盖默认根据第一个 h1 生成的标题
description: 文章描述      # 用于 SEO 的 meta 标签描述
outline: deep            # 是否显示右侧大纲（支持层级深度的控制）
---
```

---

## 4. 表格 (Table)

标准的 Markdown 表格语法，在说明配置项时经常用到：

```markdown
| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` | 代码块顶部的标题 |
| `lines` | `string` | `''` | 需要高亮的行数，如 `{1-3}` |
```

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` | 代码块顶部的标题 |
| `lines` | `string` | `''` | 需要高亮的行数，如 `{1-3}` |