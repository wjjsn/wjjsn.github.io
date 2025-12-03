# 下载工具和SDK
1. TI System Configuration Tool
2. 下载SDK![[../../附件文件夹/Pasted image 20250626143203.png]]
# 创建工程
1. 创建一个空项目
2. 按照下面的格式进行配置![[../../附件文件夹/Pasted image 20250626144724.png]]
3. 主要添加的文件是启动文件、链接脚本、驱动库和TI System Configuration Tool生成的文件。这些文件可以在安装的SDK中找到。默认路径`C:\ti\mspm0_sdk_2_05_00_05\source`，链接脚本和启动文件在`C:\ti\mspm0_sdk_2_05_00_05\source\ti\devices\msp\m0p`。将source文件夹整个复制到项目文件夹中，改名为`Driver`，禁用掉部分源文件![[../../附件文件夹/Pasted image 20250626145815.png]]![[../../附件文件夹/Pasted image 20250626145924.png]]
# 调试配置
![[../../附件文件夹/Pasted image 20250626150305.png]]