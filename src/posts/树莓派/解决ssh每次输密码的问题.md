---
lang: zh-CN
title: 解决SSH每次输密码的问题 - 树莓派公钥认证配置
description: 详细说明如何在Linux、macOS或Windows主机上生成SSH密钥对，并将公钥配置到树莓派，实现免密码登录的完整教程。
---

在主机执行
```powershell
ssh-keygen -t ed25519
#这个命令会生成私钥和公钥，如果之前执行过就不需要再执行
cat ~/.ssh/id_ed25519.pub | ssh wjjsn@pi5.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
#这个命令捕获刚刚主机生成的公钥重定向到stdout，ssh会将数据传入pi的stdin，并将密钥写入，之后登录就无需密码了
```