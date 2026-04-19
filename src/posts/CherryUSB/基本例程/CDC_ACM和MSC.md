---
lang: zh-CN
title: CherryUSB CDC_ACM与MSC复合设备开发详解
description: 全面介绍CherryUSB CDC_ACM和MSC组合设备的开发，包含USB描述符配置、端点地址规则、回调函数注册机制以及完整的源码注释和详细解说。
---

# 例程源码
可在github仓库下载
```c
#if 1
/*
 * Copyright (c) 2024, sakumisu
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#include "usbd_core.h"
#include "usbd_cdc_acm.h"
#include "usbd_msc.h"

#if CONFIG_USBDEV_EP_NUM < 6
#error endpoint number is too small for this demo, please try other chips
#endif

/*!< endpoint address */
#define CDC_IN_EP		   0x81
#define CDC_OUT_EP		   0x02
#define CDC_INT_EP		   0x83

#define MSC_IN_EP		   0x84
#define MSC_OUT_EP		   0x05

#define USBD_VID		   0xFFFF
#define USBD_PID		   0xFFFF
#define USBD_MAX_POWER	   100
#define USBD_LANGID_STRING 1033

/*!< config descriptor size */
#define USB_CONFIG_SIZE (9 + CDC_ACM_DESCRIPTOR_LEN + MSC_DESCRIPTOR_LEN)

#ifdef CONFIG_USB_HS
#define CDC_MAX_MPS 512
#else
#define CDC_MAX_MPS 64
#endif

#ifdef CONFIG_USB_HS
#define MSC_MAX_MPS 512
#else
#define MSC_MAX_MPS 64
#endif

#ifdef CONFIG_USBDEV_ADVANCE_DESC
static const uint8_t device_descriptor[] = {
	USB_DEVICE_DESCRIPTOR_INIT(USB_2_0, 0xEF, 0x02, 0x01, USBD_VID, USBD_PID, 0x0100, 0x01)};

static const uint8_t config_descriptor[] = {
	USB_CONFIG_DESCRIPTOR_INIT(USB_CONFIG_SIZE, 0x03, 0x01, USB_CONFIG_BUS_POWERED, USBD_MAX_POWER),
	CDC_ACM_DESCRIPTOR_INIT(0x00, CDC_INT_EP, CDC_OUT_EP, CDC_IN_EP, CDC_MAX_MPS, 0x02),
	MSC_DESCRIPTOR_INIT(0x02, MSC_OUT_EP, MSC_IN_EP, MSC_MAX_MPS, 0x00)};

static const uint8_t device_quality_descriptor[] = {
	///////////////////////////////////////
	/// device qualifier descriptor
	///////////////////////////////////////
	0x0a,
	USB_DESCRIPTOR_TYPE_DEVICE_QUALIFIER,
	0x00,
	0x02,
	0x00,
	0x00,
	0x00,
	0x40,
	0x00,
	0x00,
};

static const char *string_descriptors[] = {
	(const char[]){0x09, 0x04}, /* Langid */
	"Manufacturer",				/* Manufacturer */
	"Product",					/* Product */
	"2022123456",				/* Serial Number */
};

static const uint8_t *device_descriptor_callback(uint8_t speed)
{
	return device_descriptor;
}

static const uint8_t *config_descriptor_callback(uint8_t speed)
{
	return config_descriptor;
}

static const uint8_t *device_quality_descriptor_callback(uint8_t speed)
{
	return device_quality_descriptor;
}

static const char *string_descriptor_callback(uint8_t speed, uint8_t index)
{
	if (index > 3)
	{
		return NULL;
	}
	return string_descriptors[index];
}

const struct usb_descriptor cdc_msc_descriptor = {
	.device_descriptor_callback			= device_descriptor_callback,
	.config_descriptor_callback			= config_descriptor_callback,
	.device_quality_descriptor_callback = NULL,
	.string_descriptor_callback			= string_descriptor_callback};
#else
/*!< global descriptor */
static const uint8_t cdc_msc_descriptor[] = {
	USB_DEVICE_DESCRIPTOR_INIT(USB_2_0, 0xEF, 0x02, 0x01, USBD_VID, USBD_PID, 0x0100, 0x01),
	USB_CONFIG_DESCRIPTOR_INIT(USB_CONFIG_SIZE, 0x03, 0x01, USB_CONFIG_BUS_POWERED, USBD_MAX_POWER),
	CDC_ACM_DESCRIPTOR_INIT(0x00, CDC_INT_EP, CDC_OUT_EP, CDC_IN_EP, CDC_MAX_MPS, 0x02),
	MSC_DESCRIPTOR_INIT(0x02, MSC_OUT_EP, MSC_IN_EP, MSC_MAX_MPS, 0x00),
	///////////////////////////////////////
	/// string0 descriptor
	///////////////////////////////////////
	USB_LANGID_INIT(USBD_LANGID_STRING),
	///////////////////////////////////////
	/// string1 descriptor
	///////////////////////////////////////
	0x14,						/* bLength */
	USB_DESCRIPTOR_TYPE_STRING, /* bDescriptorType */
	'C', 0x00,					/* wcChar0 */
	'h', 0x00,					/* wcChar1 */
	'e', 0x00,					/* wcChar2 */
	'r', 0x00,					/* wcChar3 */
	'r', 0x00,					/* wcChar4 */
	'y', 0x00,					/* wcChar5 */
	'U', 0x00,					/* wcChar6 */
	'S', 0x00,					/* wcChar7 */
	'B', 0x00,					/* wcChar8 */
	///////////////////////////////////////
	/// string2 descriptor
	///////////////////////////////////////
	0x26,						/* bLength */
	USB_DESCRIPTOR_TYPE_STRING, /* bDescriptorType */
	'C', 0x00,					/* wcChar0 */
	'h', 0x00,					/* wcChar1 */
	'e', 0x00,					/* wcChar2 */
	'r', 0x00,					/* wcChar3 */
	'r', 0x00,					/* wcChar4 */
	'y', 0x00,					/* wcChar5 */
	'U', 0x00,					/* wcChar6 */
	'S', 0x00,					/* wcChar7 */
	'B', 0x00,					/* wcChar8 */
	' ', 0x00,					/* wcChar9 */
	'C', 0x00,					/* wcChar10 */
	'-', 0x00,					/* wcChar11 */
	'M', 0x00,					/* wcChar12 */
	' ', 0x00,					/* wcChar13 */
	'D', 0x00,					/* wcChar14 */
	'E', 0x00,					/* wcChar15 */
	'M', 0x00,					/* wcChar16 */
	'O', 0x00,					/* wcChar17 */
	///////////////////////////////////////
	/// string3 descriptor
	///////////////////////////////////////
	0x16,						/* bLength */
	USB_DESCRIPTOR_TYPE_STRING, /* bDescriptorType */
	'2', 0x00,					/* wcChar0 */
	'0', 0x00,					/* wcChar1 */
	'2', 0x00,					/* wcChar2 */
	'2', 0x00,					/* wcChar3 */
	'1', 0x00,					/* wcChar4 */
	'2', 0x00,					/* wcChar5 */
	'3', 0x00,					/* wcChar6 */
	'4', 0x00,					/* wcChar7 */
	'5', 0x00,					/* wcChar8 */
	'6', 0x00,					/* wcChar9 */
#ifdef CONFIG_USB_HS
	///////////////////////////////////////
	/// device qualifier descriptor
	///////////////////////////////////////
	0x0a,
	USB_DESCRIPTOR_TYPE_DEVICE_QUALIFIER,
	0x00,
	0x02,
	0x00,
	0x00,
	0x00,
	0x40,
	0x00,
	0x00,
#endif
	0x00};
#endif

USB_NOCACHE_RAM_SECTION USB_MEM_ALIGNX uint8_t read_buffer[2048]; /* 2048 is only for test speed , please use CDC_MAX_MPS for common*/
USB_NOCACHE_RAM_SECTION USB_MEM_ALIGNX uint8_t write_buffer[2048];

volatile bool ep_tx_busy_flag = false;

static void usbd_event_handler(uint8_t busid, uint8_t event)
{
	switch (event)
	{
		case USBD_EVENT_RESET:
			break;
		case USBD_EVENT_CONNECTED:
			break;
		case USBD_EVENT_DISCONNECTED:
			break;
		case USBD_EVENT_RESUME:
			break;
		case USBD_EVENT_SUSPEND:
			break;
		case USBD_EVENT_CONFIGURED:
			ep_tx_busy_flag = false;
			/* setup first out ep read transfer */
			usbd_ep_start_read(busid, CDC_OUT_EP, read_buffer, 2048);
			break;
		case USBD_EVENT_SET_REMOTE_WAKEUP:
			break;
		case USBD_EVENT_CLR_REMOTE_WAKEUP:
			break;

		default:
			break;
	}
}

void usbd_cdc_acm_bulk_out(uint8_t busid, uint8_t ep, uint32_t nbytes)
{
	USB_LOG_RAW("actual out len:%d\r\n", (unsigned int)nbytes);
	/* setup next out ep read transfer */
	usbd_ep_start_read(busid, CDC_OUT_EP, read_buffer, 2048);
}

void usbd_cdc_acm_bulk_in(uint8_t busid, uint8_t ep, uint32_t nbytes)
{
	USB_LOG_RAW("actual in len:%d\r\n", (unsigned int)nbytes);

	if ((nbytes % usbd_get_ep_mps(busid, ep)) == 0 && nbytes)
	{
		/* send zlp */
		usbd_ep_start_write(busid, CDC_IN_EP, NULL, 0);
	}
	else
	{
		ep_tx_busy_flag = false;
	}
}

/*!< endpoint call back */
struct usbd_endpoint cdc_out_ep = {
	.ep_addr = CDC_OUT_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_out};

struct usbd_endpoint cdc_in_ep = {
	.ep_addr = CDC_IN_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_in};

struct usbd_interface intf0;
struct usbd_interface intf1;
struct usbd_interface intf2;

void cdc_acm_msc_init(uint8_t busid, uintptr_t reg_base)
{
#ifdef CONFIG_USBDEV_ADVANCE_DESC
	usbd_desc_register(busid, &cdc_msc_descriptor);
#else
	usbd_desc_register(busid, cdc_msc_descriptor);
#endif
	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf0));
	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf1));
	usbd_add_endpoint(busid, &cdc_out_ep);
	usbd_add_endpoint(busid, &cdc_in_ep);
	usbd_add_interface(busid, usbd_msc_init_intf(busid, &intf2, MSC_OUT_EP, MSC_IN_EP));

	usbd_initialize(busid, reg_base, usbd_event_handler);
}

volatile uint8_t dtr_enable = 0;

void usbd_cdc_acm_set_dtr(uint8_t busid, uint8_t intf, bool dtr)
{
	if (dtr)
	{
		dtr_enable = 1;
	}
	else
	{
		dtr_enable = 0;
	}
}

void cdc_acm_data_send_with_dtr_test(uint8_t busid)
{
	if (dtr_enable)
	{
		memset(&write_buffer[10], 'a', 2038);
		ep_tx_busy_flag = true;
		usbd_ep_start_write(busid, CDC_IN_EP, write_buffer, 2048);
		while (ep_tx_busy_flag)
		{
		}
	}
}

#define BLOCK_SIZE	512
#define BLOCK_COUNT 10

typedef struct
{
	uint8_t BlockSpace[BLOCK_SIZE];
} BLOCK_TYPE;

BLOCK_TYPE mass_block[BLOCK_COUNT];

void usbd_msc_get_cap(uint8_t busid, uint8_t lun, uint32_t *block_num, uint32_t *block_size)
{
	*block_num	= 1000; // Pretend having so many buffer,not has actually.
	*block_size = BLOCK_SIZE;
}
int usbd_msc_sector_read(uint8_t busid, uint8_t lun, uint32_t sector, uint8_t *buffer, uint32_t length)
{
	if (sector < 10)
		memcpy(buffer, mass_block[sector].BlockSpace, length);
	return 0;
}

int usbd_msc_sector_write(uint8_t busid, uint8_t lun, uint32_t sector, uint8_t *buffer, uint32_t length)
{
	if (sector < 10)
		memcpy(mass_block[sector].BlockSpace, buffer, length);
	return 0;
}
#endif
```
# 详细解说
## 端点地址
默认已经知道端点是做什么的。
```json
/*!< endpoint address */
#define CDC_IN_EP  0x81
#define CDC_OUT_EP 0x02
#define CDC_INT_EP 0x83
  
#define MSC_IN_EP  0x84
#define MSC_OUT_EP 0x05
//不知道为啥语言选c没有高亮
```
关于USB端点地址的定义规则：
1. USB端点地址格式：
	- 8位值，最高位(bit7)表示方向：1=IN(设备到主机)，0=OUT(主机到设备)
	- 低7位(bit0-bit6)是端点号(0-127)
