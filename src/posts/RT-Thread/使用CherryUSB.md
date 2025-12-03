# 适配
如果BSP默认不支持而是使用的旧版的USB框架需要进行手动适配，主要实现三个函数和`usb_config.h`
```c
void usb_dc_low_level_init(uint8_t busid)
{
	GPIO_InitTypeDef GPIO_InitStruct = {0};
	__HAL_RCC_GPIOA_CLK_ENABLE();
	/**USB_OTG_FS GPIO Configuration
	PA11     ------> USB_OTG_FS_DM
	PA12     ------> USB_OTG_FS_DP
	*/
	GPIO_InitStruct.Pin		  = GPIO_PIN_11 | GPIO_PIN_12;
	GPIO_InitStruct.Mode	  = GPIO_MODE_AF_PP;
	GPIO_InitStruct.Pull	  = GPIO_NOPULL;
	GPIO_InitStruct.Speed	  = GPIO_SPEED_FREQ_VERY_HIGH;
	GPIO_InitStruct.Alternate = GPIO_AF10_OTG_FS;
	HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

	/* Peripheral clock enable */
	__HAL_RCC_USB_OTG_FS_CLK_ENABLE();
	/* USB_OTG_FS interrupt Init */
	HAL_NVIC_SetPriority(OTG_FS_IRQn, 0, 0);
	HAL_NVIC_EnableIRQ(OTG_FS_IRQn);
}

void usb_dc_low_level_deinit(uint8_t busid)
{
	__HAL_RCC_USB_OTG_FS_CLK_DISABLE();

	/**USB_OTG_FS GPIO Configuration
	PA11     ------> USB_OTG_FS_DM
	PA12     ------> USB_OTG_FS_DP
	*/
	HAL_GPIO_DeInit(GPIOA, GPIO_PIN_11 | GPIO_PIN_12);

	/* USB_OTG_FS interrupt DeInit */
	HAL_NVIC_DisableIRQ(OTG_FS_IRQn);
}

void OTG_FS_IRQHandler(void)
{
	extern void USBD_IRQHandler(uint8_t busid);
	USBD_IRQHandler(0);
}
```
如果使用的是dwc2对于FS寄存器基地址是`USB_OTG_FS`，定义在`stm32f407xx.h`
