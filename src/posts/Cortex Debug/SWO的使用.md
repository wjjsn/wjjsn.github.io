# SWO的优缺点
## 优点
1. 速度快，性能好
2. 不占用硬件外设
3. 纳秒级时间戳
4. 多通道并行传输：ITM 支持​**​多个独立的逻辑通道​**​（通常 32+）。不同模块或功能的调试信息可以分配到不同通道，在主机端​**​独立查看和过滤​**​（例如，通道 0 用于 `printf`，通道 1 用于错误日志，通道 2 用于特定传感器数据）。
5. 与调试会话深度集成：**复位/暂停感知：​**​ 调试器知道目标 MCU 的状态（运行、暂停、复位）。当 MCU 被调试器暂停时，RTT/SWO 传输也会暂停，主机端知道当前数据的上下文。
# launch.json的基本配置
```json
 "swoConfig": {
                "enabled": true,
                "source": "probe",
                "swoFrequency": 2000000,
                "cpuFrequency": 48000000,
                "decoders": [
                    {
                        "port": 0,
                        "type": "console",
                        "label": "SWO output",
                        "encoding": "utf8"
                    }
                ]
            }
```
其中"cpuFrequency"为系统时钟频率
# 为MCU启用SWO引脚
![[../../附件文件夹/Pasted image 20250705151006.png]]
# 覆盖`_write`函数
```c
int _write(int file, char *ptr, int len)
{
    (void)file;
    int DataIdx;
    for (DataIdx = 0; DataIdx < len; DataIdx++)
    {
        ITM_SendChar(*ptr++);
        // __io_putchar(*ptr++);
    }
    return len;
}
```