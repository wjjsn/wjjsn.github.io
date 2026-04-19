---
lang: zh-CN
title: Azure RTOS GUIX 移植笔记
description: Azure RTOS GUIX嵌入式GUI移植笔记，记录GUIX的移植过程与配置方法。
---

垃圾玩意，纯纯老古董，设计界面也不好用，还是用lvgl吧
# 移植
这是从github下载下来的库![](/posts/assets/RTOS/Azure_RTOS/Pasted_image_20250528113350.png)重点关注common和ports这两个文件夹
![](/posts/assets/RTOS/Azure_RTOS/Pasted_image_20250528113528.png)
查看官方的项目文件结构：在中间件filex、threadx文件夹下面有common和ports文件夹，效仿这个结构新建guix文件夹将common和ports文件夹移植过来，注意ports文件夹要选择对应的内核和编译器。
**注意要新建文件夹，不要放在middlewares文件下面，否则cubemx重新生成的时候会删除**
右键新建的guix文件夹选择添加到头文件路径，右键工程-属性-C/C++常规-路径和符号-源位置-添加文件夹。将新建的文件夹进行添加。![](/posts/assets/RTOS/Azure_RTOS/Pasted_image_20250601003103.png)
