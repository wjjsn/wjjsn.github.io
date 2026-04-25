---
lang: zh-CN
title: Picolib提示:cannot find libnosys.a
description: 遇到 arm-none-eabi-gcc 编译 Picolibc 时报错 "cannot find libnosys.a"？本文详细拆解该链接错误的成因，分析链接脚本与旧版工具链的版本冲突，并分享通过环境升级解决该问题的完整排查路径。
---

## 前期提要
我在使用picolib构建嵌入式固件时，链接时遇到错误，提示:cannot find libnosys.a。
```sh
arm-none-eabi-gcc  -o <*.o> -Wl,--as-needed -Wl,--no-undefined --specs=picolibc.specs -Wl,--gc-sections -Wl,--print-memory-usage -nostartfiles -Wl,--fatal-warnings -Wl,--start-group <*.a> -Wl,--end-group -T <链接脚本.ld>
/usr/lib/gcc/arm-none-eabi/13.2.1/../../../arm-none-eabi/bin/ld: cannot find libnosys.a: No such file or directory
```
可以看到我并没有添加`-lnosys`参数，但还是链接了libnosys.a。

## 探索过程

- 我怀疑是arm-none-eabi-gcc干的好事，默认链接了这个库。让我检查一下。

    ```sh
    ubuntu@MYJGMC /workspace (main)> arm-none-eabi-gcc -dumpspecs|grep lnosys
    ubuntu@MYJGMC /workspace (main) [0|1]> 
    ```

    grep没有扫到东西？看来默认并没有链接这个库

- picolib干的？

    ```sh
    ubuntu@MYJGMC /workspace (main)> arm-none-eabi-gcc --specs=picolibc.specs -dumpspecs|grep lnosys
    ubuntu@MYJGMC /workspace (main) [0|1]> 
    ```
    [挖坑：specs文件是干啥的](挖坑待填/specs文件的作用.md)
    看起来picolib没干...

- 看看map文件到底是谁干的

    ```map
    ubuntu@MYJGMC /w/build (main)> grep nosys ./output.map -C 5
                0x10000000                        _etcmram = .
    START GROUP
    LOAD /usr/lib/gcc/arm-none-eabi/14.2.1/libgcc.a
    LOAD /usr/lib/picolibc/arm-none-eabi/lib/./libc.a
    LOAD /usr/lib/picolibc/arm-none-eabi/lib/./libm.a
    LOAD /usr/lib/picolibc/arm-none-eabi/lib/./libnosys.a <-在这里！
    END GROUP
    OUTPUT(gd32f4_spl_test elf32-littlearm)
    LOAD linker stubs

    .debug_info     0x00000000      0xcf6
    ```
    看来确实链接了这个库，但是我并没有要求链接这个库，很奇怪。

- 尝试网络搜索...

    还真找到些有用的东西：[picolib_issue](https://github.com/picolibc/picolibc/issues/876)

    issue中提到是链接脚本链接了这个库。

    ```sh
    > grep nosys ./gd32f470xE_flash.ld -n
    179:GROUP(libgcc.a libc.a libm.a libnosys.a)
    ```
    我去还真是，哎我去链接脚本怎么这么坏

    但是注意到issue的时间是Nov 5, 2024，按理来说picolib没有libnosys.a的问题在后续版本已经修复了，但是我这里picolib为什么说找不到这个库呢？我注意到目前使用的编译器的版本是13.2.1，而匹配这个版本的编译器的picolib的版本是1.8.6，而1.8.6发布的时间是Jan 22, 2024。说明我使用的是旧版库，没有libnosys.a是正常情况。但是为什么没有自动安装新版的库呢？原来我使用的容器是ubuntu:24.04，而这个版本一推出，就已经锁死了所有软件主版本号，在ubuntu:24.04的整个生命周期内，官方仓库不会将软件的主版本升级到下一个大版本。所以我只能使用旧版。

    我去不早说，被ubuntu做局了。

## 解决方案
立马换成ubuntu:25.10，编译直接通过。