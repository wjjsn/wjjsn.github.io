说实话，在ModusToolbox中，我没有找到用串口通信的例程。只找到EZI2C的，但是这个例程里的文档又明确写了“The CAPSENSE™ tuner application works with the EZI2C and UART communication interfaces.”，说明是支持uart的，但是找了一圈没看到例程。

最后在github上找到[我想要的东西](https://github.com/Infineon/mtb-example-psoc4-msclp-tuner-interfaces-i2c-rtt-uart)了

这是一个示例，演示了用i2c、rtt、uart三种不同的方式向上位机发送capsense数据

一开始我还寻思不错啊，居然还支持rtt，那我就不用用串口了。结果打开capsense tuner一看。因为用的不是KitProg作为调试器，rtt直接被阉割了。uart同样被阉割了，用uart接口时，上位机只能收数据并显示，不能向psoc发送数据，也就是相当于不能实时调参了。

## 代码

先把改好的例程放在这，可以先看看，有空再更新讲解

```c
/******************************************************************************
 * File Name: main.c
 *
 * Description: This is the source code for the PSoC 4 CapSense CSD Button
 * Tuning code example for ModusToolbox.
 *
 * Related Document: See README.md
 *
 *******************************************************************************
 * (c) 2021-2025, Infineon Technologies AG, or an affiliate of Infineon
 * Technologies AG. All rights reserved.
 * This software, associated documentation and materials ("Software") is
 * owned by Infineon Technologies AG or one of its affiliates ("Infineon")
 * and is protected by and subject to worldwide patent protection, worldwide
 * copyright laws, and international treaty provisions. Therefore, you may use
 * this Software only as provided in the license agreement accompanying the
 * software package from which you obtained this Software. If no license
 * agreement applies, then any use, reproduction, modification, translation, or
 * compilation of this Software is prohibited without the express written
 * permission of Infineon.
 *
 * Disclaimer: UNLESS OTHERWISE EXPRESSLY AGREED WITH INFINEON, THIS SOFTWARE
 * IS PROVIDED AS-IS, WITH NO WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING, BUT NOT LIMITED TO, ALL WARRANTIES OF NON-INFRINGEMENT OF
 * THIRD-PARTY RIGHTS AND IMPLIED WARRANTIES SUCH AS WARRANTIES OF FITNESS FOR A
 * SPECIFIC USE/PURPOSE OR MERCHANTABILITY.
 * Infineon reserves the right to make changes to the Software without notice.
 * You are responsible for properly designing, programming, and testing the
 * functionality and safety of your intended application of the Software, as
 * well as complying with any legal requirements related to its use. Infineon
 * does not guarantee that the Software will be free from intrusion, data theft
 * or loss, or other breaches ("Security Breaches"), and Infineon shall have
 * no liability arising out of any Security Breaches. Unless otherwise
 * explicitly approved by Infineon, the Software may not be used in any
 * application where a failure of the Product or any consequences of the use
 * thereof can reasonably be expected to result in personal injury.
 *******************************************************************************/

/*******************************************************************************
 * Include header files
 ******************************************************************************/
#include "cy_pdl.h"
#include "cybsp.h"
#include "cycfg.h"
#include "cycfg_capsense.h"

/*******************************************************************************
 * Macros
 *******************************************************************************/
#define CAPSENSE_INTR_PRIORITY (3u)
#define CY_ASSERT_FAILED (0u)

/* EZI2C interrupt priority must be higher than CapSense interrupt. */
#define EZI2C_INTR_PRIORITY (2u)

/*******************************************************************************
 * Global Definitions
 *******************************************************************************/


#if CY_CAPSENSE_BIST_EN
/* Variables to hold sensor parasitic capacitances */
uint32_t sensor_cp = 0;
cy_en_capsense_bist_status_t status;
#endif /* CY_CAPSENSE_BIST_EN */

/*******************************************************************************
 * Function Prototypes
 *******************************************************************************/
static void initialize_capsense(void);
static void capsense_isr(void);
static void initialize_uart_tuner(void);

#if CY_CAPSENSE_BIST_EN
static void measure_sensor_cp(void);
#endif /* CY_CAPSENSE_BIST_EN */

/*******************************************************************************
 * Function Name: main
 ********************************************************************************
 * Summary:
 *  System entrance point. This function performs
 *  - initial setup of device
 *  - initialize CapSense
 *  - initialize tuner communication
 *  - perform Cp measurement if Built-in Self test (BIST) is enabled
 *  - scan touch input continuously
 *
 * Return:
 *  int
 *
 *******************************************************************************/
cy_stc_scb_uart_context_t uart0_context;
#define TUNER_CMD_TX_HEADER0 (0x0Du)
#define TUNER_CMD_TX_HEADER1 (0x0Au)
#define TUNER_CMD_TX_TAIL0 (0x00u)
#define TUNER_CMD_TX_TAIL1 (0xFFu)
#define TUNER_CMD_TX_TAIL2 (0xFFu)
uint8_t uartRingBuffer[CY_CAPSENSE_COMMAND_PACKET_SIZE * 2u + 1u];
uint8_t uartTxHeader[] = {TUNER_CMD_TX_HEADER0, TUNER_CMD_TX_HEADER1};
uint8_t uartTxTail[] = {TUNER_CMD_TX_TAIL0, TUNER_CMD_TX_TAIL1,
                        TUNER_CMD_TX_TAIL2};

static void uart_tuner_send(void *context) ;
static void uart_tuner_receive(uint8_t **packet, uint8_t **tunerPacket,
                                void *context) ;
int main(void) {
  cy_rslt_t result = CY_RSLT_SUCCESS;

  /* Initialize the device and board peripherals */
  result = cybsp_init();

  /* Board init failed. Stop program execution */
  if (result != CY_RSLT_SUCCESS) {
    CY_ASSERT(CY_ASSERT_FAILED);
  }

  /* Enable global interrupts */
  __enable_irq();

  /* Initialize UART */
  initialize_uart_tuner();

  /* Initialize CapSense */
  initialize_capsense();

  /* Start the first scan */
  Cy_CapSense_ScanAllWidgets(&cy_capsense_context);

  for (;;) {
    if (CY_CAPSENSE_NOT_BUSY == Cy_CapSense_IsBusy(&cy_capsense_context)) {
      /* Process all widgets */
      Cy_CapSense_ProcessAllWidgets(&cy_capsense_context);

      if (0 != Cy_CapSense_IsWidgetActive(CY_CAPSENSE_BUTTON0_WDGT_ID,
                                          &cy_capsense_context)) {
        Cy_GPIO_Set(ioss_0_port_0_pin_6_PORT, ioss_0_port_0_pin_6_PIN);
      } else {
        Cy_GPIO_Clr(ioss_0_port_0_pin_6_PORT, ioss_0_port_0_pin_6_PIN);
      }

      /* Establishes synchronized communication with the CapSense Tuner tool */
      cy_capsense_context.ptrInternalContext->ptrTunerSendCallback =
          uart_tuner_send;
      cy_capsense_context.ptrInternalContext->ptrTunerReceiveCallback =
          uart_tuner_receive;
      Cy_CapSense_RunTuner(&cy_capsense_context);

#if CY_CAPSENSE_BIST_EN
      /* Measure the self capacitance of sensor electrode using BIST */
      measure_sensor_cp();
#endif /* CY_CAPSENSE_BIST_EN */

      /* Start the next scan */
      Cy_CapSense_ScanAllWidgets(&cy_capsense_context);
    }
  }
}

/*******************************************************************************
 * Function Name: initialize_capsense
 ********************************************************************************
 * Summary:
 *  This function initializes the CapSense and configures the CapSense
 *  interrupt.
 *
 *******************************************************************************/
static void initialize_capsense(void) {
  cy_capsense_status_t status = CY_CAPSENSE_STATUS_SUCCESS;

  /* CapSense interrupt configuration */
  const cy_stc_sysint_t capsense_interrupt_config = {
      .intrSrc = csd_interrupt_IRQn,
      .intrPriority = CAPSENSE_INTR_PRIORITY,
  };

  /* Capture the CSD HW block and initialize it to the default state. */
  status = Cy_CapSense_Init(&cy_capsense_context);

  if (CY_CAPSENSE_STATUS_SUCCESS == status) {
    /* Initialize CapSense interrupt */
    Cy_SysInt_Init(&capsense_interrupt_config, capsense_isr);
    NVIC_ClearPendingIRQ(capsense_interrupt_config.intrSrc);
    NVIC_EnableIRQ(capsense_interrupt_config.intrSrc);

    /* Initialize the CapSense firmware modules. */
    status = Cy_CapSense_Enable(&cy_capsense_context);
  }

  if (status != CY_CAPSENSE_STATUS_SUCCESS) {
    /* This status could fail before tuning the sensors correctly.
     * Ensure that this function passes after the CapSense sensors are tuned
     * as per procedure give in the Readme.md file */
  }
}

/*******************************************************************************
 * Function Name: capsense_isr
 ********************************************************************************
 * Summary:
 *  Wrapper function for handling interrupts from CapSense block.
 *
 *******************************************************************************/
static void capsense_isr(void) {
  Cy_CapSense_InterruptHandler(NULL, &cy_capsense_context);
}

/*******************************************************************************
 * Function Name: initialize_capsense_tuner
 ********************************************************************************
 * Summary:
 * - EZI2C module to communicate with the CapSense Tuner tool.
 *
 *******************************************************************************/
 #define CYBSP_UART_HW UART_0_HW
#define cybsp_uart_context uart0_context
#define CYBSP_UART_config UART_0_config
#define CYBSP_UART_IRQ scb_0_interrupt_IRQn
#define UART_RINGBUFFER_SIZE (CY_CAPSENSE_COMMAND_PACKET_SIZE * 2u + 1u)
static void uart_tuner_send(void *context) {
  (void)context;
  Cy_SCB_UART_PutArrayBlocking(CYBSP_UART_HW, &(uartTxHeader[0u]),
                               sizeof(uartTxHeader));
  Cy_SCB_UART_PutArrayBlocking(CYBSP_UART_HW, (uint8_t *)&cy_capsense_tuner,
                               sizeof(cy_capsense_tuner));
  Cy_SCB_UART_PutArrayBlocking(CYBSP_UART_HW, &(uartTxTail[0u]),
                               sizeof(uartTxTail));

  /* Blocking wait for transfer completion */
  while (!Cy_SCB_UART_IsTxComplete(CYBSP_UART_HW)) {
  }
}

/*******************************************************************************
 * Function Name: uart_tuner_receive
 ********************************************************************************
 * Summary:
 *  This function receives the CAPSENSE data from Tuner through UART
 *
 *******************************************************************************/
static void uart_tuner_receive(uint8_t **packet, uint8_t **tunerPacket,
                        void *context) {
  uint32_t i;
  (void)context;
  static uint32_t dataIndex = 0u;
  static uint8_t commandPacket[CY_CAPSENSE_COMMAND_PACKET_SIZE] = {0u};
  uint32_t numBytes;

  while (0u !=
         Cy_SCB_UART_GetNumInRingBuffer(CYBSP_UART_HW, &cybsp_uart_context)) {
    numBytes =
        Cy_SCB_UART_GetNumInRingBuffer(CYBSP_UART_HW, &cybsp_uart_context);
    /* Calculate number of bytes to read from ring buffer */
    if ((CY_CAPSENSE_COMMAND_PACKET_SIZE - dataIndex) < numBytes) {
      numBytes = CY_CAPSENSE_COMMAND_PACKET_SIZE - dataIndex;
    }
    /* Add received data to the end of commandPacket */
    Cy_SCB_UART_Receive(CYBSP_UART_HW, &commandPacket[dataIndex], numBytes,
                        &cybsp_uart_context);
    dataIndex += numBytes;
    if (CY_CAPSENSE_COMMAND_PACKET_SIZE <= dataIndex) {
      if (CY_CAPSENSE_COMMAND_OK ==
          Cy_CapSense_CheckTunerCmdIntegrity(&commandPacket[0u])) {
        /* Found a correct command, reset data index and assign pointers to
         * buffers */
        dataIndex = 0u;
        *tunerPacket = (uint8_t *)&cy_capsense_tuner;
        *packet = &commandPacket[0u];
        break;
      } else {
        /* Command is not correct, remove the first byte in commandPacket buffer
         */
        dataIndex--;
        for (i = 0u; i < (CY_CAPSENSE_COMMAND_PACKET_SIZE - 1u); i++) {
          commandPacket[i] = commandPacket[i + 1u];
        }
      }
    }
  }
}

/*******************************************************************************
 * Function Name: uart_interrupt
 ********************************************************************************
 * Summary:
 * Wrapper function for handling interrupts from UART block.
 *
 *******************************************************************************/
void uart_interrupt(void) {
  Cy_SCB_UART_Interrupt(CYBSP_UART_HW, &cybsp_uart_context);
}

/*******************************************************************************
 * Function Name: initialize_uart_tuner
 ********************************************************************************
 * Summary:
 *  Initializes UART communication for the Tuner.
 *******************************************************************************/
void initialize_uart_tuner(void) {
  static uint8_t uartRingBuffer[UART_RINGBUFFER_SIZE];

  /* UART interrupt configuration structure */
  const cy_stc_sysint_t uart_intr_config = {
      .intrSrc = CYBSP_UART_IRQ,
      .intrPriority = 2u,
  };

  /* Register communication callbacks */
  cy_capsense_context.ptrInternalContext->ptrTunerSendCallback =
      uart_tuner_send;
  cy_capsense_context.ptrInternalContext->ptrTunerReceiveCallback =
      uart_tuner_receive;

  /* Initialize, Configure and enable UART communication */
  Cy_SCB_UART_Init(CYBSP_UART_HW, &CYBSP_UART_config, &cybsp_uart_context);
  Cy_SysInt_Init(&uart_intr_config, uart_interrupt);
  NVIC_EnableIRQ(uart_intr_config.intrSrc);
  Cy_SCB_UART_StartRingBuffer(CYBSP_UART_HW, uartRingBuffer,
                              UART_RINGBUFFER_SIZE, &cybsp_uart_context);
  Cy_SCB_UART_Enable(CYBSP_UART_HW);
}



#if CY_CAPSENSE_BIST_EN
/*******************************************************************************
 * Function Name: measure_sensor_cp
 ********************************************************************************
 * Summary:
 *  Measures the self capacitance of the sensor electrode (Cp) in Femto Farad
 * and stores its value in the variable sensor_cp.
 *
 *******************************************************************************/
static void measure_sensor_cp(void) {
  /* Measure the self capacitance of sensor electrode */
  status = Cy_CapSense_MeasureCapacitanceSensor(
      CY_CAPSENSE_BUTTON0_WDGT_ID, CY_CAPSENSE_BUTTON0_SNS0_ID, &sensor_cp,
      &cy_capsense_context);
}
#endif /* CY_CAPSENSE_BIST_EN */

/* [] END OF FILE */

```

## 继续阅读

- [capsense tuner校验和错误](capsense-tuner校验和错误.md)