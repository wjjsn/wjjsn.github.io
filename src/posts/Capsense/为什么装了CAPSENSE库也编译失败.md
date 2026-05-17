---
lang: zh-CN
title: "为什么装了CAPSENSE库也编译失败"
description: "详解PSoC 4开发中装了CAPSENSE库但编译失败的常见原因，核心问题是cycfg_capsense.h配置需要通过Capsense Configurator工具添加至少一个传感器组件并配置好引脚才能正确编译。"
---

由于capsense的实际有的组件个数，是由用户决定的，在capsense中间件这个库编写的时候并不知道。所以这个库在编译时就需要`#include "cycfg_capsense.h"`从这里拿配置。

并且这个需要在`capsense-configurator.exe`添加至少一个组件，才不会有宏定义报错。

![在Capsense Configurator中添加一个传感器组件](/posts/assets/Capsense/添加一个capsense组件.png)

组件添加完成会还需要选好对应的引脚。

![选择好引脚配置](/posts/assets/Capsense/选择好引脚.png)

## 继续阅读

[Cy_CapSense_Enable()返回失败？](Cy_CapSense_Enable()返回失败？.md)