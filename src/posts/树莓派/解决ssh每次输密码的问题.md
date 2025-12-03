在主机执行
```powershell
ssh-keygen -t ed25519
#这个命令会生成私钥和公钥，如果之前执行过就不需要再执行
cat ~/.ssh/id_ed25519.pub | ssh wjjsn@pi5.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
#这个命令捕获刚刚主机生成的公钥重定向到stdout，ssh会将数据传入pi的stdin，并将密钥写入，之后登录就无需密码了
```