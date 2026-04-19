---
lang: zh-CN
title: CMake Hello World工程创建教程
description: 介绍CMake的安装方法、推荐的目录结构，以及如何编写最简CMakeLists.txt创建第一个CMake工程。
---
# 安装CMake
`sudo apt install cmake`
`cmake --version`
# 目录结构
Cmke推荐的目录结构如下
```
/porjrct
|-/build
|-/Inc
|-/Src
||-mian.cpp
|-CMakeLists.txt
```
其中，build文件夹是由cmake自动生成的
# 最简的CMakeLists.txt
至少包含以下内容
```cmake
cmake_minimum_required(VERSION 3.10)
project(hello)
add_executable(${PROJECT_NAME} ${PROJECT_SOURCE_DIR}/Src/*.cpp)
``` 
第一行指定了支持cmake的最小版本
第二行指定了工程的名字
第三行指定输出的可执行文件的名字。空格后面跟着用于生成该可执行文件的源码
其中`${PROJECT_NAME}`代表的是工程的名字，这里为hello。可以指定为其他的名字
`${PROJECT_SOURCE_DIR}`代表的是CMakeLists.txt所在目录的路径
