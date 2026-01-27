# github 配置ssh

## 一、生成 SSH 密钥

```shell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

## 二、添加 SSH 密钥到 GitHub
1. 登录 GitHub 账号。
2. 点击头像，选择 Settings。
3. 在左侧导航栏选择 SSH and GPG keys。
4. 点击 New SSH key。
5. 输入标题（例如："My Laptop"）。
6. 粘贴公钥内容（从 `~/.ssh/id_rsa.pub` 文件中复制）。
7. 点击 Add SSH key。