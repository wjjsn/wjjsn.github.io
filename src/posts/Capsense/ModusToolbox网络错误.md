---
lang: zh-CN
title: 解决英飞凌登录时提示Error: Failed to Login: 'Network Error occurred: 'ContentNotFoundError''的错误
description: 被英飞凌（Infineon）ModusToolbox 的在线安装和“土豆服务器”折腾到血压飙升？本文为你奉上全网最清爽的 ModusToolbox 离线安装避坑指南。内含官方离线包直达下载链接，并详细梳理了 CAPSENSE 等核心必装依赖项，带你彻底摆脱登录卡死、密码过期和网络报错的折磨，10分钟完成环境搭建！
---

# 吐槽

傻福英飞凌服务器是土豆做的吗？不挂梯子进不去，挂梯子了也进不去，开全局开tun了还是进不去，真的无语了。

下个安装包还要登录？！我登牛魔，草！倒腾大半天登录上去了居然说我密码已过期，让我改，密码要求巨严格，还不能和最近三次的密码重复，我**，他们工程师绝对脑子进水了。

上论坛看了好几篇相同问题的回复都说是服务器在检修，让用户把日志发过来，他们排查。。。我发你***，我急着用呢！我还来帮你排查，搞笑。

# 解决方案

## 换成离线版安装，尝试下面的网址：

https://softwaretools.infineon.com/tools/com.ifx.tb.tool.modustoolbox

https://www.infineon.com/design-resources/development-tools/sdk/modustoolbox-software/modustoolbox-offline-installation

https://softwaretools.infineon.com/tools/com.ifx.tb.tool.modustoolboxofflinecontentpackage


## 必装的依赖 

![](/posts/assets/ModusToolbox网络错误.png)

`ModusToolbox™ CAPSENSE™ and Multi-Sense Pack`必须要装，否则很多项目会编译失败。剩下的是编译器、烧录程序、IDE啥的，看自己喜好，可装可不装

