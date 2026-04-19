---
lang: zh-CN
title: GCC vs Clang 嵌入式编译器内存占用对比分析
description: 对比 GCC 和 Clang 编译器在 ARM 嵌入式开发中的内存占用情况，包括不开优化和开启 -Oz 优化时的 RAM 和 FLASH 使用对比。
---

# 版本

```powershell
PS >arm-none-eabi-gcc -v
Using built-in specs.
COLLECT_GCC=C:\Users\28584\gcc-arm-none-eabi\bin\arm-none-eabi-gcc.exe
COLLECT_LTO_WRAPPER=C:/Users/28584/gcc-arm-none-eabi/bin/../libexec/gcc/arm-none-eabi/14.3.1/lto-wrapper.exe
Target: arm-none-eabi
Configured with: /data/jenkins/workspace/GNU-toolchain/arm-14-5/src/gcc/configure --target=arm-none-eabi
--prefix=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/install
--with-gmp=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--with-mpfr=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--with-mpc=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--with-isl=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--disable-shared --disable-nls --disable-threads --disable-tls
--enable-checking=release --enable-languages=c,c++,fortran
--with-newlib --with-gnu-as --with-headers=yes --with-gnu-ld --with-native-system-header-dir=/include
--with-sysroot=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/install/arm-none-eabi
--with-bugurl=https://bugs.linaro.org/ --with-multilib-list=aprofile,rmprofile
--with-libiconv-prefix=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--with-libiconv-prefix=/data/jenkins/workspace/GNU-toolchain/arm-14-5/build-mingw-arm-none-eabi/host-tools
--enable-mingw-wildcard --host=x86_64-w64-mingw32 --with-pkgversion='Arm GNU Toolchain 14.3.Rel1 (Build arm-14.174)'
Thread model: single
Supported LTO compression algorithms: zlib
gcc version 14.3.1 20250623 (Arm GNU Toolchain 14.3.Rel1 (Build arm-14.174))
```

```powershell
PS > clang -v
clang version 21.1.1
Target: armv7m-unknown-none-eabi
Thread model: posix
InstalledDir: C:\Users\28584\armclang\bin
Arm Toolchain ID: E0058 (1bbd3573)
```

# 不开优化

gcc

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       14424 B        20 KB     70.43%
[build]            FLASH:       47564 B        64 KB     72.58%
```

---

clang

<!-- [build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       14720 B        20 KB     71.88%
[build]            FLASH:       80552 B        64 KB    122.91% -->

忘记`-fdata-sections -ffunction-sections`了

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       13968 B        20 KB     68.20%
[build]            FLASH:       34936 B        64 KB     53.31%
```

# 开优化(-Oz)

gcc

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       14392 B        20 KB     70.27%
[build]            FLASH:       27152 B        64 KB     41.43%
```

---

clang

<!-- [build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       14704 B        20 KB     71.80%
[build]            FLASH:         43 KB        64 KB     67.19% -->

```
[build] Memory region         Used Size  Region Size  %age Used
[build]              RAM:       13968 B        20 KB     68.20%
[build]            FLASH:       27256 B        64 KB     41.59%
```

# 总结

~~clang拉完了😅~~

clang也挺强的

