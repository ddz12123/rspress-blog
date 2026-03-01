# nvm配置
## 1、安装
下载地址：https://github.com/coreybutler/nvm-windows
## 2、 Windows 配置 nvm
- 安装后，**手动配置环境变量**：  
  → 打开“系统属性 → 环境变量”  
  → 在“系统变量”中找到 `Path`，添加：  
  `C:\Users\<你的用户名>\AppData\Roaming\nvm`  
  `C:\Users\<你的用户名>\AppData\Roaming\nvm\v<版本号>`（如 v18.19.1）  
  `C:\Users\<你的用户名>\AppData\Roaming\nvm\scripts`  
  → 重启终端或 CMD
**或：安装时勾选“Add to PATH”（安装程序默认不勾选）** 
## 3、常用命令（同上）
- `nvm list` —— 查看已安装版本
- `nvm use <version>` —— 切换版本
- `nvm install <version>` —— 安装版本
- `nvm uninstall <version>` —— 卸载
- `nvm alias default <version>` —— 设置默认
- `nvm current` —— 查看当前版本
- `nvm list available` —— 查看可安装版本
