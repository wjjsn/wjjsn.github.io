---
lang: zh-CN
title: MCU上C++内存占用分析：为什么嵌入式开发慎用C++
description: 通过实际数据对比库函数、printf、std::cout、std::print 在 gcc/clang 编译器下的内存占用，揭示 C++ 标准库在资源受限的 MCU 环境中带来的巨大开销。
---

# gcc
---
直接使用库函数输出

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1656 B        20 KB      8.09%
[build]            FLASH:        5464 B        64 KB      8.34%
```
---
使用printf

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        2080 B        20 KB     10.16%
[build]            FLASH:        9564 B        64 KB     14.59%
```
---
使用std::cout

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        8424 B        20 KB     41.13%
[build]            FLASH:      186544 B        64 KB    284.64%
```
---
使用std::print

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        7024 B        20 KB     34.30%
[build]            FLASH:      369240 B        64 KB    563.42%
```
# gcc(-Oz)
---
直接使用库函数输出

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1656 B        20 KB      8.09%
[build]            FLASH:        3772 B        64 KB      5.76%
```
---
使用printf

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        2080 B        20 KB     10.16%
[build]            FLASH:        7308 B        64 KB     11.15%
```
---
使用std::cout

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        8424 B        20 KB     41.13%
[build]            FLASH:      184248 B        64 KB    281.14%
```
---
使用std::print

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        7024 B        20 KB     34.30%
[build]            FLASH:      330232 B        64 KB    503.89%
```
# clang
---
直接使用库函数输出

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1632 B        20 KB      7.97%
[build]            FLASH:        6096 B        64 KB      9.30%
```
---
使用printf

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1648 B        20 KB      8.05%
[build]            FLASH:       12240 B        64 KB     18.68%
```
---
使用std::cout

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        4536 B        20 KB     22.15%
[build]            FLASH:      152104 B        64 KB    232.09%
```
---
使用std::print

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        3936 B        20 KB     19.22%
[build]            FLASH:      348084 B        64 KB    531.13%
```
# gcc(-Oz)
---
直接使用库函数输出

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1632 B        20 KB      7.97%
[build]            FLASH:        2156 B        64 KB      3.29%
```
---
使用printf

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        1648 B        20 KB      8.05%
[build]            FLASH:        8676 B        64 KB     13.24%
```
---
使用std::cout

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        4544 B        20 KB     22.19%
[build]            FLASH:      147676 B        64 KB    225.34%
```
---
使用std::print

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:        3944 B        20 KB     19.26%
[build]            FLASH:      308192 B        64 KB    470.26%
```