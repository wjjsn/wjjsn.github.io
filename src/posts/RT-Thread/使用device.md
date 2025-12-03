在命令行中使用`list device`查看现有的设备，
```shell
device           type         ref count
-------- -------------------- ----------
sd0      Block Device         2
sd       Block Device         2
spi1     SPI Bus              0
uart1    Character Device     2
pin      Pin Device           0
```
使用块设备的示例：
```c
rt_device_t sdcard_device  = RT_NULL;
rt_device_t console_device = RT_NULL;
uint8_t sdcard_read_buf[512];

const char *test = "test";

int main(void)
{
	// extern void cdc_acm_msc_init(uint8_t busid, uintptr_t reg_base);
	// cdc_acm_msc_init(0, (uintptr_t)USB_OTG_FS);

	rt_pin_mode(GPIO_LED, PIN_MODE_OUTPUT);

	sdcard_device = rt_device_find("sd0");
	rt_device_open(sdcard_device, RT_DEVICE_OFLAG_RDWR);
	// rt_device_read(sdcard_device, 0, sdcard_read_buf, sizeof(sdcard_read_buf));

	// console_device = rt_console_get_device();
	// console_device = rt_device_find("uart1");
	// rt_device_open(console_device, RT_DEVICE_OFLAG_RDWR);
	while (1)
	{
		rt_pin_write(GPIO_LED, PIN_HIGH);
		rt_thread_mdelay(500);
		rt_pin_write(GPIO_LED, PIN_LOW);
		rt_thread_mdelay(500);
	}
}


```

```c
extern rt_device_t sdcard_device;
void usbd_msc_get_cap(uint8_t busid, uint8_t lun, uint32_t *block_num, uint32_t *block_size)
{
	*block_num	= 15603712;
	*block_size = 512;
}

int usbd_msc_sector_read(uint8_t busid, uint8_t lun, uint32_t sector, uint8_t *buffer, uint32_t length)
{
	rt_device_read(sdcard_device, sector, buffer, length / 512);
	return 0;
}

int usbd_msc_sector_write(uint8_t busid, uint8_t lun, uint32_t sector, uint8_t *buffer, uint32_t length)
{
	rt_device_write(sdcard_device, sector, buffer, length / 512);
	return 0;
}
```
注意CherryUSB的length指的是字节数，而`rt_device_write`期待的是块数量