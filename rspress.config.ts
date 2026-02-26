import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

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
});
