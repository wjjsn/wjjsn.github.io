# 生成wifi配置文件
`wpa_passphrase "你的Wi-Fi名称" "你的Wi-Fi密码" | sudo tee -a /etc/wpa_supplicant/wpa_supplicant.conf
`
# 执行连接命令
```shell
sudo rfkill unblock wifi #打开wifi
sudo wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf #链接
sudo dhclient wlan0 #获取ip地址
```
# 创建脚本
将创建一个脚本文件保存上述命令
`touch ~/wifi.sh`
编辑脚本文件，执行该命令后进入编辑器，先按'i'进入编辑模式，粘贴上面的命令，按Esc，按Shift+:，输入wq回车保存并退出
`vi ~/wifi.sh`
为脚本添加可执行权限
`chmod +x ~/wifi.sh`

