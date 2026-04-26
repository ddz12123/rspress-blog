import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTwoslash } from '@rspress/plugin-twoslash';
import { pluginSitemap } from '@rspress/plugin-sitemap';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  globalStyles: path.join(__dirname, 'docs/public/custom.css'),
  title: '知识小屋',
  description: '知识库：前端 / DevOps / 工具',
  icon: '/rspress-icon.png',
  logo: {
    light: '/logo-light.png',
    dark: '/logo-dark.png',
  },
  logoText: '知识小屋',
  outDir: 'dist',
  themeConfig: {
    enableScrollToTop: true,
    enableContentAnimation: true,
    enableAppearanceAnimation: true,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/ddz12123/rspress-blog',
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.7 7.7l-6 6a2 2 0 1 1-2.8-2.8l6-6a6 6 0 0 1 7.7-7.7z"/></svg>',
        },
        mode: 'link',
        content: 'http://47.119.182.242:8000/',
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
        },
        mode: 'link',
        content: 'http://47.119.182.242:8001/',
      },
    ],
    lastUpdated: true,
    editLink: {
      docRepoBaseUrl:
        'https://github.com/ddz12123/rspress-blog/blob/main/docs/',
    },
    footer: {
      message: `
        <div class="flex flex-col items-center justify-center gap-2">
          <p class="text-sm text-gray-500">知识库 · 记录可复用的步骤与结论</p>
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600 transition-colors hover:underline">滇ICP备2025076969号-1</a>
            <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=53011202001707" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600 transition-colors hover:underline">滇公网安备53011202001707号</a>
          </div>
        </div>`,
    },
  },
  markdown: {
    defaultWrapCode: true,
    showLineNumbers: true,
  },
   plugins: [pluginTwoslash(), pluginSitemap({
      siteUrl: 'https://ainotehub.top',
    })],
});
