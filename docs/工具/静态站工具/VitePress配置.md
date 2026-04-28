# VitePress 相关配置

> VitePress 是一个基于 Vue 的静态网站生成器，专为构建技术文档而设计。它提供了现代化的开发体验和丰富的功能，是替代传统文档工具的理想选择。
>

## 一、默认主题样式调整

> 通过自定义 CSS 样式，可以调整 VitePress 默认主题的外观，使其更符合项目需求。
>

在 `.vitepress/theme/reset.css` 文件中添加以下样式：

```css
/* 将搜索框靠右显示 */
.VPNavBarSearch {
    display: flex;
    flex-direction: row-reverse !important;
    margin-right: 20px;
}

:root {
    --vp-layout-max-width: 1600px !important;
}

.VPSidebar{
    top:64px !important;
    padding-top:0 !important;
    background-color: #fff !important;
}

.dark{
    --vp-c-bg-alt: #161618;
}

.dark .VPSidebar{
    background-color: #161618 !important;
}

.open{
    top:0 !important;
}
.VPSidebar .curtain{
    display: none !important;
}

.VPNav{
    border-bottom:1px solid var(--vp-c-divider);
}

.has-sidebar .wrapper .container .title{
    border: none;
}

.VPDoc .container{
    max-width: 1300px !important;
}
.VPDoc .content{
    max-width: 1300px !important;
}
.VPDoc .content-container{
    max-width: 1300px !important;
}
.VPDoc .main{
    max-width: 1300px !important;
}

.group:has([role='button']) .VPSidebarItem.level-0 .items {
    padding-left: 16px !important;
    border-left: 1px solid var(--vp-c-divider);
    border-radius: 2px;
    transition: background-color 0.25s;
}

/* 整个滚动条 */
::-webkit-scrollbar {
    width: 6px !important; /* 滚动条宽度 */
    height: 6px !important;
    border-radius: 6px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
    background: #f1f1f1; /* 轨道背景颜色 */
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
    background: #c1c1c1; /* 滑块背景颜色 */
    border-radius: 5px; /* 滑块圆角 */
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
    background: #9e9b9b; /* 滑块悬停时的背景颜色 */
    cursor: pointer;
}
```

## 二、本地搜索修改为中文

> 将 VitePress 的本地搜索功能修改为中文界面，提升用户体验。
>

在 `themeConfig` 中添加以下配置：

```json
{
  "search": {
    "provider": "local",
    "options": {
      "translations": {
        "button": {
          "buttonText": "搜索文档",
          "buttonAriaLabel": "搜索文档"
        },
        "modal": {
          "noResultsText": "无法找到相关结果",
          "resetButtonTitle": "清除查询条件",
          "footer": {
            "selectText": "选择",
            "navigateText": "切换",
            "closeText": "关闭"
          }
        }
      }
    }
  }
}
```

## 三、项目 defineConfig 配置

> 在 `.vitepress/config.mts` 文件中进行项目的基本配置，包括标题、导航、侧边栏等。
>

```js
import { defineConfig } from "vitepress";
import { withPwa } from '@vite-pwa/vitepress'

// https://vitepress.dev/reference/site-config
export default withPwa(defineConfig({
  title: "知识库",
  description: "这是一个知识库",
  outDir: '../dist',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '前端', link: '/src/web/comprehensive/naming-conventions', activeMatch: `^/src/web/`, },
      { text: '函数', link: '/src/func/', activeMatch: `^/src/func/` },
      { text: '工具集', link: '/src/tools/', activeMatch: `^/src/tools/`, }
    ],
    logo: '/images/logo.svg',
    sidebar: {
      '/src/func/': [
        {
          text: '🚀 函数',
          items: [
            { text: '常用函数', link: '/src/func/' },
            { text: 'vue3常用hooks', link: '/src/func/hooks' },
            { text: 'vue3常用指令', link: '/src/func/directives' },
          ],
        }
      ],
      '/src/web/': [
        {
          text: '📚 综合',
          collapsed: false,
          items: [
            { text: '前端命名规范', link: '/src/web/comprehensive/naming-conventions' },
            { text: 'webWorker', link: '/src/web/comprehensive/webWorker' },
            { text: 'cdn', link: '/src/web/comprehensive/cdn' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'gitee', link: 'https://gitee.com/passerbycoding/web-docs' }
    ],
    // 本地搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    // 更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
      }
    },
    // 手机端配置返回顶部按钮显示文字
    returnToTopLabel: "返回顶部",
    // 手机端配置侧边栏菜单按钮显示文字
    sidebarMenuLabel: "菜单",
    // 右侧内容导航栏
    outline: {
      level: [1, 6],
      label: "本章导航"
    },
    // 翻页
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
  },
  markdown: {
    theme: {
        dark: 'dracula-soft',
        light: 'github-light',
    },
    codeCopyButtonTitle:"复制",
  },
  vite: {
    // 应用插件
    plugins: [

    ]
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'script-defer',
    includeAssets: ['favicon.ico'],
    manifest: {
      name: '前端知识库',
      short_name: '前端知识库',
      theme_color: '#ffffff',
      icons: [
        {
          src: '/images/logo.svg',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/images/logo.svg',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/images/logo.svg',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
      // 这个配置默认是 2M，如果网站文件很多，打包的文件大小若超过这个值，build 会失败，可以根据自己需要调整
      // maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
    },
    experimental: {
      includeAllowlist: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
    },
  }
}))
```

