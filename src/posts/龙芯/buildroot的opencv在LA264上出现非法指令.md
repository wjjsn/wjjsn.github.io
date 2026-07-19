---
lang: zh-CN
title: buildroot的opencv在LA264上出现非法指令
description:  排查并解决buildroot的opencv在LA264上出现非法指令，修复后给上游发送补丁邮件并合并
---

一开始我非常疑惑——内核、buildroot、我的程序，这三个用同一个编译器编译的，怎么会出现非法指令呢？如果我的程序是非法指令，那内核和用户态的init程序应该也是跑不起来的。

在解决完后的上帝视角来看是很简单的问题，但如果要是在当时，应该怎么排查呢？现在想来思路是很清晰了，但是为什么我当时会被困住打转，这才是我想要研究的。

## 探索时

```log
# ./pid-test 
Illegal instruction 

# file ./pid-test 
./pid-test: ELF 64-bit LSB pie executable, LoongArch, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-loongarch-lp64d.so.1, for GNU/Linux 5.19.0, stripped 

# readelf -h ./pid-test 
ELF Header:  
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00   
  Class:                             ELF64   
  Data:                              2's complement, little endian   Version:                           1 (current)   
  OS/ABI:                            UNIX - System V   
  ABI Version:                       0   
  Type:                              DYN (Position-Independent Executable file)   
  Machine:                           LoongArch   
  Version:                           0x1   
  Entry point address:               0x9f20   
  Start of program headers:          64 (bytes into file)   
  Start of section headers:          197016 (bytes into file)   
  Flags:                             0x43, DOUBLE-FLOAT, OBJ-v1   
  Size of this header:               64 (bytes)   
  Size of program headers:           56 (bytes)   
  Number of program headers:         9   
  Size of section headers:           64 (bytes)   
  Number of section headers:         26   
  Section header string table index: 25 

# cat /etc/os-release 
NAME=Buildroot 
VERSION=2026.05-rc3-49-g7811063db2 
ID=buildroot VERSION_ID=2026.05-rc3 
PRETTY_NAME="Buildroot 2026.05-rc3" 

# cat /proc/cpuinfo 
system type             : generic-loongson-machine 
processor               : 0 
package                 : 0 
core                    : 0 
global_id               : 0 
CPU Family              : Loongson-64bit 
Model Name              : Loongson-2K0300 
PRID                    : LA264 (0014a030) 
CPU Revision            : 0x30 
FPU Revision            : 0x00 
CPU MHz                 : 1000.00 
BogoMIPS                : 2000.00 
TLB Entries             : 64 
Address Sizes           : 40 bits physical, 40 bits virtual 
ISA                     : loongarch32r loongarch32s loongarch64 
Features                : cpucfg lam fpu crc32 lspw lbt_mips 
Hardware Watchpoint     : yes, iwatch count: 4, dwatch count: 2
```

看了一圈这些东西我感觉没什么问题。一开始我是怀疑没有fpu，但去翻了一遍数据手册说是有的。

```log
Dynamic section at offset 0x2f8c8 contains 37 entries:
  Tag        Type                         Name/Value
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_gapi.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_highgui.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_video.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_videoio.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_imgcodecs.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_imgproc.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libopencv_core.so.413]
 0x0000000000000001 (NEEDED)             Shared library: [libstdc++.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [libm.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [libgcc_s.so.1]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [ld-linux-loongarch-lp64d.so.1]
 0x0000000000000019 (INIT_ARRAY)         0x3f870
 0x000000000000001b (INIT_ARRAYSZ)       16 (bytes)
 0x000000000000001a (FINI_ARRAY)         0x3f880
 0x000000000000001c (FINI_ARRAYSZ)       8 (bytes)
 0x0000000000000004 (HASH)               0x260
 0x000000006ffffef5 (GNU_HASH)           0xd78
 0x0000000000000005 (STRTAB)             0x41a0
 0x0000000000000006 (SYMTAB)             0x1800
 0x000000000000000a (STRSZ)              17398 (bytes)
 0x000000000000000b (SYMENT)             24 (bytes)
 0x0000000000000015 (DEBUG)              0x0
 0x0000000000000003 (PLTGOT)             0x3fb58
 0x0000000000000002 (PLTRELSZ)           1848 (bytes)
 0x0000000000000014 (PLTREL)             RELA
 0x0000000000000017 (JMPREL)             0x92f0
 0x0000000000000007 (RELA)               0x8a20
 0x0000000000000008 (RELASZ)             2256 (bytes)
 0x0000000000000009 (RELAENT)            24 (bytes)
 0x0000000000000018 (BIND_NOW)
 0x000000006ffffffb (FLAGS_1)            Flags: NOW PIE
 0x000000006ffffffe (VERNEED)            0x8910
 0x000000006fffffff (VERNEEDNUM)         4
 0x000000006ffffff0 (VERSYM)             0x8596
 0x000000006ffffff9 (RELACOUNT)          78
 0x0000000000000000 (NULL)               0x0

```

