import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const siteUrl = 'https://ainotehub.top';
const siteName = '知识小屋';
const siteDescription =
  '知识小屋，记录前端、后端、DevOps、AI 与效率工具的技术笔记、部署实践和常用配置。';

function toPageUrl(routePath: string): string {
  return routePath === '/' ? siteUrl : `${siteUrl}${routePath}.html`;
}

// 从路由路径中提取页面标题（取最后一段，去除 .html 后缀）
function pageTitleFromRoute(routePath: string): string {
  const segments = routePath.replace(/^\//, '').replace(/\/$/, '').split('/');
  return segments[segments.length - 1].replace(/\.html$/, '');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateBreadcrumbLD(routePath: string): string | null {
  if (routePath === '/' || routePath === '/index') return null;

  const segments = routePath.replace(/^\//, '').replace(/\/$/, '').split('/');
  const itemListElement: Record<string, unknown>[] = [
    { '@type': 'ListItem', position: 1, name: siteName, item: siteUrl },
  ];

  let current = '';
  let pos = 2;
  for (const seg of segments) {
    current += `/${seg}`;
    const name = seg.replace(/\.html$/, '');
    itemListElement.push({
      '@type': 'ListItem',
      position: pos,
      name,
      item: `${siteUrl}${current}`,
    });
    pos++;
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  });
}

function generateArticleLD(
  title: string,
  description: string,
  routePath: string,
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || siteDescription,
    url: toPageUrl(routePath),
    author: { '@type': 'Person', name: siteName },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
  });
}

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  globalStyles: path.join(__dirname, 'docs/public/custom.css'),
  // Rspress 内置主题文案使用 zh 作为中文 key，单中文站点直接用 zh 即可。
  lang: 'zh',
  title: siteName,
  description: siteDescription,
  icon: '/rspress-icon.png',
  head: [
    // 基础 SEO（百度仍然会参考 keywords）
    [
      'meta',
      {
        name: 'keywords',
        content:
          '知识小屋,前端,后端,DevOps,Docker,Electron,UniApp,Next.js,Python,Golang,技术笔记',
      },
    ],
    ['meta', { name: 'author', content: siteName }],
    ['meta', { name: 'robots', content: 'index,follow' }],
    [
      'link',
      {
        rel: 'sitemap',
        type: 'application/xml',
        href: `${siteUrl}/sitemap.xml`,
      },
    ],

    // 百度适配：禁止转码，强制使用原页面
    [
      'meta',
      {
        'http-equiv': 'Cache-Control',
        content: 'no-siteapp, no-transform',
      },
    ],
    [
      'meta',
      {
        'http-equiv': 'X-UA-Compatible',
        content: 'IE=edge,chrome=1',
      },
    ],

    // canonical + JSON-LD 结构化数据（作为原始 HTML 字符串返回）
    (route): string => {
      const pageUrl = toPageUrl(route.routePath);
      const parts: string[] = [
        `<link rel="canonical" href="${escapeHtml(pageUrl)}">`,
      ];

      // JSON-LD 面包屑
      const breadcrumbLD = generateBreadcrumbLD(route.routePath);
      if (breadcrumbLD) {
        parts.push(
          `<script type="application/ld+json">${breadcrumbLD}</script>`,
        );
      }

      // JSON-LD Article（非首页，从路由路径提取标题）
      if (route.routePath !== '/' && route.routePath !== '/index') {
        parts.push(
          `<script type="application/ld+json">${generateArticleLD(
            pageTitleFromRoute(route.routePath),
            siteDescription,
            route.routePath,
          )}</script>`,
        );
      }

      return parts.join('\n');
    },
  ],
  logo: {
    light: '/logo-light.png',
    dark: '/logo-dark.png',
  },
  logoText: siteName,
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
  plugins: [
    pluginSitemap({
      siteUrl,
      defaultChangeFreq: 'daily',
    }),
  ],
});