## 四、vitepress-theme-demoblock 插件

> vitepress-theme-demoblock 是一个用于 VitePress 的插件，可以方便地在文档中展示 Vue 组件示例和代码。
>

- **插件地址**: [vitepress-theme-demoblock-fork](https://www.npmjs.com/package/vitepress-theme-demoblock-fork)

## 五、主题自定义配置

> 自定义主题
> 通过创建自定义主题文件，可以进一步扩展 VitePress 的功能，例如添加 Live2D 宠物等交互元素。

在 `.vitepress/theme/index.js` 文件中添加以下配置：

```js
// .vitepress/theme/index.js
import DefaultTheme from "vitepress/theme";
import './css/reset.css'
import MyLayout from './Layout.vue'

export default {
    extends: DefaultTheme,

    enhanceApp: async ({ app, router, siteData }) => {
        // app is the Vue 3 app instance from `createApp()`. router is VitePress'
        // custom router. `siteData`` is a `ref`` of current site-level metadata.

        if (!import.meta.env.SSR) {
            const Live2DPlugin = await import('oh-my-live2d')
            const initLive2D = async () => {
                await Live2DPlugin.loadOml2d({
                    models: [
                        {
                            path: 'https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json'
                        },
                        {
                            path: 'https://unpkg.com/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json'
                        },
                        {
                            path: 'https://unpkg.com/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json'
                        },
                        {
                            path: 'https://unpkg.com/live2d-widget-model-chitose@1.0.5/assets/chitose.model.json'
                        },
                    ],
                    mobileDisplay: false,
                    dockedPosition: "left",
                    tips: {
                        idleTips: {
                            wordTheDay(wordTheDayData) {
                                return `${wordTheDayData.hitokoto}    by.${wordTheDayData.from}`;
                            }
                        }
                    },
                    menus: {
                        items: [
                            {
                                id: 'Rest',
                                icon: 'icon-switch',//rest about like skin setting switch loading
                                title: '休息一下',
                                onClick(oml2d) {
                                    oml2d.stageSlideOut();
                                    oml2d.statusBarOpen("召唤宠物");
                                    oml2d.setStatusBarClickEvent(() => {
                                        oml2d.stageSlideIn();
                                        oml2d.statusBarClose();
                                    });
                                }
                            },
                            {
                                id:'changeModel',
                                icon: 'icon-skin',
                                title: '切换模型',
                                onClick(oml2d){
                                    oml2d.loadNextModel()
                                }
                            }
                        ]
                    }
                });
            }

            // 延迟加载避免阻塞
            setTimeout(initLive2D, 1000);
        }
    },
    // 使用注入插槽的包装组件覆盖 Layout
    Layout: MyLayout
};
```

> note Live2D 模型
> 以下是可用的 Live2D 模型链接，可以根据需要选择：
>
> - hijiki: `https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json`
> - tororo: `https://unpkg.com/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json`
> - koharu: `https://unpkg.com/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json`
> - chitose: `https://unpkg.com/live2d-widget-model-chitose@1.0.5/assets/chitose.model.json`
> - shizuku: `https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json`
> - hibiki: `https://unpkg.com/live2d-widget-model-hibiki@1.0.5/assets/hibiki.model.json`
> - wanko: `https://unpkg.com/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json`
> - unitychan: `https://unpkg.com/live2d-widget-model-unitychan@1.0.5/assets/unitychan.model.json`
> - nico: `https://unpkg.com/live2d-widget-model-nico@1.0.5/assets/nico.model.json`
> - izumi: `https://unpkg.com/live2d-widget-model-izumi@1.0.5/assets/izumi.model.json`
> - nipsilon: `https://unpkg.com/live2d-widget-model-nipsilon@1.0.5/assets/nipsilon.model.json`
> - nito: `https://unpkg.com/live2d-widget-model-nito@1.0.5/assets/nito.model.json`

Live2D 插件可能会影响页面加载性能，建议在生产环境中谨慎使用，并确保有足够的延迟加载时间。