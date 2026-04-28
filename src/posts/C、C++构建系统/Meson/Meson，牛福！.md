---
lang: zh-CN
title: Meson，牛福！
description: 还在被 CMake 和 Makefile 的晦涩语法折磨吗？本文深入剖析传统构建系统的槽点，通过交叉编译、依赖管理和配置逻辑的深度对比，带你领略 Meson 如何以简洁语法与极致人体工学，成为现代 C/C++ 开发者的构建利器。
---

## CMake、Makefile槽点

不得不说这个构建系统比cmake好多了，cmake和makefile语法简直就是一坨。看得头大。

构建系统作为一个工具，唯一要做好的事就是把二进制文件文件给我编译出来，至于中间的过程，自然是设计的越简单越好，越人体工学越好。而不是一个工具,却需要人去仔仔细细当成一个庞然大物来学习！

### CMake

1. cmake表示当前源码路径，居然有三种变量来表示！
    - CMAKE_SOURCE_DIR
    - CMAKE_CURRENT_SOURCE_DIR
    - PROJECT_SOURCE_DIR
    具体区别是什么就不介绍了，反正我感觉绕。

2. 对于cmakelists.txt和.cmake文件处理的方式还不一样

3. 默认生成器用的不是ninja，要么手动指定生成器，要么编译的时候手动加-j

4. 语法复杂啰嗦，各种大写字母，人类可读性差

### Makefile
makefile就更不用说了，那一大串的@$%[]^:=，看得想吐。喜欢我把makefile当shell脚本写吗？

## Meson的优点

### 极速的创建工程

创建一个空的文件夹，执行`meson init`自动生成模版工程，零配置，开箱即用：
```sh
> meson init
Using "tmp" (name of current directory) as project name.
Using "tmp" (project name) as name of executable to build.
Defaulting to generating a C language project.
Sample project created. To build it run the
following commands:

meson setup builddir
meson compile -C builddir
```

### 极其简洁的语法

我敢说就算从来没有用过meson的人，只要学过英语的，自己直接来看，绝对能看懂这些内容说的是什么。

```python
project(
  'tmp',
  'c',
  meson_version : '>= 1.3.0',
  version : '0.1',
  default_options : ['warning_level=3'],
)

dependencies = [
]

sources = [
  'tmp.c',
]

exe = executable(
  'tmp',
  sources,
  dependencies : dependencies,
  install : true,
)

test('basic', exe)
```

简洁又清晰，完全不像CMake各种乱七八糟的大写字母满天飞。

### 自动生成的compile_commands.json

各种语言服务器和各种静态分析工具都需要的文件。

在CMake中你需要在执行 cmake 命令时，通过 -D 参数传递变量 CMAKE_EXPORT_COMPILE_COMMANDS。或者将这个配置写在CMakeLists.txt里
```cmake
cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..
```
而在Meson中，这是自带的！

### 不会混乱的缓存

CMake的缓存机制设计是“假设环境是不变的”。但是在实际开发时，不变，是不太可能的。所以需要经常`rm -rf build`

Meson的体验是：你几乎永远不需要执行`rm -rf build`。绝大多数情况下，你只需要修改`meson.build`，然后直接运行`meson compile`（它会自动调用配置），Meson 就会帮你处理好所有的一致性问题。

### 友好的交叉编译

我之前经常使用CMake，但是我到现在都没有记住cmake用于指定cross.cmake的宏的名字叫什么。

但是如果你用Meson，如果你用fish，你只需要输入`meson --c`，然后按一下Tab，你想要的参数会自动跳出来。不过就算这是fish的功劳，但是cmake那一大坨宏也不支持fish的补全啊

