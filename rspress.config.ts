import * as path from 'node:path';
import mermaid from 'rspress-plugin-mermaid';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  globalStyles: path.join(__dirname, 'docs/public/custom.css'),
  title: '知识小屋',
  description: '自用知识库：前端 / DevOps / 工具',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
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
    outlineTitle: '本页导航',
    lastUpdated: true,
    lastUpdatedText: '最后更新',
    prevPageText: '上一篇',
    nextPageText: '下一篇',
    searchPlaceholderText: '搜索笔记',
    searchNoResultsText: '没有找到相关内容',
    searchSuggestedQueryText: '试试更短的关键词',
    editLink: {
      docRepoBaseUrl:
        'https://github.com/ddz12123/rspress-blog/blob/main/docs/',
      text: '在 GitHub 上编辑此页',
    },
    footer: {
      message: `
        <div class="flex flex-col items-center justify-center gap-2">
          <p class="text-sm text-gray-500">自用知识库 · 记录可复用的步骤与结论</p>
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600 transition-colors hover:underline">滇ICP备2025076969号-1</a>
            <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=53011202001707" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600 transition-colors hover:underline">滇公网安备53011202001707号</a>
          </div>
        </div>`,
    },
  },
  plugins: [mermaid()],
});
