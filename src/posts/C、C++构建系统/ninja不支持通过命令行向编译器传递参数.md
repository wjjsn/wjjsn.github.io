---
lang: zh-CN
title: ninja不支持通过命令行向编译器传递参数
description: 
---


如果想要详细查看编译时使用的具体参数，需要修改构建系统，向其中添加-v参数。向ninja添加只是让ninja把每个文件的FLAG显示出来，并不能看到编译器层发生的事。同理，向link_args添加-Wl,--verbose