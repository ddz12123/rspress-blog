# 常用 AI 编程 Skills

## 一、下载说明（官方 + 镜像）

- 官方地址用于查看最新说明、版本和更新日志，建议优先使用。
- 如果访问 GitHub 慢，可使用统一镜像方案：
  - GitHub 页面代理：`https://gh-proxy.com/{官方地址}`
  - GitHub 目录打包：`https://download-directory.github.io/?url={GitHub tree 地址}`
- 对于仓库根目录链接，目录打包建议补全为 `.../tree/main` 再使用。

## 二、常用 Skills 清单

| Skill 名称 | <nobr>官方地址</nobr> | <nobr>镜像下载</nobr> | <nobr>作用描述</nobr> | <nobr>适用场景</nobr> |
| --- | --- | --- | --- | --- |
| gh-fix-ci | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci) | 定位 CI 失败根因并给出修复步骤。 | PR 合并前流水线失败排查。 |
| gh-address-comments | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments) | 汇总并回应 GitHub Review 评论。 | 多轮 code review 收敛。 |
| playwright | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/playwright)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/playwright) | 通过浏览器自动化执行 UI 测试。 | E2E 回归、页面交互验证。 |
| security-best-practices | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices) | 提供通用安全开发基线清单。 | 新项目安全基线检查。 |
| security-threat-model | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model) | 辅助进行威胁建模与风险识别。 | 上线前安全评审。 |
| vercel-deploy | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/vercel-deploy) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/vercel-deploy)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/vercel-deploy) | 提供 Vercel 部署流程与注意项。 | Next.js 站点快速部署。 |
| cloudflare-deploy | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/cloudflare-deploy) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/cloudflare-deploy)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/cloudflare-deploy) | 覆盖 Cloudflare 平台部署实践。 | Worker/Pages 发布与配置。 |
| netlify-deploy | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/netlify-deploy) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/netlify-deploy)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/netlify-deploy) | 规范 Netlify 构建与发布步骤。 | 静态站点自动化发布。 |
| render-deploy | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/render-deploy) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/render-deploy)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/render-deploy) | 提供 Render 部署与环境配置建议。 | 全栈应用云端托管。 |
| figma-implement-design | [官方仓库](https://github.com/openai/skills/tree/main/skills/.curated/figma-implement-design) | [页面代理](https://gh-proxy.com/https://github.com/openai/skills/tree/main/skills/.curated/figma-implement-design)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/openai/skills/tree/main/skills/.curated/figma-implement-design) | 将 Figma 设计规范转为前端实现。 | 设计稿到代码落地。 |
| awesome-cursorrules | [官方仓库](https://github.com/PatrickJS/awesome-cursorrules) | [页面代理](https://gh-proxy.com/https://github.com/PatrickJS/awesome-cursorrules)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/PatrickJS/awesome-cursorrules/tree/main) | 汇总社区常用 Cursor Rules。 | 快速建立项目编码规则。 |
| claude-code-subagents-collection | [官方仓库](https://github.com/davepoon/claude-code-subagents-collection) | [页面代理](https://gh-proxy.com/https://github.com/davepoon/claude-code-subagents-collection)<br>[目录打包](https://download-directory.github.io/?url=https://github.com/davepoon/claude-code-subagents-collection/tree/main) | 提供可复用的子代理任务模板。 | 多角色协作与任务拆分。 |

## 三、使用建议

1. 先选 2 到 3 个与你当前项目最匹配的 skills，避免一次引入过多规则。
2. 同一仓库内统一规则来源，减少团队协作时的行为差异。
3. 每次引入新 skill 后先在小范围分支验证，再推广到主开发流程。
