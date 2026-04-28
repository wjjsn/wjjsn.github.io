---
lang: zh-CN
title: Meson传递依赖的方法
description: 深入解析Meson构建系统中的依赖管理机制。本文详细讲解了如何通过declare_dependency传递依赖，对比分析了接口库与静态库的最佳实践，并全面覆盖了fallback机制与子项目配置技巧。助你快速掌握高效的构建流程。
---


## 核心API

### 先看获取依赖的API：
```python

# 依赖列表
dependencies = [
  dependency('foo')
]

# 源文件列表
sources = [
  'foo.c',
]

# 声明一个可执行文件
exe = executable(
  'foo',# 可执行文件的名字
  sources, # 上面创建的变量
  dependencies : dependencies, # 上面创建的变量
  install : true, # 是否安装到系统
  c_args:['-w'] # 添加对C语言的编译参数
)
```
看到这个`dependency('foo')`meson会先去系统库查找。系统找不到，会找cmake和pkg-config，如果这些地方都找不到，并且你没有写fallback，它会直接失败。

但是如果你在主项目这么写`dependency('foo', fallback: ['foo', 'foo_dep'])`，它就会fallback到[子项目](挖坑待填/meson子项目)。你写了fallback, 它就会去子项目里找。这里fallback的两个参数：`foo`是子项目的目录名，`foo_dep`是子项目中使用`foo_dep=declare_dependency`声明的变量。

如果子项目写了这个`meson.override_dependency('foo', foo_dep)`，那么在主项目路可以直接使用`dependency('foo', fallback: 'foo')`，meson会自动去子项目找依赖。

### 看声明依赖的API
```python
# foo_inc和all_src是变量名，想写什么都可以

# 写上你想要include的路径，注意在meson中，请使用/操作符安全的拼接路径，否则在Windows编译时可能出现问题
foo_inc = include_directories( 
    'CMSIS'/'GD'/'GD32F4xx'/'Include',# 不要这样写：'CMSIS/GD/GD32F4xx/Include'
)

all_src = [
    foo.c
]

foo_dep = declare_dependency(
    include_directories: foo_inc,
    sources: all_src,
    compile_args: ['-mcpu=cortex-m4', '-mthumb', '-D' + chip_family],
    link_args: ['-T', chip_ld_map[option_chip]],
)

```
另一种写法
```python
foo_inc = include_directories( 
    'CMSIS'/'GD'/'GD32F4xx'/'Include',# 不要这样写：'CMSIS/GD/GD32F4xx/Include'
)

all_src = [
    foo.c
]

foo_lib = static_library(
    'foo_lib', 
    all_src,
    include_directories: foo_inc,
    c_args: ['-mcpu=cortex-m4', '-mthumb', '-D' + chip_family] # 编译库本身时使用的参数
)

foo_dep = declare_dependency(
    link_with: foo_lib,
    compile_args: ['-mcpu=cortex-m4', '-mthumb', '-D' + chip_family], # 将编译参数传递给其它工程
    link_args: ['-T', chip_ld_map[option_chip]],
)
```
`declare_dependency`支持的更多参数，请参看[官方文档](https://mesonbuild.com/Reference-manual_functions_declare_dependency.html)

declare_dependency，可以声明include路径和源码的路径,也同时可以向上游的工程添加编译的参数和链接时的参数。

`static_library`支持的更多参数，请参看[官方文档](https://mesonbuild.com/Reference-manual_functions_static_library.html)


如果你不想把你的项目编译成一个静态库。就不需要使用`static_library`。

第一种写法可以看作为类似于cmake的接口库，你不需要生成一个静态库，而是只传递依赖。

也可以先编译成一个静态库，然后再link_with这个静态库。一般来说建议使用这个做法，避免直接传递源码导致一个源文件被反复编译。
