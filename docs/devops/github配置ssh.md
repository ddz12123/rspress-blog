# github 配置ssh

## 一、生成 SSH 密钥

```shell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

- 在 Windows 系统中，~/.ssh 目录通常位于当前用户的主目录下。
- 具体路径取决于你的用户名，格式如下： C:\Users\<你的用户名>\.ssh
- 例如，如果你的用户名是 Administrator，那么路径就是：
C:\Users\Administrator\.ssh

> 注意：第一次git clone的时候会出现一提示：Are you sure you want to continue connecting (yes/no/[fingerprint])?
> 输入yes即可。必须完整输入 yes 三个字母，直接按回车或输入 y 是无效的。

## 二、添加 SSH 密钥到 GitHub
1. 登录 GitHub 账号。
2. 点击头像，选择 Settings。
3. 在左侧导航栏选择 SSH and GPG keys。
4. 点击 New SSH key。
5. 输入标题（例如："My Laptop"）。
6. 粘贴公钥内容（从 `~/.ssh/id_rsa.pub` 文件中复制）。
7. 点击 Add SSH key。