# 准备环境
1. 确认在协议栈中添加了CDC类
2. 可以使用[[../基本例程/CDC_ACM和MSC|该例程]]作为模板修改
# 撰写
整体没有什么难度，看完CDC-ACM+MSC的例程基本上都能写出来。唯一要注意的是实际接口数量要和config_descriptor的USB_CONFIG_DESCRIPTOR_INIT描述的数量一致。
# 完整代码
```c
#if 1
/*
 * Copyright (c) 2024, sakumisu
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#include "usbd_core.h"
#include "usbd_cdc_acm.h"

/*!< endpoint address */
#define CDC1_IN_EP		   0x81
#define CDC1_OUT_EP		   0x02
#define CDC1_INT_EP		   0x83

#define CDC2_IN_EP		   0x84
#define CDC2_OUT_EP		   0x05
#define CDC2_INT_EP		   0x86

#define USBD_VID		   0xFFFF
#define USBD_PID		   0xFFFF
#define USBD_MAX_POWER	   100
#define USBD_LANGID_STRING 1033

/*!< config descriptor size */
#define USB_CONFIG_SIZE (9 + CDC_ACM_DESCRIPTOR_LEN * 2)

#define CDC_MAX_MPS		64

static const uint8_t device_descriptor[] = {
	USB_DEVICE_DESCRIPTOR_INIT(USB_2_0, 0xEF, 0x02, 0x01, USBD_VID, USBD_PID, 0x0100, 0x01)};

static const uint8_t config_descriptor[] = {
	USB_CONFIG_DESCRIPTOR_INIT(USB_CONFIG_SIZE, 0x04, 0x01, USB_CONFIG_BUS_POWERED, USBD_MAX_POWER),
	CDC_ACM_DESCRIPTOR_INIT(0x00, CDC1_INT_EP, CDC1_OUT_EP, CDC1_IN_EP, CDC_MAX_MPS, 0x00),
	CDC_ACM_DESCRIPTOR_INIT(0x02, CDC2_INT_EP, CDC2_OUT_EP, CDC2_IN_EP, CDC_MAX_MPS, 0x00)};

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

const struct usb_descriptor cdc_descriptor = {
	.device_descriptor_callback			= device_descriptor_callback,
	.config_descriptor_callback			= config_descriptor_callback,
	.device_quality_descriptor_callback = device_quality_descriptor_callback,
	.string_descriptor_callback			= string_descriptor_callback};

USB_NOCACHE_RAM_SECTION USB_MEM_ALIGNX uint8_t read_buffer[2048]; /* 2048 is only for test speed , please use CDC_MAX_MPS for common*/
USB_NOCACHE_RAM_SECTION USB_MEM_ALIGNX uint8_t write_buffer[2048];

volatile bool ep_tx_busy_flag = false;

static void usbd_event_handler(uint8_t busid, uint8_t event)
{
	switch (event)
	{
		case USBD_EVENT_RESET:
			USB_LOG_RAW("USBD_EVENT_RESET\r\n");
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
			USB_LOG_RAW("USBD_EVENT_CONFIGURED\r\n");
			usbd_ep_start_read(busid, CDC1_OUT_EP, read_buffer, 1);
			usbd_ep_start_read(busid, CDC2_OUT_EP, read_buffer, 1);
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
	if (ep == CDC1_OUT_EP)
	{
		usbd_ep_start_read(busid, CDC1_OUT_EP, read_buffer, 2048);
	}
	else if (ep == CDC2_OUT_EP)
	{
		usbd_ep_start_read(busid, CDC2_OUT_EP, read_buffer, 2048);
	}
}

void usbd_cdc_acm_bulk_in(uint8_t busid, uint8_t ep, uint32_t nbytes)
{
	USB_LOG_RAW("actual in len:%d\r\n", (unsigned int)nbytes);

	if ((nbytes % usbd_get_ep_mps(busid, ep)) == 0 && nbytes)
	{
		/* send zlp */
		if (ep == CDC1_IN_EP)
		{
			usbd_ep_start_write(busid, CDC1_IN_EP, NULL, 0);
		}
		else if (ep == CDC2_IN_EP)
		{
			usbd_ep_start_write(busid, CDC2_IN_EP, NULL, 0);
		}
	}
	else
	{
		ep_tx_busy_flag = false;
	}
}

/*!< endpoint call back */
struct usbd_endpoint cdc1_out_ep = {
	.ep_addr = CDC1_OUT_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_out};

struct usbd_endpoint cdc1_in_ep = {
	.ep_addr = CDC1_IN_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_in};

struct usbd_endpoint cdc2_out_ep = {
	.ep_addr = CDC2_OUT_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_out};

struct usbd_endpoint cdc2_in_ep = {
	.ep_addr = CDC2_IN_EP,
	.ep_cb	 = usbd_cdc_acm_bulk_in};

struct usbd_interface intf0;
struct usbd_interface intf1;
struct usbd_interface intf2;
struct usbd_interface intf3;

void cdc_acm_init(uint8_t busid, uintptr_t reg_base)
{
	usbd_desc_register(busid, &cdc_descriptor);

	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf0));
	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf1));
	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf2));
	usbd_add_interface(busid, usbd_cdc_acm_init_intf(busid, &intf3));
	usbd_add_endpoint(busid, &cdc1_out_ep);
	usbd_add_endpoint(busid, &cdc1_in_ep);
	usbd_add_endpoint(busid, &cdc2_out_ep);
	usbd_add_endpoint(busid, &cdc2_in_ep);

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
	// if (dtr_enable)
	{
		memset(&write_buffer[10], 'a', 2038);
		ep_tx_busy_flag = true;
		usbd_ep_start_write(busid, CDC1_IN_EP, "CDC1\r\n", 7);
		usbd_ep_start_write(busid, CDC2_IN_EP, "CDC2\r\n", 7);
		while (ep_tx_busy_flag)
		{
		}
	}
}

#endif
```