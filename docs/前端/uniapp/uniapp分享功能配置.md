# uniapp 分享功能配置

uniapp 自带 `onShareAppMessage`（分享到好友/群聊）和 `onShareTimeline`（分享到朋友圈）两个生命周期钩子，支持在页面级别或全局注册。

## 全局混入方案

在 `main.js` 中通过 `app.mixin` 全局注册，所有页面自动获得分享能力，无需逐个页面编写。

```js
import App from './App'
import { createSSRApp } from 'vue'

// 获取当前页面路由与参数
function getCurrentPageInfo() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return {
    route: currentPage?.route
      ? `/${currentPage.route}`
      : '/pages/index/index',
    options: currentPage?.options || {}
  }
}

// 将页面参数序列化为查询字符串
function getShareQuery() {
  const { options } = getCurrentPageInfo()

  return Object.keys(options)
    .filter(key => options[key] !== undefined && options[key] !== null && options[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`)
    .join('&')
}

// 构造完整分享路径，保留当前页面上下文
function getSharePath() {
  const { route } = getCurrentPageInfo()
  const query = getShareQuery()

  return query ? `${route}?${query}` : route
}

export function createApp() {
  const app = createSSRApp(App)

  app.mixin({
    onShareAppMessage() {
      // 在这里配置分享标题和路径
      return {
        title: '分享标题',
        path: getSharePath()
      }
    },
    onShareTimeline() {
      return {
        title: '分享标题',
        query: getShareQuery()
      }
    }
  })

  return { app }
}
```

## 关键点说明

| 钩子 | 用途 | 返回值差异 |
|------|------|-----------|
| `onShareAppMessage` | 分享给好友/群聊 | 返回 `{ title, path }`，path 包含完整路径+参数 |
| `onShareTimeline` | 分享到朋友圈 | 返回 `{ title, query }`，query 仅为参数部分 |

- **path**：分享到好友时需要完整的页面路径（`/pages/index/index?key=val`）
- **query**：分享到朋友圈时只需查询参数字符串（`key=val`）
- **`getCurrentPages()`**：获取页面栈，取最后一页作为当前页

## 页面级别覆盖

如果某个页面需要自定义分享内容，在该页面中重新声明对应钩子即可覆盖全局默认值：

```vue
<script setup>
onShareAppMessage(() => {
  return {
    title: '自定义标题',
    path: '/pages/detail/detail?id=123'
  }
})
</script>
```

## 参考链接

- [onShareAppMessage - 微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/component/onShareAppMessage.html)
- [onShareTimeline - 微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareTimeline)

## 注意事项

1. `onShareAppMessage` 和 `onShareTimeline` **不会被自动触发**，必须用户主动点击引导按钮（如右上角原生菜单或自定义分享按钮）才会调用
2. 分享路径必须为已注册的页面路由，否则打开会报错
3. 参数值建议使用 `encodeURIComponent` 编码，避免特殊字符导致路由解析失败
