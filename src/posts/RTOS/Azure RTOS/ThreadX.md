---
lang: zh-CN
title: ThreadX 线程创建详解
description: 详细讲解Azure RTOS ThreadX的线程创建方法，包括静态创建与动态创建的区别、线程优先级、抢占式调度等核心概念。
---

RTOS之间都是很像的，除了每个RTOS自己有的特性，别的（任务创建、信号量、互斥锁等）都是通用的

# 特性
1. 线程抢占式屏蔽
# 线程
## 创建线程
### 由STM32CuBeMX创建的工程，初始化的流程是这样的：
1. main函数首先进行时钟和GPIO的初始化，然后调用`MX_ThreadX_Init();`这个函数里面只有一句话是`tx_kernel_enter();`，也就是启动RTOS的内核，该函数会调用AZURE_RTOS/app_azure_rtos.c里面的`VOID tx_application_define(VOID *first_unused_memory)`这个函数会为线程创建内存池，然后调用Core/Src/app_threadx.c下的`UINT App_ThreadX_Init(VOID *memory_ptr)`和其他的函数如`UINT MX_USBX_Device_Init(VOID *memory_ptr)`（如果启用了USBX的话，其他同理）进行初始化线程。
### 线程的创建又分为两种
首先是静态的创建：MX生成之后的代码默认是这样的
```c
UINT App_ThreadX_Init(VOID *memory_ptr)
{
UINT ret = TX_SUCCESS;
TX_BYTE_POOL *byte_pool = (TX_BYTE_POOL*)memory_ptr;

/* USER CODE BEGIN App_ThreadX_Init */
(void)byte_pool;
/* USER CODE END App_ThreadX_Init */

return ret;
}
```
其中的`(void)byte_pool;`显式的忽略了由`tx_application_define`这个函数传递过来的内存池指针，意思就是使用静态的线程创建。
不管是动态的创建还是静态的创建，首先要创建的是这个线程的句柄。
示例：`TX_THREAD LED_thread;`注意该句柄应为全局变量。
静态创建的方式应创建一个内存块作为该线程的栈并把这个内存块的首地址和大小传递给创建任务的函数。示例：
```c
#define LED_THREAD_STACK_SIZE 1024
UCHAR LED_thread_stack[LED_THREAD_STACK_SIZE] __attribute__((aligned(4)));
```
`__attribute__((aligned(4)))`是GCC的扩展语法，强制内存4字节对齐。
#### 创建线程的API
创建线程的API是`tx_thread_create(TX_THREAD *thread_ptr, CHAR *name_ptr, VOID (*entry_function)(ULONG id), ULONG entry_input,VOID *stack_start, ULONG stack_size, UINT priority, UINT preempt_threshold,ULONG time_slice, UINT auto_start)`。要传递的参数分别是：线程句柄的指针、线程名称字符串的首地址、线程入口函数的地址、传递给入口函数的参数、栈的首地址、栈的大小、线程优先级、抢占式调度优先级禁用范围、时间片流转的周期选择、指定线程在创建后是立即启动还是挂起。
线程的优先级为0到TX_MAX_PRIORITIES-1，优先级数值越小，实际优先级越高。
抢占式调度优先级禁用范围为0到TX_MAX_PRIORITIES-1，该值必须小于等于该线程的优先级数值，当该值等于优先级数值时，该功能禁用。（例如该线程的优先级是10，抢占式调度优先级禁用范围为7，那么7到10之间的这个优先级范围内的其他线程不会抢占该线程）**这是ThreadX的特色功能**。
若设定系统心跳频率为1000Hz，也就是系统的周期为1ms，time_slice是指定当可以执行时间片流转时，当前这个线程可以执行多少个周期（假设设置为1，则当时间片可流转时，将会在一个系统周期后流转时间片），**使用抢占阈值或将该值设置为0将会禁用时间片流转**。时间片流转会造成少量开销，如果该优先级只有一个线程，那么不应该启用时间片流转。
指定线程是立即启动还是置于挂起状态。 合法选项为 TX_AUTO_START(0x01) 和TX_DONT_START(0x00) 。 如果指定了 TX_DONT_START，应用程序随后必须调用 tx_thread_resume 以便线程运行。
#### 静态方式创建线程的示例：
```c
ret=tx_thread_create(&LED_thread, "LED_thread", LED_thread_entry, 0, LED_thread_stack, LED_THREAD_STACK_SIZE, 31, 31, TX_NO_TIME_SLICE, TX_AUTO_START);
```
ret为API返回值，使用这个值来得知调用这个API是否成功（TX_SUCCESS），若失败也可以看到更具体的信息。
#### 动态方式创建线程的示例：
```c
#define LED_THREAD_STACK_SIZE 128*3//实测256字节的栈不够点灯用的
UINT App_ThreadX_Init(VOID *memory_ptr)
{
UINT ret = TX_SUCCESS;
TX_BYTE_POOL *byte_pool = (TX_BYTE_POOL*)memory_ptr;
/* USER CODE BEGIN App_ThreadX_Init */
UCHAR *LED_thread_stack = NULL;
ret=tx_byte_allocate(byte_pool, (VOID**)&LED_thread_stack, LED_THREAD_STACK_SIZE, TX_NO_WAIT);//从总内存池中分配内存
ret=tx_thread_create(&LED_thread, "LED_thread", LED_thread_entry, 0, LED_thread_stack, LED_THREAD_STACK_SIZE, 31, 31, TX_NO_TIME_SLICE, TX_AUTO_START);
/* USER CODE END App_ThreadX_Init */
return ret;
}
```
需要注意`&LED_thread_stack`，取地址后这是一个双重指针。如果在单重指针的基础上去理解双重指针就比较好理解了：如果一个函数想要在内部去修改一个外部变量的值，那么我们会将这个变量取地址然后再传给该函数。同理，如果我们想要在函数内部修改外部指针指向的地址，那么对这个指针取地址。取地址后的类型为`UCHAR**`，函数要求的指针类型为`VOID**`所以进行强制转换。