---
lang: zh-CN
title: "使用已有的gcc-arm-none-eabi编译器编译ModusToolbox工程"
description: "不想重复安装英飞凌的编译器？本文详细讲解如何通过设置CY_COMPILER_PATH环境变量，让ModusToolbox工程使用你已有的gcc-arm-none-eabi编译器，避免重复安装节省磁盘空间。"
---

在工程的根Makeflies中搜索`CY_COMPILER_PATH=`然后写成你编译器所在的绝对路径，例如：

```makefile
# Absolute path to the compiler's "bin" directory.
#
# The default depends on the selected TOOLCHAIN (GCC_ARM uses the ModusToolbox
# software provided compiler by default).
CY_COMPILER_PATH=C:/apps/gcc-arm-none-eabi/15.2.rel1
```

## 继续阅读

[开始点灯](开始点灯.md)