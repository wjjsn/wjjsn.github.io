---
lang: zh-CN
title: 嵌入式高性能格式化库 em_fmt 性能对比测试
description: 深入对比 em_fmt 库与标准库（printf、cout、std::print）在嵌入式环境下的性能表现。测试数据显示 em_fmt 在 debug 和 release 模式下均显著优于传统方案，无动态内存分配，适合资源受限的嵌入式系统。
---

那看来我为嵌入式写的库还不错，没有使用动态内存就爆杀了（当然还有很多要改进的地方）

---
debug
em_fmt:10867ms
printf:34183ms
cout:12396ms
std_print:9103ms

release：
em_fmt:10997ms
printf:32953ms
cout:11207ms
std_print:7193ms

---
```cpp
#include "em_fmt.hpp"
#include <cstddef>
#include <cstdio>
#include <chrono>
#include <iostream>
#include <ostream>
#include <print>
using namespace em;

int main() {
    std::size_t em_fmt, std_printf, std_cout, std_print;

    using namespace std::chrono;
    {
        auto start = steady_clock::now();
        for (int i = 0; i < 100; ++i) {
            for (int j = 0; j < 1145; ++j) {
                em::fprint<"em_fmt out :{} {}\n">(stdout, i, j);
            }
        }
        auto end   = steady_clock::now();
        auto dt_us = duration_cast<milliseconds>(end - start);
        em_fmt     = dt_us.count();
    }

    {
        auto start = steady_clock::now();
        for (int i = 0; i < 100; ++i) {
            for (int j = 0; j < 1145; ++j) {
                printf("std_printf :%d %d\n", i, j);
            }
        }
        auto end   = steady_clock::now();
        auto dt_us = duration_cast<milliseconds>(end - start);
        std_printf = dt_us.count();
    }
    {
        auto start = steady_clock::now();
        for (int i = 0; i < 100; ++i) {
            for (int j = 0; j < 1145; ++j) {
                std::cout << "std_cout   :" << i << " " << j << std::endl;
            }
        }
        auto end   = steady_clock::now();
        auto dt_us = duration_cast<milliseconds>(end - start);
        std_cout   = dt_us.count();
    }
    {
        auto start = steady_clock::now();
        for (int i = 0; i < 100; ++i) {
            for (int j = 0; j < 1145; ++j) {
                std::println("std_print  :{} {}", i, j);
            }
        }
        auto end   = steady_clock::now();
        auto dt_us = duration_cast<milliseconds>(end - start);
        std_print  = dt_us.count();
    }
    em::fprint<"em_fmt:{}ms\nprintf:{}ms\ncout:{}ms\nstd_print:{}ms\n">(stdout, em_fmt, std_printf, std_cout, std_print);
}
```
