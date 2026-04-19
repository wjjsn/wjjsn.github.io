---
lang: zh-CN
title: 树莓派4B通过SSH连接WiFi详细教程
description: 详解在无显示器情况下，如何通过命令行配置WiFi连接，包括wpa_supplicant配置、rfkill解锁、dhclient获取IP等步骤，并提供自动化脚本。
---

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

