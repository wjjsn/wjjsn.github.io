---
lang: zh-CN
title: 龙芯久久派刷U-Boot固件安装新世界系统
description: 
---

> 本文转载自 mjy 的博客「[名实合为](https://blog.mjyai.com)」，原文标题《[龙芯久久派刷U-Boot固件安装新世界系统](https://blog.mjyai.com/2024/08/27/loongson-2k0300-flash-u-boot-install-abi2-buildroot/)》，遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。

# 龙芯久久派刷U-Boot固件安装新世界系统

官方发布了U-Boot固件，可运行新世界系统（6.9.0-rc7），不再受旧世界（4.19）的限制，可玩性大大提高。

首先，下载[相关资源包](https://share.weiyun.com/Uvi9Dcsc)。我们需要的是`ABI2.0/images`目录下的`u-boot-spl-gz.bin`、`uImage-wifi`（针对wifi版）和`buildroot/rootfs.tar`。

## U盘刷Buildroot系统

将U盘连接到PC，格式化为单个ext4分区，Windows系统可以使用DiskGenius。

如果PC系统是Linux，可以直接将rootfs.tar复制到该分区，然后解压：

```sh
sudo tar -xvf rootfs.tar
```

如果没有Linux系统，则将U盘插入久久派，执行`sudo mount /dev/sda1 /mnt`挂载U盘，然后进入该目录执行上述命令。

然后把`uImage-wifi`重命名为`uImage`并复制到U盘分区的`boot`目录下。

## 刷U-Boot固件

官方建议用网线连接PC和开发板。其实，如果路由有空闲接口，建议开发板网口连接到路由器。

开发板串口通过USB转串口连PC。我使用的是带串口的调试器[ESP USB Bridge](https://blog.mjyai.com/2022/12/13/jtag-debugging-esp32-using-s2-mini/)，你也可以选择更便宜的c8t6刷DAPLink，但记得改固件代码启用串口。久久派背面有丝印标明接口，接线如下所示（绿GND，橙TX，黄RX）：

![IMG_20240724_154043](https://cdn.jsdelivr.net/gh/mjysci/imgs@master/blog/IMG_20240724_154043.webp)

调试器连接PC，打开串口终端，Windows系统使用Putty，Linux系统使用Minicom（推荐[WindTerm](https://github.com/kingToolbox/WindTerm)）：

```sh
minicom -D /dev/ttyACM0 -b 115200
```

给开发板上电，通过终端反复按键盘的`c`（小写），进入PMON命令行终端。

设置开发板IP，确保其与PC在同一网段，并且不和其他设备冲突。假设PC的IP为`192.168.1.2`，则终端输入：

```sh
ifaddr syn0 192.168.1.178
```

在PC端，进入`u-boot-spl-gz.bin`所在目录启动TFTP服务器。Windows系统使用[Tftpd64](https://pjo2.github.io/tftpd64/)（放在同一目录执行即可），Linux系统使用[tftp-now](https://github.com/puhitaku/tftp-now)。

在开发板终端输入刷固件命令：

```sh
fload tftp://192.168.1.2/u-boot-spl-gz.bin
```

更新过程中千万不要断电或重启，否则开发板可能变砖，只能使用编程器修复。**注意，当显示`Erase end!`并非结束，再等一会出现`Programming end!`才是更新完成！**

![2024-08-27_11-05](https://cdn.jsdelivr.net/gh/mjysci/imgs@master/blog/2024-08-27_11-05.webp)

更新结束后，按开发板重启键，等待终端出现`SOC`字样说明固件更新成功。

## 在U-Boot中设置从U盘启动

将U盘插入久久派。

### 手动启动系统（可选）

可以先测试U盘的系统是否能正常加载：

```sh
ext4load usb 0:1 ${loadaddr} boot/uImage
bootm ${loadaddr}
```

如果报错找不到U盘的分区，则执行`reset`命令，重新进入U-Boot后重试。

### 设置自动启动系统

```sh
setenv bootargs root=/dev/sda1 rootdelay=5
setenv bootcmd 'ext4load usb 0:1 ${loadaddr} boot/uImage;bootm ${loadaddr}'
saveenv
```

显示写入SPI成功后，重启即可自动进入Buildroot系统。默认用户名`root`，密码为空。

以后若想进入U-Boot终端，则在启动时按`c`。

## 恢复PMON（可选）

将PMON的固件名改为`u-boot.bin`，放入U盘（FAT32或ext4均可）里的`update`文件夹。

将U盘插入久久派。

给开发板上电，启动时按`m`进入boot menu。

选择`Update u-boot to spi flash (by usb)`。

## 交叉编译工具链

[loongson/build-tools](https://github.com/loongson/build-tools)

## coremark

顺便跑了个分，结果[比旧世界提升了近30%](https://blog.mjyai.com/2024/06/12/loongson-2k0300-coremark/)，大概是因为新世界的编译器优化非常给力。

![2024-08-27_21-42](https://cdn.jsdelivr.net/gh/mjysci/imgs@master/blog/2024-08-27_21-42.webp)

3.944/MHz

## 参考资料

[【重要】龙芯久久派新世界系统ABI2.0发布，Plus开始发货](https://bbs.ctcisz.com/forum.php?mod=viewthread&tid=133)

安装新世界系统指令

[旧世界与新世界](https://areweloongyet.com/docs/old-and-new-worlds/)