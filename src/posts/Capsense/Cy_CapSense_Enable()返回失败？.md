---
lang: zh-CN
title: "Cy_CapSense_Enable()返回失败的解决方案"
description: "深入解析PSoC 4开发中Cy_CapSense_Enable()函数返回失败的真正原因，提供经过验证的解决方案，让你轻松应对CAPSENSE初始化过程中的这个常见问题。"
---

实则没啥大事，失败了会打一个软件断点暂停。


注释掉那一行就好了，失败了也继续，不要停下来。

看注释怎么说的
> 在正确调校传感器之前，此状态可能会失败。
> 确保在按照Readme.md文件中的程序对CapSense传感器进行调谐后
> 此函数能够通过