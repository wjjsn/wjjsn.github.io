

## 情况

非常非常神秘。。。我记得我之前用jlink烧这个芯片是完全正常的（也可能是因为安装的jlink的版本不一样），现在的版本是9.32，烧点灯这种是完全正常的，但是一旦固件的体积变大，怎么烧都烧不进去，报错！


![jlink烧录psoc报错](jlink烧录psoc报错.png)

我用jflash测试速度，看看这个芯片到底能承受多大的速度，但是直接失败

![用jflash测试速度失败](用jflash测试速度失败.png)

尝试了下面的方案，均无效：
- 换成独立供电而不是使用jlink供电
- 接上了jlink的RESET线，使用硬复位
- 降低jlink通信速率到500kHz
- 检查SWD接口启用情况（已启用）
- 检查杜邦线连接情况（都接好了）
- 检查jlink的Target Device是否正确（正确）

我都要怀疑是不是芯片坏了，但是烧体积小的固件就可以，大的就不行？太奇怪了

## 解决方案

我原本准备试试openOCD就结束的，因为如果这个也不行的话，那我只能认为是芯片坏了。结果换成openOCD马上就能用了。真无语了。。。

所以ModusToolbox™ Programming tools 最好还是要装的。

```log
"C:/Users/wjjsn/ModusToolbox/tools_3.8/../../../../Infineon/Tools/ModusToolboxProgtools-1.8/openocd/bin/openocd.exe" -c "gdb_port 50000" -c "tcl_port 50001" -c "telnet_port 50002" -s "C:\\Users\\wjjsn\\mtw\\CAPSENSE_CSD_Button_Tuning_1" -s "C:/Users/wjjsn/ModusToolbox/tools_3.8/../../../../Infineon/Tools/ModusToolboxProgtools-1.8/openocd/scripts/" -c "set PSOC4_USE_ACQUIRE 1" -f "c:/Users/wjjsn/scoop/apps/vscode/1.114.0/data/extensions/marus25.cortex-debug-1.12.1/support/openocd-helpers.tcl" -f openocd.tcl
Open On-Chip Debugger 0.12.0+dev-5.16.1.4486 (2026-04-14-18:10)
Licensed under GNU GPL v2
For bug reports, read
        http://openocd.org/doc/doxygen/bugs.html
********************************************************************************
* !!! OBSOLETE target 'psoc4.cfg' - will be removed soon.                      *
* Use 'infineon/psoc4.cfg' target instead.                                     *
********************************************************************************
** Test Mode acquire not supported by selected adapter
adapter speed: 2000 kHz
cortex_m reset_config sysresetreq
Info : Listening on port 50001 for tcl connections
Info : Listening on port 50002 for telnet connections
Info : J-Link OB-Mini Plus-CortexM compiled Mar  8 2099 11:15:54
Info : Hardware version: 1.00
Info : VTarget = 3.300 V
Info : clock speed 2000 kHz
Info : SWD DPIDR 0x0bc11477
Info : [psoc4.cpu] Cortex-M0+ r0p1 processor detected
Info : [psoc4.cpu] target has 4 breakpoints, 2 watchpoints
*****************************************
** Silicon: 0x190F, Family: 0xA9, Rev.: 0x21 (B0)
** Detected Family: PSoC 4000S
** Detected Device: CY8C4025AZI-S413
** Detected Main Flash size, kb: 32
** Chip Protection: OPEN
*****************************************
Info : [psoc4.mem_ap] Examination succeed
Info : [psoc4.cpu] Examination succeed
Info : gdb port disabled
Info : starting gdb server for psoc4.cpu on 50000
Info : Listening on port 50000 for gdb connections
Info : accepting 'gdb' connection on tcp/50000
[psoc4.cpu] halted due to debug-request, current mode: Thread 
xPSR: 0x41000000 pc: 0x00004190 msp: 0x20000f98
Info : New GDB Connection: 1, Target psoc4.cpu, state: halted
Warn : No RTOS could be auto-detected!
Info : SWD DPIDR 0x0bc11477
** Attempting to soft-acquire the chip in Test Mode...
** psoc4.cpu: Ran after reset and before halt...
[psoc4.cpu] halted due to debug-request, current mode: Thread 
xPSR: 0x81000000 pc: 0x00004bc8 msp: 0x20000fc8
Info : psoc4.cpu: bkpt @0x000003FD, issuing SYSRESETREQ
[psoc4.cpu] halted due to debug-request, current mode: Thread 
xPSR: 0x61000000 pc: 0x000003fc msp: 0x20001000
Info : SWD DPIDR 0x0bc11477
** Attempting to soft-acquire the chip in Test Mode...
** psoc4.cpu: Ran after reset and before halt...
[psoc4.cpu] halted due to debug-request, current mode: Thread 
xPSR: 0x61000000 pc: 0x00001be4 msp: 0x20000f48
Info : psoc4.cpu: bkpt @0x000003FD, issuing SYSRESETREQ
[psoc4.cpu] halted due to debug-request, current mode: Thread 
xPSR: 0x61000000 pc: 0x000003fc msp: 0x20001000
** Programming Started **
auto erase enabled
Info : Padding image section 0 at 0x000052f0 with 16 bytes (bank write end alignment)
Warn : Only mass erase available, erase skipped! (psoc4 mass_erase)
[100%] [################################] [ Programming ]
wrote 21248 bytes from file build/last_config/mtb-example-psoc4-capsense-csd-button-tuning.hex in 2.064367s (10.052 KiB/s)
** Programming Finished **
** Verify Started **
Error: checksum mismatch - attempting binary compare
verified 21232 bytes in 0.366760s (56.534 KiB/s)
** Verified OK **
Info : SWD DPIDR 0x0bc11477
** Attempting to soft-acquire the chip in Test Mode...
** psoc4.cpu: Ran after reset and before halt...
[psoc4.cpu] halted due to debug-request, current mode: Thread 
```