实际上ChatGPT一开始说的就是对的
````markdown
### 最直接的验证

编译一个最小程序：

```c
int main(void)
{
    return 0;
}
```

然后运行。

如果连这个都：

```text
Illegal instruction
```

那么问题不在你的程序，而在：

```text
crt1.o
glibc
ld.so
或者工具链默认 ISA
```

---

### 再看程序到底死在哪里

板子上：

```bash
gdb ./pid-test
```

然后：

```gdb
run
```

出现 SIGILL 后：

```gdb
x/i $pc
```

或者：

```gdb
disassemble $pc-32,$pc+32
```

直接能看到是哪条指令非法。
````

由于我忘记了这个程序并不是一个简单的测试程序，依赖不少库：
```
libopencv_core.so.413
libopencv_imgproc.so.413
libopencv_videoio.so.413
libstdc++.so.6
```
所以：
```
./pid-test
Illegal instruction
```
未必是我自己的 main()。

有可能死在：
```
ld.so
glibc
libstdc++
opencv
全局构造函数
```
任何地方。

所以问题其实很简单，编译一个最简程序，如果这个也报错非法指令，说明工具链有问题。如果这个程序没问题，说明链接进来的库有问题。

或者直接用gdb运行，等待signal call，再直接看附近触发非法指令的代码是什么，就可以轻松找到问题了。

## 解决时

我先确认了是工具链的问题还是第三方库的问题。我编译了一个printf输出浮点数相加结果的程序，运行正常，没有任何问题。所以问题出在链接进来的库。

用gdb运行，看日志：
```
Program received signal SIGILL, Illegal instruction.
 0x0000007ff05d6314 in ?? () from /usr/lib64/libopencv_core.so.413
(gdb) bt 
#0 0x0000007ff05d6314 in ?? () from /usr/lib64/libopencv_core.so.413 
#1 0x0000007ff05d6554 in ?? () from /usr/lib64/libopencv_core.so.413 
#2 0x0000007ff05d6980 in ?? () from /usr/lib64/libopencv_core.so.413 
#3 0x0000007ff042b5cc in ?? () from /usr/lib64/libopencv_core.so.413 
#4 0x0000007ff0353efc in ?? () from /usr/lib64/libopencv_core.so.413 
#5 0x0000007ff122975c in call_init.part () from /lib64/ld-linux-loongarch-lp64d.so.1 
#6 0x0000007ff12298ac in _dl_init () from /lib64/ld-linux-loongarch-lp64d.so.1 
#7 0x0000007ff1241a90 in _start () from /lib64/ld-linux-loongarch-lp64d.so.1
```
所以是在加载opencv的时候崩溃的。看一眼用了什么指令，如果出现了向量指令说明是opencv编译时的编译选项有问题。
```gdb
(gdb) x/10i $pc-16
   0x7ff2f96304:        move            $a0, $sp
   0x7ff2f96308:        move            $a1, $s1
   0x7ff2f9630c:        bl              -8364   # 0x7ff2f94260
   0x7ff2f96310:        ld.d            $t0, $sp, 16
=> 0x7ff2f96314:        vld             $vr0, $sp, 0
   0x7ff2f96318:        ld.d            $s5, $s1, 32
   0x7ff2f9631c:        ld.d            $s2, $s1, 40
   0x7ff2f96320:        vst             $vr0, $s1, 32
   0x7ff2f96324:        st.d            $t0, $s1, 48
   0x7ff2f96328:        beq             $s5, $s2, 56    # 0x7ff2f96360
```
命令拆解

```
x/10i $pc-16
```

- **`x`** = **examine**（检查内存）命令
- **`/10i`** = 格式说明符
  - `10` = 显示 **10 条**指令
  - `i` = 将内存内容**解释为机器指令**（`i` = instruction）
- **`$pc-16`** = 从当前程序计数器 **往前 16 字节** 的地址开始

**连起来**：从 `$pc - 16` 这个地址开始，连续反汇编 **10 条指令**。

可以看到使用了`vld`指令，vld = Vector Load。

实际上LA264不支持向量指令，所以报错了，下一步就是排查向量指令的编译选项是哪里混进来的。

后续再buildroot里找了一番，确认是opencv的自动探测编译器能力是用来向量扩展，而不是使用buildroot中对于芯片的选项，直接在命令行传参让opencv不要使用向量扩展就好了。

然后顺便把这个问题修了，[给上游发了个邮件](https://lists.buildroot.org/pipermail/buildroot/2026-June/803701.html)
