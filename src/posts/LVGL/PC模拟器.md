---
lang: zh-CN
title: LVGL PC模拟器配置指南 - VS Code + SDL2 详细教程
description: 详细讲解如何在Windows系统下使用VS Code配置LVGL PC模拟器，包括gcc/cmake环境配置、SDL2安装、LVGL源码下载和编译运行步骤。
---

使用VS Code进行模拟
# 配置环境
- gcc、cmake配置好后在命令行检查版本查看是否成功
- vs code安装C开发的相应插件
- 下载SDL2，mingw开发者版本
	- 将SDL2-devel-2.xx.x-mingw.zip解压
	- 将解压后的SDL2-2.xx.x复制到vs code工程目录下
	- 对工程目录下的CMakeList.txt进行修改，在`find_package(SDL2 REQUIRED)`的上一句添加`set(SDL2_DIR "SDL2-2.xx.x/cmake")`
	- github下载lvgl-master，将解压后的文件夹内的所有内容复制到工程lvgl文件夹下
	- 对工程main/src/main.c文件添加`#include "SDL.h"`
- 左下角点击生成进行编译
- 将`"SDL2-2.xx.x\x86_64-w64-mingw32\bin\SDL2.dll`与生成的main.exe放在一起，尝试运行