2. 文件中的端点地址解释：
	- CDC_IN_EP 0x81 = 10000001b
		- bit7=1(IN端点)
		- 端点号=1
	- CDC_OUT_EP 0x02 = 00000010b
		- bit7=0(OUT端点)
		- 端点号=2
	- CDC_INT_EP 0x83 = 10000011b
		- bit7=1(IN端点)
		- 端点号=3
	- MSC_IN_EP 0x84 = 10000100b
		- bit7=1(IN端点)
		- 端点号=4
	- MSC_OUT_EP 0x05 = 00000101b
		- bit7=0(OUT端点)
		- 端点号=5
3. 端点号选择原则：
	- 端点0固定用于控制传输
	- 其他端点号可自由分配，但需确保不冲突
	- 通常CDC ACM使用端点1/2/3，MSC使用端点4/5
	- 具体值需与USB描述符中的定义一致
## 描述符
### 设备描述符
```c
static const uint8_t device_descriptor[] = {
    USB_DEVICE_DESCRIPTOR_INIT(USB_2_0, 0xEF, 0x02, 0x01, USBD_VID, USBD_PID, 0x0100, 0x01)
};
```

| 参数              | 示例值    | 说明                             |
| --------------- | ------ | ------------------------------ |
| bcdUSB          | 0x0200 | USB规范版本(BCD格式)，0x0200表示USB 2.0 |
| bDeviceClass    | 0xEF   | 设备类代码，0xEF表示复合设备               |
| bDeviceSubClass | 0x02   | 设备子类代码，0x02表示通用设备子类            |
| bDeviceProtocol | 0x01   | 设备协议代码，0x01表示接口相关协议            |
| idVendor        | 0xFFFF | 厂商ID，0xFFFF为测试用途               |
| idProduct       | 0xFFFF | 产品ID，0xFFFF为测试用途               |
| bcdDevice       | 0x0100 | 设备版本号(BCD格式)                   |
| iManufacturer   | 0x01   | 厂商字符串描述符索引                     |
```c
bDeviceClass = 0xEF,   // Miscellaneous Device Class
bDeviceSubClass = 0x02, // Common Class
bDeviceProtocol = 0x01  // Interface Association **Descriptor**
```
这个组合表示：
- 这是一个复合设备(包含多个功能)
- 使用通用设备子类
- 协议由接口描述符决定
### 配置描述符
```c
static const uint8_t config_descriptor[] = {
    USB_CONFIG_DESCRIPTOR_INIT(USB_CONFIG_SIZE, 0x03, 0x01, USB_CONFIG_BUS_POWERED, USBD_MAX_POWER),
    CDC_ACM_DESCRIPTOR_INIT(0x00, CDC_INT_EP, CDC_OUT_EP, CDC_IN_EP, CDC_MAX_MPS, 0x02),
    MSC_DESCRIPTOR_INIT(0x02, MSC_OUT_EP, MSC_IN_EP, MSC_MAX_MPS, 0x00)
};
```
只对非宏定义的部分进行讲解：
1. 0x03：接口数量。CDC-IN，CDC-OUT，MSC。**这里跟实际使用的接口数量必须匹配，不然会枚举失败**
```
bNumInterfaces = 0x03 // 包含：
├─ 0x00: CDC控制接口
│  ├─ 端点0（控制端点，隐含）
│  └─ CDC_INT_EP（中断端点）
├─ 0x01: CDC数据接口
│  ├─ CDC_OUT_EP（批量OUT）
│  └─ CDC_IN_EP（批量IN）
└─ 0x02: MSC接口
   ├─ MSC_OUT_EP（批量OUT）
   └─ MSC_IN_EP（批量IN）
```
2. 0x01：配置编号。取典型值1~255。用VSC使用不同的配置文件进入不同的工作空间来理解
3. 0x00：- CDC需要两个接口：通信接口 (Control Interface) 和 数据接口 (Data Interface)。此参数设置通信接口的编号，数据接口会自动设为 `bFirstInterface + 1`
4. 0x02：描述接口名称的字符串在描述符表中的索引号，设为 0 表示无名称
5. 0x02：这里使用了接口0x02
6. 0x00：参考第三点
### 特殊设备描述符
```c
static const uint8_t device_quality_descriptor[] = {
    // ///////////////////////////////////////
    // /// device qualifier descriptor
    // ///////////////////////////////////////
    // 0x0a,
    // USB_DESCRIPTOR_TYPE_DEVICE_QUALIFIER,
    // 0x00,
    // 0x02,
    // 0x00,
    // 0x00,
    // 0x00,
    // 0x40,
    // 0x00,
    // 0x00,
};
```
仅高速设备需要实现，用于表示该设备在全速模式下的兼容性。全速设备可以直接不写这一部分
### 字符串描述符
```c
static const char *string_descriptors[] = {
    (const char[]){0x09, 0x04}, /* Langid */
    "Manufacturer",             /* Manufacturer */
    "Product",                  /* Product */
    "2022123456",               /* Serial Number */
};
```
一个const类型的字符串数组，内容可以随便填，什么都不写也是可以的。
### 注册描述符获取回调函数
```c
static const uint8_t *device_descriptor_callback(uint8_t speed)
{
    return device_descriptor;
}
  
static const uint8_t *config_descriptor_callback(uint8_t speed)
{
    return config_descriptor;
}
  
static const uint8_t *device_quality_descriptor_callback(uint8_t speed)
{
    return device_quality_descriptor;
}
  
static const char *string_descriptor_callback(uint8_t speed, uint8_t index)
{
    if (index > 3)
    {
        return NULL;
    }
    return string_descriptors[index];
}
  
const struct usb_descriptor cdc_msc_descriptor = {
    .device_descriptor_callback         = device_descriptor_callback,
    .config_descriptor_callback         = config_descriptor_callback,
    .device_quality_descriptor_callback = NULL,
    .string_descriptor_callback         = string_descriptor_callback};
```
没什么好讲解的，`string_descriptor_callback`也可以填NULL
## 注册回调函数
```c
/*!< endpoint call back */
struct usbd_endpoint cdc_out_ep = {
    .ep_addr = CDC_OUT_EP,
    .ep_cb   = usbd_cdc_acm_bulk_out};
  
struct usbd_endpoint cdc_in_ep = {
    .ep_addr = CDC_IN_EP,
    .ep_cb   = usbd_cdc_acm_bulk_in};
  
struct usbd_interface intf0;
struct usbd_interface intf1;
struct usbd_interface intf2;

void cdc_acm_msc_init(uint8_t busid, uintptr_t reg_base)
{
    usbd_desc_register(busid, &cdc_msc_descriptor);

    usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf0));
    usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf1));
    usbd_add_endpoint(busid, &cdc_out_ep);
    usbd_add_endpoint(busid, &cdc_in_ep);
    usbd_add_interface(busid, usbd_msc_init_intf(busid, &intf2, MSC_OUT_EP, MSC_IN_EP));

    usbd_initialize(busid, reg_base, usbd_event_handler);
}
```
busid是当一块芯片有多个USB外设时用于区分，大部分MCU只有一个，填0即可。reg_base填入USB外设寄存器的基地址。
CDC-ACM要两个接口，MSC要一个接口，注意接口数量要和config_descriptor的USB_CONFIG_DESCRIPTOR_INIT描述的数量一致。
CDC-ACM要添加IN OUT端点，端点中需要实现**接收完成回调函数**和**发送完成回调函数**。在接收完成回调函数中启动下一次接收，在发送完成回调函数中判断是否需要发送[USB知识点扩展](../USB知识点扩展.md#什么是%20ZLP[](https%20//cherryusb.readthedocs.io/zh-cn/latest/usb/usb_ext.html%20zlp%20"Link%20to%20this%20heading"))。
CDC-ACM需要在枚举成功后启动第一次接收，通过`usbd_event_handler`回调函数实现。
## 实现回调函数
```c
volatile bool ep_tx_busy_flag = false;

static void usbd_event_handler(uint8_t busid, uint8_t event)
{
    switch (event)
    {
        case USBD_EVENT_RESET:
            break;
        case USBD_EVENT_CONNECTED:
            break;
        case USBD_EVENT_DISCONNECTED:
            break;
        case USBD_EVENT_RESUME:
            break;
        case USBD_EVENT_SUSPEND:
            break;
        case USBD_EVENT_CONFIGURED:
            ep_tx_busy_flag = false;
            /* setup first out ep read transfer */
            usbd_ep_start_read(busid, CDC_OUT_EP, read_buffer, 2048);
            break;
        case USBD_EVENT_SET_REMOTE_WAKEUP:
            break;
        case USBD_EVENT_CLR_REMOTE_WAKEUP:
            break;
  
        default:
            break;
    }
}
  
void usbd_cdc_acm_bulk_out(uint8_t busid, uint8_t ep, uint32_t nbytes)
{
    USB_LOG_RAW("actual out len:%d\r\n", (unsigned int)nbytes);
    /* setup next out ep read transfer */
    usbd_ep_start_read(busid, CDC_OUT_EP, read_buffer, 2048);
}
  
void usbd_cdc_acm_bulk_in(uint8_t busid, uint8_t ep, uint32_t nbytes)
{
    USB_LOG_RAW("actual in len:%d\r\n", (unsigned int)nbytes);
  
    if ((nbytes % usbd_get_ep_mps(busid, ep)) == 0 && nbytes)
    {
        /* send zlp */
        usbd_ep_start_write(busid, CDC_IN_EP, NULL, 0);
    }
    else
    {
        ep_tx_busy_flag = false;
    }
}
```
ep_tx_busy_flag是为了防止上一次未完成的传输被打断，在RTOS中可以使用信号量互斥锁等方式。
`usbd_ep_start_read(busid, CDC_OUT_EP, read_buffer, 2048);`启动一次长度为2048字节的接收（可以理解成UART使用DMA接收）
使用`usbd_ep_start_write(uint8_t busid, const uint8_t ep, const uint8_t *data, uint32_t data_len)`来发送数据。
其他弱定义的API在usbd_cdc_acm.h中，可以进行重新实现。
关于msc的API弱定义在usbd_msc.h中，只有3个，比较简单，重新实现即可。