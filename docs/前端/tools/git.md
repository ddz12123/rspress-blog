# git常用命令自查

## 1、git 安装地址
https://git-scm.com/downloads

## 2、git常用命令
【自用 Git 常用命令速查】

| 命令 | 用途 | 示例 |
|------|------|------|
| `git init` | 初始化本地仓库 | `git init` |
| `git clone <url>` | 克隆远程仓库 | `git clone https://github.com/xxx/repo.git` |
| `git status` | 查看当前状态 | `git status` |
| `git add .` | 添加所有文件到暂存区 | `git add .` |
| `git commit -m "描述"` | 提交暂存区内容 | `git commit -m "修复bug"` |
| `git push origin <branch>` | 推送到远程分支 | `git push origin main` |
| `git pull origin <branch>` | 拉取远程分支更新 | `git pull origin main` |
| `git log` | 查看提交历史 | `git log --oneline` |
| `git checkout <branch>` | 切换分支 | `git checkout main` |
| `git checkout -b <branch>` | 创建并切换新分支 | `git checkout -b feature-login` |
| `git merge <branch>` | 合并分支 | `git merge feature-login` |
| `git branch -d <branch>` | 删除本地分支 | `git branch -d feature-login` |
| `git config --global user.name "你的名字"` | 设置全局用户名 | `git config --global user.name "张三"` |
| `git config --global user.email "你的邮箱"` | 设置全局邮箱 | `git config --global user.email "zhang@example.com"` |
| `git config --global core.editor "code --wait"` | 设置默认编辑器（VS Code） | `git config --global core.editor "code --wait"` |

