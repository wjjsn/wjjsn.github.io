---
lang: zh-CN
title: Azure RTOS FileX 使用注意事项
description: Azure RTOS FileX文件系统使用注意事项，包括SD卡初始化配置、时钟频率设置等关键点。
---

# 注意事项
- 使用CuBeMX生成的代码驱动SD的话，如果没有插入SD卡，要把SDIO的初始化注释掉，否则会直接进入Error_Handler
- 注意两点：初始化时宽度设置为`SDIO_BUS_WIDE_1B`，时钟频率一开始可以设置的低一点，避免出现因时钟频率过高而无法读写数据的问题![](/posts/assets/RTOS/Azure_RTOS/Pasted_image_20250526172958.png)