依旧继续提一嘴的——简洁易读。看看cmake和meson配置交叉编译时的语法区别吧：
```ini
[binaries]
c = 'arm-none-eabi-gcc'
cpp = 'arm-none-eabi-g++'
ar = 'arm-none-eabi-ar'
strip = 'arm-none-eabi-strip'
size = 'arm-none-eabi-size'
objcopy = 'arm-none-eabi-objcopy'

[host_machine]
system = 'generic'
cpu_family = 'arm'
cpu = 'cortex-m4'
endian = 'little'

[built-in options]
c_args = ['-mcpu=cortex-m4', '-Wall', '-Wextra', '-Wpedantic', '-fdata-sections', '-ffunction-sections', '--specs=picolibc.specs', ]
cpp_args = ['-mcpu=cortex-m4', '-Wall', '-Wextra', '-Wpedantic','-fdata-sections', '-ffunction-sections', '-fno-rtti', '-fno-exceptions', '-fno-threadsafe-statics', '--specs=picolibc.specs',]
c_link_args = ['--specs=picolibc.specs','-Wl,--gc-sections','-Wl,--print-memory-usage', '-nostartfiles']
cpp_link_args = ['--specs=picolibc.specs','-Wl,--gc-sections','-Wl,--print-memory-usage', '-nostartfiles']
```

```cmake
set(CMAKE_SYSTEM_NAME               Generic)
set(CMAKE_SYSTEM_PROCESSOR          arm)

set(CMAKE_C_COMPILER_ID GNU)
set(CMAKE_CXX_COMPILER_ID GNU)

# Some default GCC settings
# arm-none-eabi- must be part of path environment
set(TOOLCHAIN_PREFIX                arm-none-eabi-)

set(CMAKE_C_COMPILER                ${TOOLCHAIN_PREFIX}gcc.exe)
set(CMAKE_ASM_COMPILER              ${CMAKE_C_COMPILER})
set(CMAKE_CXX_COMPILER              ${TOOLCHAIN_PREFIX}g++.exe)
set(CMAKE_LINKER                    ${TOOLCHAIN_PREFIX}g++.exe)
set(CMAKE_OBJCOPY                   ${TOOLCHAIN_PREFIX}objcopy)
set(CMAKE_SIZE                      ${TOOLCHAIN_PREFIX}size)

set(CMAKE_EXECUTABLE_SUFFIX_ASM     ".elf")
set(CMAKE_EXECUTABLE_SUFFIX_C       ".elf")
set(CMAKE_EXECUTABLE_SUFFIX_CXX     ".elf")

set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

set(TARGET_FLAGS "-mcpu=cortex-m4 ")

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${TARGET_FLAGS}")
set(CMAKE_ASM_FLAGS "${CMAKE_C_FLAGS} -x assembler-with-cpp -MMD -MP")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -Wpedantic -fdata-sections -ffunction-sections")

set(CMAKE_C_FLAGS_DEBUG "-O0 -g3")
set(CMAKE_C_FLAGS_RELEASE "-Os -g0")
set(CMAKE_CXX_FLAGS_DEBUG "-O0 -g3")
set(CMAKE_CXX_FLAGS_RELEASE "-Os -g0")

set(CMAKE_CXX_FLAGS "${CMAKE_C_FLAGS} -fno-rtti -fno-exceptions -fno-threadsafe-statics")

set(CMAKE_C_LINK_FLAGS "${TARGET_FLAGS}")
set(CMAKE_C_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} --specs=nano.specs")
set(CMAKE_C_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} -Wl,-Map=${CMAKE_PROJECT_NAME}.map -Wl,--gc-sections")
set(CMAKE_C_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} -Wl,--print-memory-usage")

set(CMAKE_CXX_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} -Wl,--start-group -lstdc++ -lsupc++ -Wl,--end-group")
```

请问真的有人受得了这一大坨大写字母吗？

### 合理的依赖解决

CMake和Meson都可以自动寻找系统中已有的依赖。但是如果Meson没找到，可以自动fallback到拉取源码过来自己编译，而CMake如果报错，则需要你手动一个个解决依赖问题。

Meson项目，放在subprojects目录下的子目录，会自动跟着一起编译（如果写了build_by_default: true的话）。并且我觉得Meson在与子项目向上传递依赖这一部分也做的比CMake好（这个以后再补充）