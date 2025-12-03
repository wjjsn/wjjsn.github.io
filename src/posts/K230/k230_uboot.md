# 问题：厂商启动是在打包镜像时把三角套打包并添加自定义头并使用的自定义命令启动，我想把镜像打包成FIT，但是我遇到了错误

## 有关厂商的启动源码和打包脚本我已经贴在下面了，请帮我看看问题出在哪

k230_board_common.c

```c
#include <asm/asm.h>
#include <asm/io.h>
#include <asm/types.h>
#include <lmb.h>
#include <cpu_func.h>
#include <stdio.h>
#include <common.h>
#include <command.h>
#include <image.h>
#include <gzip.h>
#include <asm/spl.h>
#include "sysctl.h"

#include <pufs_hmac.h>
#include <pufs_ecp.h>
#include <pufs_rt.h>
#include "pufs_sm2.h"
#include <pufs_sp38a.h>
#include <pufs_sp38d.h>
#include <linux/kernel.h>
#include "sdk_autoconf.h"
#include "k230_board_common.h"
#include <env_internal.h>
#include <malloc.h>
#include <memalign.h>
#include <u-boot/crc.h>

//weak
int mmc_get_env_dev(void)
{
    int ret = 0;
    if(g_bootmod ==  SYSCTL_BOOT_SDIO1)
        ret = 1;
    return ret;
}
//weak
enum env_location arch_env_get_location(enum env_operation op, int prio)
{
    if(0 != prio){
        return ENVL_UNKNOWN;
    }
#ifdef CONFIG_ENV_IS_NOWHERE
	return ENVL_NOWHERE;
#endif
    if(g_bootmod ==  SYSCTL_BOOT_NORFLASH){
        return ENVL_SPI_FLASH;
    }
    if(g_bootmod ==  SYSCTL_BOOT_NANDFLASH){
        return ENVL_SPINAND;
    }
	return ENVL_MMC;
}
#ifndef CONFIG_SPL_BUILD
int board_early_init_f(void)
{
    g_bootmod = sysctl_boot_get_boot_mode(); //init  g_bootmod
    return 0;
}

__weak int board_init(void)
{
	return 0;
}

static int k230_boot_prepare_args(int argc, char *const argv[], ulong buff,
                            en_boot_sys_t *sys, sysctl_boot_mode_e *bootmod)
{
    ulong add_tmp ,len;

    if(argc < 3)
        return CMD_RET_USAGE;

    if(!strcmp(argv[1], "mem")) {
        if(argc < 4)
            return CMD_RET_USAGE;
        add_tmp = simple_strtoul(argv[2],NULL, 0);
        len = simple_strtoul(argv[3],NULL, 0);
        if(add_tmp != buff){
            memmove((void *)buff, (void *)add_tmp, len);
        }
        *sys = BOOT_SYS_ADDR;
        return 0;
    }else  if (!strcmp(argv[1], "sdio1"))
        *bootmod=SYSCTL_BOOT_SDIO1;
    else if (!strcmp(argv[1], "sdio0"))
        *bootmod=SYSCTL_BOOT_SDIO0;
    else if (!strcmp(argv[1], "spinor"))
        *bootmod=SYSCTL_BOOT_NORFLASH;
    else if (!strcmp(argv[1], "spinand"))
        *bootmod=SYSCTL_BOOT_NANDFLASH;
    else if (!strcmp(argv[1], "auto"))
        *bootmod=sysctl_boot_get_boot_mode();


    if(!strcmp(argv[2], "rtt"))
        *sys = BOOT_SYS_RTT;
    else if (!strcmp(argv[2], "linux"))
        *sys=BOOT_SYS_LINUX;
    else if (!strcmp(argv[2], "qbc"))
        *sys=BOOT_QUICK_BOOT_CFG;
    else if (!strcmp(argv[2], "fdb"))
        *sys=BOOT_FACE_DB;
    else if (!strcmp(argv[2], "sensor"))
        *sys=BOOT_SENSOR_CFG;
    else if (!strcmp(argv[2], "ai"))
        *sys=BOOT_AI_MODE;
    else if (!strcmp(argv[2], "speckle"))
        *sys=BOOT_SPECKLE;
    else if (!strcmp(argv[2], "rtapp"))
        *sys=BOOT_RTAPP;
    else if (!strcmp(argv[2], "uboot"))
        *sys=BOOT_SYS_UBOOT;
    else if (!strcmp(argv[2], "auto_boot"))
        *sys=BOOT_SYS_AUTO;


    return 0;

}


/**
 * @brief
 *
 * @param cmdtp
 * @param flag
 * @param argc
 * @param argv
 * @return int
 */
static int do_k230_boot(struct cmd_tbl *cmdtp, int flag, int argc,
		  char *const argv[])
{
    int ret = 0;
    ulong cipher_addr = CONFIG_CIPHER_ADDR; //加载地址、密文
    en_boot_sys_t sys;
    sysctl_boot_mode_e bootmod = g_bootmod;

    ret = k230_boot_prepare_args(argc, argv, cipher_addr,&sys, &bootmod);
    if(ret)
        return ret;
    g_bootmod = bootmod;
    if(sys == BOOT_SYS_ADDR)
        ret = k230_img_boot_sys_bin((firmware_head_s *) cipher_addr);
    else
        ret = k230_img_load_boot_sys(sys);
    return ret;
}

#define K230_BOOT_HELP  " <auto|sdio1|sdio0|spinor|spinand|mem> <auto_boot|rtt|linux|qbc|fdb|sensor|ai|speckle|rtapp|uboot|addr> [len]\n" \
                        "qbc---quick boot cfg\n" \
                        "fdb---face database\n" \
                        "sensor---sensor cfg\n" \
                        "ai---ai mode cfg\n" \
                        "speckle---speckle cfg\n" \
                        "rtapp---rtt app\n" \
                        "auto_boot---auto boot\n" \
                        "uboot---boot uboot\n"
/*
boot sdio1/sdio0/spinor/spinand/mem  add
k230_boot auto rtt ;k230_boot auto linux;
先实现从sd启动吧；
*/
U_BOOT_CMD_COMPLETE(
	k230_boot, 6, 0, do_k230_boot,
	NULL,
	K230_BOOT_HELP, NULL
);
#endif

#ifndef CONFIG_SPL_BUILD
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
typedef enum kburnUsbIspCommandTaget
{
	KBURN_USB_ISP_SDIO0 = 0x00,
	KBURN_USB_ISP_SDIO1 = 0x01,
	KBURN_USB_ISP_NAND = 0x02,
	KBURN_USB_ISP_NOR = 0x03,
} kburnUsbIspCommandTaget;

struct BurnImageConfigItem {
	uint32_t    address;
	uint32_t    size;
	char        altName[32];
};

struct BurnImageConfig {
	uint32_t cfgMagic;
	uint32_t cfgTarget;
	uint32_t cfgCount;
	uint32_t cfgCrc32;
	struct BurnImageConfigItem cfgs[0];
};

static int do_k230_dfu(struct cmd_tbl *cmdtp, int flag, int argc, char *const argv[])
{
    char alt_info[1024];
    int alt_info_len = 0;

    struct BurnImageConfig *cfg = NULL;
    struct BurnImageConfig *cfgOrig = (struct BurnImageConfig *)0x80250000;

    uint32_t cfgMagic   = readl((volatile void *)&cfgOrig->cfgMagic);
	uint32_t cfgCount   = readl((volatile void *)&cfgOrig->cfgCount);

    if(MAGIC_NUM == cfgMagic && (20 > cfgCount)) {
        uint32_t size = sizeof(struct BurnImageConfig) + cfgCount * sizeof(struct BurnImageConfigItem);

        cfg = (struct BurnImageConfig *)malloc(size);
        if(NULL == cfg) {
            free(cfg);
            printf("malloc failed\n");
            return -1;
        }

        uint32_t *pDst = (uint32_t *)cfg;
        uint32_t *pSrc = (uint32_t *)0x80250000;

        for(int i = 0; i < (size / 4); i++) {
            pDst[i] = readl((volatile void *)(pSrc + i));
        }

        uint32_t crc = crc32(0, (const unsigned char *)&cfg->cfgs[0], cfg->cfgCount * sizeof(struct BurnImageConfigItem));
        if(cfg->cfgCrc32 != crc) {
            free(cfg);
            printf("invaild cfg crc32 %x != %x\n", cfg->cfgCrc32, crc);
            return -1;
        }

        /*
        	"#dfu_alt_info=mmc raw 0 2097152 \0" \
            "#bootcmd=dfu 0 mmc 0 \0" \
            "#dfu_alt_info=sf raw 0 2000000 \0" \
            "#bootcmd=dfu 0 sf 0:0 \0" \
        */
        int sector = 1;

       char *pInfo = &alt_info[0];

        switch (cfg->cfgTarget)
        {
        case KBURN_USB_ISP_SDIO0:
            sector = 512;
            alt_info_len = sprintf(pInfo, "%s", "mmc 0=");
            pInfo += alt_info_len;
            break;
        case KBURN_USB_ISP_SDIO1:
            sector = 512;
            alt_info_len = sprintf(pInfo, "%s", "mmc 1=");
            pInfo += alt_info_len;
            break;
        case KBURN_USB_ISP_NAND:
            alt_info_len = sprintf(pInfo, "%s", "mtd spi-nand0=");
            pInfo += alt_info_len;
            break;
        case KBURN_USB_ISP_NOR:
            alt_info_len = sprintf(pInfo, "%s", "sf 0:0:50000000:0=");
            pInfo += alt_info_len;
            break;
        default:
            break;
        }
        bool has_firmware = false;
        for(int i = 0; i < cfg->cfgCount; i++) {
            struct BurnImageConfigItem *item = (struct BurnImageConfigItem *)&cfg->cfgs[i];

            printf("item %d, address %x, size %x, altName %s\n", i, item->address, item->size, item->altName);
            if(!strcmp(item->altName, "otp")) continue;
            if(!strcmp(item->altName, "otp_lock")) continue;
            if(!strcmp(item->altName, "cde")) continue;
            if(!strcmp(item->altName, "cde_lock")) continue;
            has_firmware = true;
            alt_info_len = sprintf(pInfo, "%s raw 0x%x 0x%x", item->altName, item->address / sector, (item->size+sector-1) / sector);
            pInfo += alt_info_len;
            // if(i != (cfg->cfgCount - 1))
            {
                pInfo[0] = ';';
                pInfo ++;
            }
        }
        if(has_firmware)
        {
            pInfo[-1] = '&';
        }
        else {
            pInfo = &alt_info[0];
        }
        sprintf(pInfo, "%s", "virt 0=otp&virt 1=otp_lock&virt 2=cde&virt 3=cde_lock");

        printf("alt_info \'%s\'\n", alt_info);

        env_set("dfu_alt_info", alt_info);

        switch (cfg->cfgTarget)
        {
        case KBURN_USB_ISP_NAND:
            run_command("mtd list;dfu 0", 0);
            break;
        case KBURN_USB_ISP_SDIO0:
        case KBURN_USB_ISP_SDIO1:
        case KBURN_USB_ISP_NOR:
            run_command("dfu 0", 0);
            break;
        default:
            break;
        }
    } else {
        printf("invaild cfg maigc %x != %x, or cfgCount %d > 20\n", cfgMagic, MAGIC_NUM, cfgCount);
        return -1;
    }

    return 0;
}

U_BOOT_CMD(
	k230_dfu, CONFIG_SYS_MAXARGS, 0, do_k230_dfu,
	"k230 burntool enter dfu",
	"k230 burntool enter dfu"
);

#define K230_SET_BIT(val, bit) ((val) | (1 << (bit)))
#define K230_CLER_BIT(val, bit) ((val) & ~(1 << (bit)))
#define K230_GET_BIT(val, bit) (((val) >> (bit)) & 1)
#define GPIO_EXT_PORTA 0x50

int k230_gpio(char opt, int pin, char *value)
{
    int ret = 0;

    volatile u32 * gpio_dr = (volatile int *)(GPIO_BASE_ADDR0 + pin/32*0x1000);
    volatile u32 * gpio_ddr = (volatile int *)(gpio_dr+1);
    volatile u32 * gpio_ctrl = (volatile int *)(gpio_dr+2);
    volatile u32 * gpio_value_in = (volatile int *)(GPIO_BASE_ADDR0+GPIO_EXT_PORTA + pin/32*4);
    u32 reg_org, reg_set;

    printf("pin=%d  org reg gpio_dr%x=%x gpio_ddr=%x %x\n", pin,  gpio_dr,*gpio_dr, *gpio_ddr, *gpio_ctrl);

    if(pin > 71)
        return -1;

    if(opt == 's') {
        if(value == NULL) {
            printf("value is NULL\n");
            return -1;
        }
        reg_org =  *gpio_dr;
        if(*value == 0) {
            *gpio_dr = K230_CLER_BIT(reg_org, pin % 32);

        } else{
            *gpio_dr = K230_SET_BIT(reg_org, pin % 32);
        }
    } else if(opt == 'g') {
        reg_org = *gpio_value_in;
        *value = K230_GET_BIT(reg_org, pin % 32);
    } else if(opt == 'i') { //set 0;
        reg_org = *gpio_ddr;
        *gpio_ddr = K230_CLER_BIT(reg_org, pin % 32);
    } else if(opt == 'o') {
        reg_org = *gpio_ddr;
        *gpio_ddr = K230_SET_BIT(reg_org, pin % 32);
        if( value && (*value) ) {
            *gpio_dr = K230_SET_BIT(reg_org, pin % 32);
        } else  if( value && (*value == 0)) {
            *gpio_dr = K230_CLER_BIT(reg_org, pin % 32);
        }
    } else {
        printf("opt %c is invalid\n", opt);
        return -1;
    }
    printf("pin=%d %c  after reg gpio_dr=%x gpio_ddr=%x ctl%x\n", pin,  opt, *gpio_dr, *gpio_ddr, *gpio_ctrl);
    return ret;

}
static int do_k230_gpio(struct cmd_tbl *cmdtp, int flag, int argc, char *const argv[])
{
    int ret = 0;
    if(argc < 2) {
        printf("usage: k230_gpio set/get/in/out pin [value]\n");
        return -1;
    }

    int pin = simple_strtoul(argv[2], NULL, 0);
    char value=0;
    if(argc > 3) {
        value = simple_strtoul(argv[3], NULL, 0);
    }
    ret = k230_gpio(argv[1][0], pin, &value);
    printf("%c pin %d value %d \n", argv[1][0], pin, value);
    return ret;
}
U_BOOT_CMD(
	k230_gpio, CONFIG_SYS_MAXARGS, 0, do_k230_gpio,
	"k230_gpio set/get/in/out pin [value]",
	"k230_gpio set/get/in/out pin [value]"
);

#endif
```

k230_board_common.h

```c
#ifndef __K230_BOARD_H__
#define __K230_BOARD_H__
//uboo使用的是 128M@128M  0x8000000---0x100000000
//假设：密文32MB；明文32M,解压缩后32M, ----
/*
    +0x8000000=0x10000000 128MB
    +0x6100000=0xe100000  16MB@97MB uboot
    +0x4100000=0xc100000  32MB@65MB  plaint  2/3
    +0x2100000=0xa1000000 32MB@33MB  cipher  1/3
0x8000000                 kernel
*/
unsigned long get_CONFIG_CIPHER_ADDR(void);
unsigned long get_CONFIG_PLAIN_ADDR(void);
#define CONFIG_CIPHER_ADDR  get_CONFIG_CIPHER_ADDR()
#define CONFIG_PLAIN_ADDR   get_CONFIG_PLAIN_ADDR()
#define CONFIG_K230_PUFS


#define MAGIC_NUM   0x3033324B // "K230"

typedef enum {
    NONE_SECURITY = 0,
    GCM_ONLY,
    CHINESE_SECURITY,
    INTERNATIONAL_SECURITY
} crypto_type_e;

typedef struct __firmware_head_st
{
    uint32_t magic; // 方便升级时快速判断固件是否有效。
    uint32_t length; // 从存储介质读到SRAM的数据量
    crypto_type_e crypto_type; // 支持国密或国际加密算法，或支持不加密启动(otp可以控制是否支持)。
    // 设想这样一个场景，如果固件只使用对称加密，在工厂批量生产的时候，解密密钥必然会泄露给工厂。如果使用非对称加密就可以这种问题了，只需要把公钥交给工厂。
    union verify_{
        struct rsa_{
            uint8_t n[256];// 非对称加密的验签，防止固件被篡改。同时其HASH值会被烧录到otp。
            uint32_t e;
            uint8_t signature[256];
        } rsa;
        struct sm2_{
            uint32_t idlen;
            uint8_t id[512-32*4];
            uint8_t pukx[32];
            uint8_t puky[32];
            uint8_t r[32];
            uint8_t s[32];
        } sm2;
        struct none_sec_{
            uint8_t signature[32];// 计算HASH保证启动固件的完整性。避免程序异常难以定位原因。
            uint8_t reserved[516-32];
        } none_sec;
    } verify;
}__attribute__((packed, aligned(4))) firmware_head_s; //总的512+16 bytes


typedef enum _en___boot_type{
	BOOT_SYS_LINUX,
	BOOT_SYS_RTT,
    BOOT_QUICK_BOOT_CFG,
    BOOT_FACE_DB,
    BOOT_SENSOR_CFG,
    BOOT_AI_MODE,
    BOOT_SPECKLE,
    BOOT_RTAPP,
	BOOT_SYS_UBOOT,
    BOOT_SYS_ADDR,
    BOOT_SYS_AUTO
} en_boot_sys_t;

#define BLKSZ 512
#define HD_BLK_NUM   DIV_ROUND_UP(sizeof(firmware_head_s), BLKSZ)

#define UBOOT_SYS_IN_IMG_OFF_SEC    (2*1024*1024/BLKSZ)
#define RTT_SYS_IN_IMG_OFF_SEC      (10*1024*1024/BLKSZ)
#define LINUX_SYS_IN_IMG_OFF_SEC    (30*1024*1024/BLKSZ)

#define UBOOT_SYS_IN_SPI_NOR_OFF    0x80000
#define RTT_SYS_IN_SPI_NOR_OFF   CONFIG_SPI_NOR_RTTK_BASE
#define LINUX_SYS_IN_SPI_NOR_OFF CONFIG_MEM_LINUX_SYS_BASE

#define UBOOT_SYS_IN_SPI_NAND_OFF 0x80000
#define LINUX_SYS_IN_SPI_NAND_OFF 0x00a00000
#define RTT_SYS_IN_SPI_NAND_OFF 0x00200000

#define IMG_PART_NOT_EXIT 0XFFFFFFFF


void cache_flush(void);
void record_boot_time_info_to_sram(char *prompt);
//引导系统前需要调用一直这个函数，后面只能调用这个函数
void record_boot_time_info(char *prompt);
int do_timeinfo(struct cmd_tbl *cmdtp, int flag, int argc, char *const argv[]);



int k230_img_load_boot_sys(en_boot_sys_t sys);
// int k230_img_load_sys_from_dev(en_boot_sys_t sys, ulong buff);
int k230_img_boot_sys_bin(firmware_head_s * fhBUff);
extern sysctl_boot_mode_e g_bootmod;
int k230_gpio(char opt, int pin, char *value);
#endif
```

k230_img.c

```c
#include <asm/asm.h>
#include <asm/io.h>
#include <asm/types.h>
#include <lmb.h>
#include <cpu_func.h>
#include <stdio.h>
#include <common.h>
#include <command.h>
#include <image.h>
#include <gzip.h>
#include <asm/spl.h>
#include "sysctl.h"

#include <pufs_hmac.h>
#include <pufs_ecp.h>
#include <pufs_rt.h>
#include "pufs_sm2.h"
#include <pufs_sp38a.h>
#include <pufs_sp38d.h>
#include <linux/kernel.h>
#include "k230_board_common.h"
#include <mmc.h>
#include <spi_flash.h>
#include <dm/device-internal.h>
#include <spl.h>
#include <spi.h>
#include <nand.h>
#include <linux/mtd/mtd.h>
#include "sdk_autoconf.h"
#include <linux/delay.h>

static int k230_check_and_get_plain_data(firmware_head_s *pfh, ulong *pplain_addr);
static int k230_boot_rtt_uimage(image_header_t *pUh);

#define LINUX_KERNEL_IMG_MAX_SIZE  (25*1024*1024)

#ifndef CONFIG_MEM_LINUX_SYS_SIZE 
#define  CONFIG_MEM_LINUX_SYS_SIZE  CONFIG_MEM_RTT_SYS_SIZE
#endif 

#ifndef CONFIG_MEM_LINUX_SYS_BASE 
#define  CONFIG_MEM_LINUX_SYS_BASE CONFIG_MEM_RTT_SYS_BASE
#endif 

unsigned long get_CONFIG_CIPHER_ADDR(void)
{
    unsigned long ret=0;
    
    if(CONFIG_MEM_LINUX_SYS_SIZE >= 0x8000000){
        ret = round_down( (((CONFIG_MEM_LINUX_SYS_SIZE - 0x1000000)/3) + CONFIG_MEM_LINUX_SYS_BASE ), 0x100000);//25MB
    }else{
        ret = round_down ((LINUX_KERNEL_IMG_MAX_SIZE + CONFIG_MEM_LINUX_SYS_BASE ), 0x100000);//25MB;
    }

    
    return ret;
}
unsigned long get_CONFIG_PLAIN_ADDR(void)
{
    unsigned long ret=0;
    if(CONFIG_MEM_LINUX_SYS_SIZE >= 0x8000000){
        ret = round_down( ((CONFIG_MEM_LINUX_SYS_SIZE - 0x1000000)/3*2) + CONFIG_MEM_LINUX_SYS_BASE , 0x100000);
    }else {
        ret = round_down ((CONFIG_MEM_LINUX_SYS_SIZE- 0x1000000 - LINUX_KERNEL_IMG_MAX_SIZE)/2 + CONFIG_CIPHER_ADDR, 0x100000);//25MB;
    }
    return ret;    
}

#define USE_UBOOT_BOOTARGS 
#define OPENSBI_DTB_ADDR ( CONFIG_MEM_LINUX_SYS_BASE +0x2000000)
#define RAMDISK_ADDR ( CONFIG_MEM_LINUX_SYS_BASE +0x2000000 + 0X100000)

#define SUPPORT_MMC_LOAD_BOOT

sysctl_boot_mode_e g_bootmod = SYSCTL_BOOT_MAX;

#ifdef USE_UBOOT_BOOTARGS
__weak char *fdt_chosen_bootargs(void)
{
	return NULL;
}
//weak function
char *board_fdt_chosen_bootargs(void){
    char *bootargs = env_get("bootargs");
    if(NULL == bootargs) {
        if((bootargs = fdt_chosen_bootargs())!=NULL)
            return bootargs;
        if(g_bootmod == SYSCTL_BOOT_SDIO0)
            bootargs = "root=/dev/mmcblk0p3 loglevel=8 rw rootdelay=4 rootfstype=ext4 console=ttyS0,115200 crashkernel=256M-:128M earlycon=sbi";
        else if(g_bootmod == SYSCTL_BOOT_SDIO1)
            bootargs = "root=/dev/mmcblk1p3 loglevel=8 rw rootdelay=4 rootfstype=ext4 console=ttyS0,115200 crashkernel=256M-:128M earlycon=sbi";
        else  if(g_bootmod == SYSCTL_BOOT_NORFLASH)
            //bootargs = "root=/dev/mtdblock9 rw rootwait rootfstype=jffs2 console=ttyS0,115200 earlycon=sbi";
            //bootargs = "ubi.mtd=9 rootfstype=ubifs rw root=ubi0_0 console=ttyS0,115200 earlycon=sbi";
            bootargs = "ubi.mtd=9 rootfstype=ubifs rw root=ubi0_0 console=ttyS0,115200 earlycon=sbi fw_devlink=off quiet";
    }
    //printf("%s\n",bootargs);
    return bootargs;
}
#endif 
static int k230_boot_decomp_to_load_addr(image_header_t *pUh, ulong des_len, ulong data , ulong *plen)
{
    int ret = 0;
    K230_dbg("imge: %s load to %x  compress =%x  src %lx len=%lx \n", image_get_name(pUh), image_get_load(pUh), image_get_comp(pUh), data, *plen);    

    //设计要求必须gzip压缩，调试可以不压缩；
    if (image_get_comp(pUh) == IH_COMP_GZIP) {        
        ret = gunzip((void *)(ulong)image_get_load(pUh), des_len, (void *)data, plen);
        if(ret){
            printf("unzip fialed ret =%x\n", ret);
            return -1;
        }
    }else if(image_get_comp(pUh) == IH_COMP_NONE){
        memmove((void *)(ulong)image_get_load(pUh), (void *)data, *plen);
    }
    flush_cache(image_get_load(pUh), *plen);
    K230_dbg("imge: %s load to %x  compress =%x  src %lx len=%lx  \n", image_get_name(pUh), image_get_load(pUh), image_get_comp(pUh), data, *plen);    
    return ret;
}
static int  de_reset_big_core(ulong core_run_addr)
{
    /*
    p/x *(uint32_t*)0x9110100c
    set  *(uint32_t*)0x9110100c=0x10001000    //清 done bit
    set *(uint32_t*)0x9110100c=0x10001       //设置 reset bit
    p/x *(uint32_t*)0x9110100c
    set   *(uint32_t*)0x9110100c=0x10000       //清 reset bit
    p/x *(uint32_t*)0x9110100c
    */
    writel(core_run_addr, (void*)0x91102104ULL);//cpu1_hart_rstvec 设置大核的解复位向量，复位后程序执行位置；
    //printf("0x91102104 =%x 0x9110100c=%x\n", readl( (void*)0x91102104ULL), readl( (void*)0x9110100cULL));

    //writel(0x80199805, (void*)0x91100004); //1.6Ghz

    writel(0x10001000, (void*)0x9110100cULL); //清 done bit
    writel(0x10001, (void*)0x9110100cULL); //设置 reset bit
    //printf("0x9110100c =%x\n", readl( (void*)0x9110100cULL));    
    writel(0x10000, (void *)0x9110100cULL); ////清 reset bit  
    //printf("0x9110100c =%x\n", readl( (void*)0x9110100cULL));
    //printf("reset big hart\n");
    return 0;
}
/**
 * @brief 
 * 
 * @param pUh  image_header_t *
 * @return int 
 */
static int k230_boot_rtt_uimage(image_header_t *pUh)
{
    int ret = 0;
    //小核是0，大核是1；
    ulong len = image_get_size(pUh);
    ulong data;

    image_multi_getimg(pUh, 0, &data, &len);
    ret = k230_boot_decomp_to_load_addr(pUh, 0x6000000, data, &len );
    if( ret == 0){
        de_reset_big_core(image_get_load(pUh));
    }
    return 0;
}

static int k230_boot_linux_uimage(image_header_t *pUh)
{
    int ret = 0;
    void (*kernel)(ulong hart, void *dtb);

    //小核是0，大核是1；
    ulong len = image_get_size(pUh);
    ulong data;
    ulong dtb;
    ulong rd,rd_len;
    ulong img_load_addr = 0;


    //record_boot_time_info("gd");
    image_multi_getimg(pUh, 0, &data, &len);
    img_load_addr = (ulong)image_get_load(pUh);

    ret = k230_boot_decomp_to_load_addr(pUh, (ulong)pUh-img_load_addr,  data, &len );
    if( ret == 0){
          //dtb
        image_multi_getimg(pUh, 2, &dtb, &len);
        image_multi_getimg(pUh, 1, &rd, &rd_len);
        #ifdef USE_UBOOT_BOOTARGS
        len = fdt_shrink_to_minimum((void*)dtb,0x100);
        ret = fdt_chosen((void*)dtb);
        #endif 
        memmove((void*)OPENSBI_DTB_ADDR, (void *)dtb, len);

        #ifndef CONFIG_SPL_BUILD
        //run_command("fdt addr 0x91e7000;fdt print;", 0);
        #endif 

        if(rd_len > 0x100 )
            memmove((void*)RAMDISK_ADDR, (void *)rd, rd_len);

        K230_dbg("dtb %lx rd=%lx l=%lx  %lx %lx ci%lx %lx \n", dtb,rd, data, OPENSBI_DTB_ADDR, RAMDISK_ADDR, get_CONFIG_CIPHER_ADDR(),get_CONFIG_PLAIN_ADDR());

        cleanup_before_linux();//flush cache，
        kernel = (void (*)(ulong, void *))img_load_addr;
        //do_timeinfo(0,0,0,0); 
        kernel(0, (void*)OPENSBI_DTB_ADDR);

    }
    return ret;
}
/**
 * @brief 
 * 
 * @param pUh  image_header_t *
 * @return int 
 */
static int k230_boot_paramter_uimage(image_header_t *pUh)
{
    int ret = 0;
    ulong len = image_get_data_size(pUh);
    ulong data = image_get_data(pUh);

    ret = k230_boot_decomp_to_load_addr(pUh, 0x6000000,  data, &len );
    return ret;
}
/**
 * @brief 
 * 
 * @param pUh  image_header_t *
 * @return int 
 */
static int k230_boot_uboot_uimage(image_header_t *pUh)
{
    int ret = 0;
    void (*uboot)(ulong hart, void *dtb);
    ulong len = image_get_data_size(pUh);
    ulong data = image_get_data(pUh);


    ret = k230_boot_decomp_to_load_addr(pUh, 0x6000000,  data, &len );
    if(ret == 0){
        icache_disable();
        dcache_disable();
        // csi_l2cache_flush_invalid();
        asm volatile(".long 0x0170000b\n":::"memory");

        uboot = (void (*)(ulong, void *))(ulong)image_get_load(pUh);
        //do_timeinfo(0,0,0,0); 
        #if defined(CONFIG_LINUX_RUN_CORE_ID) && (CONFIG_LINUX_RUN_CORE_ID == 1)
        de_reset_big_core(image_get_load(pUh));

        while(1)
        {
            asm volatile("wfi");
        }

        #endif 
        uboot(0, (void*)OPENSBI_DTB_ADDR);
    }
    return 0;
}
int k230_img_boot_sys_bin(firmware_head_s * fhBUff)
{
    int ret = 0;
    image_header_t * pUh = NULL;
    ulong plain_addr  = 0;

    //解密
    //record_boot_time_info("ds");
    ret = k230_check_and_get_plain_data((firmware_head_s *)fhBUff,  &plain_addr);
    if (ret )
        return ret;

    pUh = (image_header_t *) (plain_addr + 4);//4字节是版本号
    if (!image_check_magic(pUh)){
        printf("bad magic \n");
        return -3;
    }        
    //解压缩，引导；
     if ( (0 == strcmp(image_get_name(pUh), "linux") ) || (0 == strcmp(image_get_name(pUh), "Linux") ) ){ 
        ret = k230_boot_linux_uimage(pUh);
    }else if(0 == strcmp(image_get_name(pUh), "rtt")){        
        ret = k230_boot_rtt_uimage(pUh);       
    }else if(0 == strcmp(image_get_name(pUh), "uboot")){        
        ret = k230_boot_uboot_uimage(pUh);       
    } else  {        
        k230_boot_paramter_uimage(pUh);
        return 0;
    }
    return 0;
}

static int k230_check_and_get_plain_data_securiy(firmware_head_s *pfh, ulong *pplain_addr)
{
    int ret = 0;
    pufs_dgst_st md;
    char * pplaint=(char *)CONFIG_PLAIN_ADDR; //明文、0x0 0x8000000 0x0 0x7fff000
    unsigned int outlen;
    uint8_t puk_hash_otp[32];
    uint8_t temp32_0[32]={0};

    const char *gcm_iv = "\x9f\xf1\x85\x63\xb9\x78\xec\x28\x1b\x3f\x27\x94";
    const char *sm4_iv = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f";
    const char *gcm_key = "\x24\x50\x1a\xd3\x84\xe4\x73\x96\x3d\x47\x6e\xdc\xfe\x08\x20\x52\x37\xac\xfd\x49\xb5\xb8\xf3\x38\x57\xf8\x11\x4e\x86\x3f\xec\x7f";
    pufs_ec_point_st puk;
    pufs_ecdsa_sig_st sig;

    if(pfh->crypto_type == INTERNATIONAL_SECURITY) {
        K230_dbg(" INTERNATIONAL_SECURITY aes \n");
        // 检验头携带的RSA2048/SM2的 public key是否正确，与烧录到OTP里面的PUK HASH值做比对。
        // 直接把public key烧录到OTP也可以，但是需要消耗2Kbit的OTP空间，这里主要是节约otp空间考虑。
        // 把PUK HASH烧录到OTP，可以保证只有经过PRK签名的固件才可以正常启动。
        if(SUCCESS != cb_pufs_read_otp(puk_hash_otp, 32, OTP_BLOCK_RSA_PUK_HASH_ADDR)){
            printf("otp read puk hash error \n");
            return -6;
        }
        if(0 == memcmp(temp32_0, puk_hash_otp,32)){
            printf("you have not input otp key,not support security boot\n");
            return -18;
        }
        if (cb_pufs_hash(&md, (const uint8_t*)&pfh->verify, 256 + 4, SHA_256) != SUCCESS){
            printf("hash calc error \n");
            return -7;
        }
        //验证公钥是否正确
        if(  memcmp(md.dgst, puk_hash_otp, 32)){
            printf("pubk hash error \n");
            return -8;
        }

        //使用公钥验证mac签名
        char *gcm_tag = (char *)(pfh+1) + pfh->length - 16;
        ret = pufs_rsa_p1v15_verify(pfh->verify.rsa.signature, 
                                    RSA2048, 
                                    pfh->verify.rsa.n, 
                                    pfh->verify.rsa.e, 
                                    gcm_tag, 
                                    16);
        if (ret ) {
            printf("rsa verify error \n");
            return -9;
        } 

        //gcm解密,同时保证完整性；获取明文        
        ret = pufs_dec_gcm((uint8_t *)pplaint, &outlen, (const uint8_t *)(pfh+1), pfh->length - 16,
             AES, OTPKEY, OTPKEY_2, 256, (const uint8_t *)gcm_iv, 12, NULL, 0, gcm_tag, 16);
        if (ret )  {
            printf("dec gcm error ret=%x \n",ret);
            return -10;
        }            

        //pUimgh = (image_header_t *)(pplaint);    
        if(pplain_addr) 
            *pplain_addr = (ulong)pplaint;
        
    }else if (pfh->crypto_type == CHINESE_SECURITY){
        K230_dbg("CHINESE_SECURITY sm\n");
        if(SUCCESS != cb_pufs_read_otp(puk_hash_otp, 32, OTP_BLOCK_SM2_PUK_HASH_ADDR)){
            printf("otp read puk hash error \n");
            return -6;
        }
         if(0 == memcmp(temp32_0, puk_hash_otp,32)){
            printf("you have not input otp key,not support security boot\n");
            return -18;
        }
        if (cb_pufs_hash(&md, (const uint8_t *)&pfh->verify, 512 + 4 - 32 - 32, SM3) != SUCCESS){
            printf("hash calc error \n");
            return -7;
        }
        //验证公钥是否正确
        if(memcmp(md.dgst, puk_hash_otp, 32)){
            printf("pubk hash error \n");
            return -8;
        }

        //SM2 解密hash验签        
        puk.qlen = sig.qlen = 32;
        memcpy(puk.x, pfh->verify.sm2.pukx, puk.qlen);
        memcpy(puk.y, pfh->verify.sm2.puky, puk.qlen);
        memcpy(sig.r, pfh->verify.sm2.r, sig.qlen);
        memcpy(sig.s, pfh->verify.sm2.s, sig.qlen);
        if(cb_pufs_sm2_verify(sig,  (const uint8_t *)(pfh+1), pfh->length, 
                                pfh->verify.sm2.id, pfh->verify.sm2.idlen, puk) != SUCCESS){
            printf("sm verify error\n");                                    
            return -11;
        }

        //SM4 CBC 解密
        if(cb_pufs_dec_cbc((uint8_t *)pplaint, &outlen, (const uint8_t *)(pfh+1), pfh->length, 
            SM4, OTPKEY, OTPKEY_4, 128, (const uint8_t *)sm4_iv, 0) != SUCCESS){
            printf("dec cbc  error\n");     
            return -12;
        } 
        if(pplain_addr) 
            *pplain_addr = (ulong)pplaint;     
    }
    else if(pfh->crypto_type == GCM_ONLY) {
        K230_dbg(" POC GCM_ONLY \n");
        char *gcm_tag = (char *)(pfh+1) + pfh->length - 16;

        //gcm解密,同时保证完整性；获取明文        
        ret = pufs_dec_gcm_poc((uint8_t *)pplaint, &outlen, (const uint8_t *)(pfh+1), pfh->length - 16,
             AES, SSKEY, (const uint8_t *)gcm_key, 256, (const uint8_t *)gcm_iv, 12, NULL, 0, (uint8_t *)gcm_tag, 16);
        if (ret )  {
            printf("dec gcm error ret=%x \n",ret);
            return -10;
        }

        if(pplain_addr) 
            *pplain_addr = (ulong)pplaint;
    }           
    else 
        return -10;

    return 0;
}

//去掉k230 fireware头信息，完整性校验，解密；
static int k230_check_and_get_plain_data(firmware_head_s *pfh, ulong *pplain_addr)
{

    uint32_t otp_msc = 0;    
    int ret = 0;
    pufs_dgst_st md;

    if(pfh->magic != MAGIC_NUM){
        printf("magic error %x : %x \n", MAGIC_NUM, pfh->magic);
        return CMD_RET_FAILURE;
    }

    if(pfh->crypto_type == NONE_SECURITY){ 
        //printf(" NONE_SECURITY \n");
        if(SUCCESS != cb_pufs_read_otp((uint8_t *)&otp_msc, OTP_BLOCK_PRODUCT_MISC_BYTES, OTP_BLOCK_PRODUCT_MISC_ADDR)){
            printf("otp read error \n");
            return -4;
        }
        if(otp_msc & 0x1){
            printf(" NONE_SECURITY not support  %x \n", pfh->crypto_type);
            return -5;
        }       
        //校验完整性
        #ifdef  CONFIG_K230_PUFS
		cb_pufs_hash(&md, (const uint8_t*)(pfh + 1), pfh->length, SHA_256);
        #else 
        sha256_csum_wd((const uint8_t*)(pfh + 1), pfh->length, md.dgst, CHUNKSZ_SHA256);
        #endif   

        if(memcmp(md.dgst, pfh->verify.none_sec.signature, SHA256_SUM_LEN) ){
            printf("sha256 error ");
            return -3; 
        }   
            

        if(pplain_addr) 
            *pplain_addr = (ulong)pfh + sizeof(*pfh) ; 

        ret = 0;    
	} else if((pfh->crypto_type  == CHINESE_SECURITY)|| (pfh->crypto_type  == INTERNATIONAL_SECURITY) || (pfh->crypto_type  == GCM_ONLY))
        ret = k230_check_and_get_plain_data_securiy(pfh, pplain_addr);
    else  {
        printf("error crypto type =%x\n", pfh->crypto_type);
        return -9;
    } 
    return ret;
}

//mmc


#ifdef SUPPORT_MMC_LOAD_BOOT
__weak ulong get_blk_start_by_boot_firmre_type(en_boot_sys_t sys)
{
    ulong blk_s = IMG_PART_NOT_EXIT;
    switch (sys){
	case BOOT_SYS_LINUX:
		blk_s = LINUX_SYS_IN_IMG_OFF_SEC;
		break;
	case BOOT_SYS_RTT:
		blk_s = RTT_SYS_IN_IMG_OFF_SEC;
		break;
    case BOOT_SYS_UBOOT:
		blk_s = UBOOT_SYS_IN_IMG_OFF_SEC;
		break;
    default:break;
	} 
    return blk_s;
}

//dev ,linux ,buff
//sysctl_boot_mode_e bmode, en_boot_sys_t sys, ulong buff
static int k230_load_sys_from_mmc_or_sd(en_boot_sys_t sys, ulong buff)//(ulong offset ,ulong buff)
{
    static struct blk_desc *pblk_desc = NULL;
    ulong blk_s  = get_blk_start_by_boot_firmre_type(sys);
    struct mmc * mmc=NULL;
    int ret = 0;
    firmware_head_s *pfh = (firmware_head_s *)buff;
    ulong data_sect = 0;

    if( IMG_PART_NOT_EXIT == blk_s )
        return IMG_PART_NOT_EXIT;

    if(NULL == pblk_desc){
        if(mmc_init_device(g_bootmod - SYSCTL_BOOT_SDIO0)) //mmc_init_device
            return 1;

        mmc= find_mmc_device( g_bootmod - SYSCTL_BOOT_SDIO0 );
        if(NULL == mmc)
            return 2;
        if(mmc_init(mmc))
            return 3;

        pblk_desc = mmc_get_blk_desc(mmc);
        if(NULL == pblk_desc)
            return 3;
    }

    ret = blk_dread(pblk_desc, blk_s , HD_BLK_NUM, (char *)buff);
    if(ret != HD_BLK_NUM)
        return 4;

    if(pfh->magic != MAGIC_NUM){
        K230_dbg("pfh->magic 0x%x != 0x%x blk=0x%lx buff=0x%lx  ", pfh->magic, MAGIC_NUM, blk_s, buff);
        return 5;
    }

    data_sect = DIV_ROUND_UP(pfh->length + sizeof(*pfh), BLKSZ) - HD_BLK_NUM;
	
    ret = blk_dread(pblk_desc, blk_s + HD_BLK_NUM, data_sect, (char *)buff + HD_BLK_NUM * BLKSZ);
    if(ret != data_sect)
        return 6;
    return 0;
}

#endif  //SUPPORT_MMC_LOAD_BOOT
__weak ulong get_flash_offset_by_boot_firmre_type(en_boot_sys_t sys)
{
    ulong offset = 0xffffffff;
    switch (sys){
	case BOOT_SYS_LINUX:
        #ifdef CONFIG_SPI_NOR_LK_BASE
		offset = CONFIG_SPI_NOR_LK_BASE;
        #endif 
		break;
	case BOOT_SYS_RTT:
        #ifdef CONFIG_SPI_NOR_RTTK_BASE
		offset = CONFIG_SPI_NOR_RTTK_BASE;
        #endif 
		break;
    case BOOT_QUICK_BOOT_CFG:
        #ifdef CONFIG_SPI_NOR_QUICK_BOOT_CFG_BASE
		offset = CONFIG_SPI_NOR_QUICK_BOOT_CFG_BASE;
        #endif 
		break;
    case BOOT_FACE_DB:
        #ifdef CONFIG_SPI_NOR_FACE_DB_CFG_BASE
		offset = CONFIG_SPI_NOR_FACE_DB_CFG_BASE;
        #endif 
		break;
    case BOOT_SENSOR_CFG:
        #ifdef  CONFIG_SPI_NOR_SENSOR_CFG_CFG_BASE
		offset = CONFIG_SPI_NOR_SENSOR_CFG_CFG_BASE;
        #endif 
		break;
    case BOOT_AI_MODE:
        #ifdef CONFIG_SPI_NOR_AI_MODE_CFG_BASE
		offset = CONFIG_SPI_NOR_AI_MODE_CFG_BASE;
        #endif 
		break;
    case BOOT_SPECKLE:
        #ifdef CONFIG_SPI_NOR_SPECKLE_CFG_BASE
		offset = CONFIG_SPI_NOR_SPECKLE_CFG_BASE;
        #endif 
		break;
    case BOOT_RTAPP:
        #ifdef CONFIG_SPI_NOR_RTT_APP_BASE
		offset = CONFIG_SPI_NOR_RTT_APP_BASE;
        #endif 
		break;
    case BOOT_SYS_UBOOT:
		offset = UBOOT_SYS_IN_SPI_NOR_OFF;
		break;
    default:break;
	} 
    return offset;
}
static int k230_load_sys_from_spi_nor( en_boot_sys_t sys, ulong buff)
{
    //g_bootmod
    int ret = 0;
    static struct spi_flash *boot_flash=NULL;
    struct udevice *new, *bus_dev;

    firmware_head_s *pfh = (firmware_head_s *)buff;
    ulong off = get_flash_offset_by_boot_firmre_type(sys);//(sys == BOOT_SYS_LINUX) ? LINUX_SYS_IN_SPI_NOR_OFF : RTT_SYS_IN_SPI_NOR_OFF;

    if(boot_flash == NULL){
        /* speed and mode will be read from DT */
        ret = spi_flash_probe_bus_cs(CONFIG_SF_DEFAULT_BUS, CONFIG_SF_DEFAULT_CS,
                        &new);
        if (ret) {
            env_set_default("spi_flash_probe_bus_cs() failed", 0);
            return ret;
        }
        boot_flash = dev_get_uclass_priv(new);
    }


    ret = spi_flash_read(boot_flash, off, sizeof(*pfh), (void *)pfh);

    if(ret || (pfh->magic != MAGIC_NUM) )   {
        K230_dbg("pfh->magic 0x%x != 0x%x off=0x%lx buff=0x%lx  ", pfh->magic, MAGIC_NUM, off, buff);
        return 5;
    }
    ret = spi_flash_read(boot_flash, off+sizeof(*pfh), round_up(pfh->length,2), (void*)(buff+sizeof(*pfh)));

    if(sys== BOOT_SYS_LINUX){
        ret = spi_find_bus_and_cs(CONFIG_SF_DEFAULT_BUS, CONFIG_SF_DEFAULT_CS, &bus_dev, &new);
        device_remove(new, DM_REMOVE_NORMAL);
        boot_flash = NULL;

     }
    return ret;
}

#ifdef CONFIG_ENV_SPINAND_NAME
#define SPINAND_NAME CONFIG_ENV_SPINAND_NAME

__weak ulong get_nand_start_by_boot_firmre_type(en_boot_sys_t sys)
{
    ulong blk_s = IMG_PART_NOT_EXIT;
    switch (sys){
	case BOOT_SYS_LINUX:
		blk_s = LINUX_SYS_IN_SPI_NAND_OFF;
		break;
	case BOOT_SYS_RTT:
		blk_s = RTT_SYS_IN_SPI_NAND_OFF;
		break;
    case BOOT_SYS_UBOOT:
		blk_s = UBOOT_SYS_IN_SPI_NAND_OFF;
		break;
    default:break;
	} 
    return blk_s;
}

static struct mtd_info *get_mtd_by_name(const char *name)
{
	struct mtd_info *mtd;

	mtd_probe_devices();

	mtd = get_mtd_device_nm(name);
	if (IS_ERR_OR_NULL(mtd))
		printf("MTD device %s not found, ret %ld\n", name,
		       PTR_ERR(mtd));

	return mtd;
}

static bool mtd_is_aligned_with_block_size(struct mtd_info *mtd, u64 size)
{
	return !do_div(size, mtd->erasesize);
}

static int k230_load_sys_from_spi_nand( en_boot_sys_t sys, ulong buff)
{
    //g_bootmod
    int ret = 0;
    static struct mtd_info *boot_flash=NULL;
    struct udevice *new, *bus_dev;
    u_char *buf = (u_char *)buff;
    firmware_head_s *pfh = (firmware_head_s *)buff;
    ulong off = get_nand_start_by_boot_firmre_type(sys); //(sys == BOOT_SYS_LINUX) ? LINUX_SYS_IN_SPI_NAND_OFF : RTT_SYS_IN_SPI_NAND_OFF;
    size_t end = 0;
    size_t len = sizeof(*pfh);
    size_t lenth ;

    if( IMG_PART_NOT_EXIT == off)
        return IMG_PART_NOT_EXIT;

    size_t amount_loaded = 0;
	size_t blocksize;
	static struct mtd_info *mtd;
	u_char *char_ptr;
	struct mtd_oob_ops io_op = {};

	mtd = get_mtd_by_name(SPINAND_NAME);
	if (IS_ERR_OR_NULL(mtd)){
        printf("k230_load_sys_from_spi_nand error \n");
        return 1;
    }

	blocksize = mtd->erasesize;

	io_op.mode = MTD_OPS_AUTO_OOB;
	io_op.len = mtd->writesize;;
	io_op.ooblen = 0;
	io_op.oobbuf = NULL;
    end = off+len;
	while (off < end) {
		if (mtd_is_aligned_with_block_size(mtd, off) && mtd_block_isbad(mtd, off)) {
			off += blocksize;
		} else {
			io_op.datbuf = &buf[amount_loaded];
			if (mtd_read_oob(mtd, off, &io_op)){
                printf("read firmware head error\n");
                ret = 2;
				goto out_put_mtd;
            }

			off += io_op.retlen;
			amount_loaded += io_op.retlen;
		}
	}
    if(pfh->magic != MAGIC_NUM){
        K230_dbg("pfh->magic 0x%x != 0x%x off=0x%lx buff=0x%lx ", pfh->magic, MAGIC_NUM, off, buff);
        ret = 5;
        goto out_put_mtd;
    }
    if(pfh->length > mtd->writesize - sizeof(*pfh))
    {
        end = off+pfh->length - (mtd->writesize - sizeof(*pfh));
        while (off < end) {
            if (mtd_is_aligned_with_block_size(mtd, off) && mtd_block_isbad(mtd, off)) {
                off += blocksize;
            } else {
                io_op.datbuf = &buf[amount_loaded];
                if (mtd_read_oob(mtd, off, &io_op)){
                    printf("read firmware error\n");
                    goto out_put_mtd;
                }

                off += io_op.retlen;
                amount_loaded += io_op.retlen;
            }
        }
    }

out_put_mtd:
	put_mtd_device(mtd);
    return ret;
}
#else
static int k230_load_sys_from_spi_nand( en_boot_sys_t sys, ulong buff)
{
    return IMG_PART_NOT_EXIT;
}
#endif
int k230_img_load_sys_from_dev(en_boot_sys_t sys, ulong buff)
{
    int ret = 0;
    
    if( (g_bootmod == SYSCTL_BOOT_SDIO1) || (g_bootmod == SYSCTL_BOOT_SDIO0) ){ //sd
        ret = k230_load_sys_from_mmc_or_sd(sys, buff);
    }else if(g_bootmod == SYSCTL_BOOT_NANDFLASH){ //spi nand
        ret = k230_load_sys_from_spi_nand( sys,buff);
    }else if(g_bootmod == SYSCTL_BOOT_NORFLASH){ //spi nor
        ret = k230_load_sys_from_spi_nor( sys,buff);
    }
    return ret;
}
__weak int k230_img_load_boot_sys_auot_boot(en_boot_sys_t sys)
{
    int ret = 0;
    #if defined(CONFIG_SPI_NOR_SUPPORT_CFG_PARAM)
    k230_img_load_boot_sys(BOOT_QUICK_BOOT_CFG);
    k230_img_load_boot_sys(BOOT_FACE_DB);
    k230_img_load_boot_sys(BOOT_SENSOR_CFG);
    k230_img_load_boot_sys(BOOT_AI_MODE);
    k230_img_load_boot_sys(BOOT_SPECKLE);
    k230_img_load_boot_sys(BOOT_RTAPP);
    #endif 


    #if  defined(CONFIG_SUPPORT_RTSMART)
    ret += k230_img_load_boot_sys(BOOT_SYS_RTT); 
    #endif  

    
    #if  defined(CONFIG_SUPPORT_RTSMART) && !defined(CONFIG_SUPPORT_LINUX)
    if(ret == 0)
    {
        while(1)
        {
            asm volatile("wfi");
        }
    }
    #endif 



    #if  defined(CONFIG_SUPPORT_LINUX)
    ret += k230_img_load_boot_sys(BOOT_SYS_LINUX);
    #endif 
    
    return ret;
}
/**
 * @brief 
 * 
 * @param bmode 
 * @param sys 
 * @param buff 
 * @return int 
 */
int k230_img_load_boot_sys(en_boot_sys_t sys)
{
    int ret = 0;

    if(sys == BOOT_SYS_AUTO)
        ret =  k230_img_load_boot_sys_auot_boot(sys);
    else {
        ret = k230_img_load_sys_from_dev(sys, CONFIG_CIPHER_ADDR);
        if(ret){
            if(ret != IMG_PART_NOT_EXIT)
                printf("sys %x  load error ret=%x\n", sys, ret);
            return ret;
        }
        ret = k230_img_boot_sys_bin((firmware_head_s * )CONFIG_CIPHER_ADDR);
    }
    return ret;
}
```

```sh
#!/bin/bash
source ${K230_SDK_ROOT}/.config
source ${K230_SDK_ROOT}/.last_conf

gz_file_add_ver()
{
	[ $# -lt 1 ] && return
	local f="$1"

	local sdk_ver="v0.0.0";
	local nncase_ver="0.0.0";

	local sdk_ver_file="${K230_SDK_ROOT}/board/common/post_copy_rootfs/etc/version/release_version"
	local nncase_ver_file="${K230_SDK_ROOT}/src/big/nncase/riscv64/nncase/include/nncase/version.h"

	local storage="$(echo "$f" | sed -nE "s#[^-]*-([^\.]*).*#\1#p")"
	local conf_name="${CONF%%_defconfig}"
	local canaan_site_name="${CONFIG_CANAAN_SITE_IMG_NAME_PREFIX}"
	[ "${canaan_site_name}" = "" ]  &&  canaan_site_name="${conf_name}"

	cat ${sdk_ver_file} | grep v | cut -d- -f 1 > /dev/null && \
	 	sdk_ver=$(cat ${sdk_ver_file} | grep v | cut -d- -f 1)

	cat ${nncase_ver_file} | grep NNCASE_VERSION -w | cut -d\" -f 2 > /dev/null && \
		 nncase_ver=$(cat ${nncase_ver_file} | grep NNCASE_VERSION -w | cut -d\" -f 2)
	rm -rf  ${canaan_site_name}_${storage}_${sdk_ver}_nncase_v${nncase_ver}.img.gz;
	ln -s  $f ${canaan_site_name}_${storage}_${sdk_ver}_nncase_v${nncase_ver}.img.gz;
}


#依赖 BUILD_DIR，K230_SDK_ROOT
copye_file_to_images()
{
	mkdir -p ${BUILD_DIR}/images/little-core/rootfs;
	mkdir -p ${BUILD_DIR}/images/big-core/app;

	if [ "${CONFIG_SUPPORT_RTSMART}" = "y" ]; then
		cd ${K230_SDK_ROOT};
		mkdir -p ${BUILD_DIR}/images/big-core/app;
		cp -rf src/big/rt-smart/userapps/root ${BUILD_DIR}/images/big-core/

		cp -f ${RTT_SDK_BUILD_DIR}/rtthread.* ${BUILD_DIR}/images/big-core/
		cp -rf ${BIG_OPENSBI_BUILD_DIR}/ ${BUILD_DIR}/images/big-core/
		if [ "${CONFIG_SUPPORT_LINUX}" != "y" ]; then
			echo a> ${BUILD_DIR}/images/little-core/linux_system.bin;
			echo a> ${BUILD_DIR}/images/little-core/rootfs.ext4;
		fi
	fi

	if [ "${CONFIG_SUPPORT_LINUX}" = "y" ]; then
		cp -rf ${BUILDROOT_BUILD_DIR}/images/* ${BUILD_DIR}/images/little-core/
		cp -rf ${LINUX_BUILD_DIR}/arch/riscv/boot/Image ${BUILD_DIR}/images/little-core/
		cp -rf ${LITTLE_OPENSBI_BUILD_DIR}/ ${BUILD_DIR}/images/little-core/
		cp -f ${LITTLE_OPENSBI_BUILD_DIR}/platform/generic/firmware/fw_*.bin ${BUILD_DIR}/images/little-core/
		cp -f ${LITTLE_OPENSBI_BUILD_DIR}/platform/generic/firmware/fw_*.elf ${BUILD_DIR}/images/little-core/

		rm ${BUILD_DIR}/images/little-core/ko-apps -rf
		mkdir -p ${BUILD_DIR}/images/little-core/ko-apps
		cp -rf ${LINUX_BUILD_DIR}/rootfs/* ${BUILD_DIR}/images/little-core/ko-apps/

		rm ${BUILD_DIR}/images/little-core/rootfs -rf
		mkdir -p ${BUILD_DIR}/images/little-core/rootfs
		cd ${BUILD_DIR}/images/little-core/rootfs;
		fakeroot -- cpio -idm < ../rootfs.cpio ;

		cp -rf ${K230_SDK_ROOT}/tools/ota/ota_public.pem  	${BUILD_DIR}/images/little-core/rootfs/etc/
		cp -rf ${K230_SDK_ROOT}/tools/ota/fw_env.config  	${BUILD_DIR}/images/little-core/rootfs/etc/
		cp -rf ${K230_SDK_ROOT}/tools/ota/ota_aes_key_iv  	${BUILD_DIR}/images/little-core/rootfs/etc/
		cp -rf ${K230_SDK_ROOT}/tools/ota/hwrevision  	${BUILD_DIR}/images/little-core/rootfs/etc/

		if [ -d "${K230_SDK_ROOT}/board/${CONFIG_BOARD_NAME}/post_copy_rootfs" ]; then
			cp -rf ${K230_SDK_ROOT}/board/${CONFIG_BOARD_NAME}/post_copy_rootfs/*  	${BUILD_DIR}/images/little-core/rootfs/
		else
			cp -rf ${K230_SDK_ROOT}/board/common/post_copy_rootfs/*         ${BUILD_DIR}/images/little-core/rootfs/
		fi
		fakeroot -- cp -rf ${BUILD_DIR}/images/little-core/ko-apps/* ${BUILD_DIR}/images/little-core/rootfs/
		cd ${BUILD_DIR}/images/little-core/rootfs/; \
		fakeroot -- ${K230_SDK_ROOT}/tools/mkcpio-rootfs.sh; \
		cd ../;  tar -zcf rootfs-final.tar.gz rootfs;

		if [ "${CONFIG_SUPPORT_RTSMART}" != "y" ]; then
			echo a> ${BUILD_DIR}/images/big-core/rtt_system.bin;
			echo a> ${BUILD_DIR}/images/big-core/rtt_system_aes.bin;
			echo a> ${BUILD_DIR}/images/big-core/rtt_system_sm.bin;
		fi

	fi
}

#生成版本号
gen_version()
{

	local ver_file="etc/version/release_version"
	local post_copy_rootfs_dir="${K230_SDK_ROOT}/board/common/post_copy_rootfs"
	local nncase_ver="0.0.0";
	local nncase_ver_file="${K230_SDK_ROOT}/src/big/nncase/riscv64/nncase/include/nncase/version.h"

	cat ${nncase_ver_file} | grep NNCASE_VERSION -w | cut -d\" -f 2 > /dev/null && \
		 nncase_ver=$(cat ${nncase_ver_file} | grep NNCASE_VERSION -w | cut -d\" -f 2)


	cd  "${BUILD_DIR}/images/little-core/rootfs" ;
	mkdir -p etc/version/


	set +e; commitid=$(awk -F- '/^[^#]/ { print $6}' ${post_copy_rootfs_dir}/${ver_file});set -e;
	set +e; last_tag=$(awk -F- '/^[^#]/ { print $1}' ${post_copy_rootfs_dir}/${ver_file} | head -1 ) ;set -e;



	[ "${commitid}" != "" ] || commitid="unkonwn"
	[ "${last_tag}" != "" ] || last_tag="unkonwn"

	git rev-parse --short HEAD  &&  commitid=$(git rev-parse --short HEAD)
	git describe --tags `git rev-list --tags --max-count=1` && last_tag=$(git describe --tags `git rev-list --tags --max-count=1`)
	git describe --tags --exact-match  && last_tag=$(git describe --tags --exact-match)

	ver="${last_tag}-$(date "+%Y%m%d-%H%M%S")-$(whoami)-$(hostname)-${commitid}"
	echo -e "#############SDK VERSION######################################" >${ver_file}
	echo -e ${ver} >> ${ver_file}
	echo -e "nncase:${nncase_ver}" >> ${ver_file}
	echo -e "##############################################################" >>${ver_file}
	echo "build version: ${ver}"

	mkdir -p ${post_copy_rootfs_dir}/etc/version/
	cp -f ${ver_file}  ${post_copy_rootfs_dir}/${ver_file}

	cd -;
}

#增加外设的固件到文件系统
add_dev_firmware()
{
	local dev_firmware="etc/firmware"

	mkdir -p ${BUILD_DIR}/images/little-core/rootfs/${dev_firmware}/
	if [ "${CONFIG_AP6212A}" = "y" ] ; then
		cp -f ${K230_SDK_ROOT}/board/common/dev_firmware/ap6212a/* ${BUILD_DIR}/images/little-core/rootfs/${dev_firmware}/
	fi

	if [ "${CONFIG_AP6256}" = "y" ] ; then
		cp -f ${K230_SDK_ROOT}/board/common/dev_firmware/ap6256/* ${BUILD_DIR}/images/little-core/rootfs/${dev_firmware}/
	fi

    if [ "${CONFIG_RTL8188FU}" = "y" ] ; then
        mkdir -p ${BUILD_DIR}/images/little-core/rootfs/lib/firmware/rtlwifi/
        cp -f ${K230_SDK_ROOT}/board/common/dev_firmware/rtl8188fu/* ${BUILD_DIR}/images/little-core/rootfs/lib/firmware/rtlwifi/
    fi

    if [ "${CONFIG_RTL8723DU}" = "y" ] ; then
        mkdir -p ${BUILD_DIR}/images/little-core/rootfs/lib/firmware/
        cp -rf ${K230_SDK_ROOT}/board/common/dev_firmware/rtl8723du/* ${BUILD_DIR}/images/little-core/rootfs/lib/firmware/
    fi

	if [ "${CONFIG_AIC_8800}" = "y" ] ; then
        cp -rf ${K230_SDK_ROOT}/board/common/dev_firmware/aic8800D80 ${BUILD_DIR}/images/little-core/rootfs/${dev_firmware}/
    fi

}

#add_firmHead  xxx.bin  "-n"
#output fn_$1 fa_$1 fs_$1
add_firmHead()
{
	local filename="$1"
	local firmware_gen="${K230_SDK_ROOT}/tools/firmware_gen.py"
	if [ $# -ge 2 ]; then
		firmArgs="$2" #add k230 firmware head
		cp ${filename} ${filename}.t; 					python3  ${firmware_gen}   -i ${filename}.t -o f${firmArgs##-}${filename} ${firmArgs};
	else
		 #add k230 firmware head
		firmArgs="-n"; cp ${filename} ${filename}.t;  	python3  ${firmware_gen}   -i ${filename}.t -o f${firmArgs##-}_${filename} ${firmArgs};

		if [ "${CONFIG_GEN_SECURITY_IMG}" = "y" ];then
			firmArgs="-s";cp ${filename} ${filename}.t;	python3  ${firmware_gen}   -i ${filename}.t -o f${firmArgs##-}_${filename} ${firmArgs};
			firmArgs="-a";cp ${filename} ${filename}.t;	python3  ${firmware_gen}   -i ${filename}.t -o f${firmArgs##-}_${filename} ${firmArgs};
		fi
	fi
	rm -rf  ${filename}.t
}

k230_gzip()
{
	local filename="$1"
	local k230_gzip_tool="${K230_SDK_ROOT}/tools/k230_priv_gzip "
	${k230_gzip_tool} -n8  -f -k ${filename}  ||   ${k230_gzip_tool} -n9 -f -k ${filename} ||  \
	${k230_gzip_tool} -n7 -f -k ${filename}   ||   ${k230_gzip_tool} -n6 -f -k ${filename} || \
	${k230_gzip_tool} -n5 -f -k ${filename}   ||   ${k230_gzip_tool} -n4 -f -k ${filename}
	sed -i -e "1s/\x08/\x09/"  ${filename}.gz
}

# "-O linux -T firmware  -a ${add} -e ${add} -n ${name}"
# "-n/-a/-s"
#file_gzip_ubootHead_firmHead ${quick_boot_cfg_data_file}  "-O linux -T firmware  -a ${add} -e ${add} -n ${name}"   "-n"
#output fn_ug_xx fa_ug_xx fs_ug_xx;
bin_gzip_ubootHead_firmHead()
{
	local mkimage="${UBOOT_BUILD_DIR}/tools/mkimage"
	local file_full_path="$1"
	local filename=$(basename ${file_full_path})
	local mkimgArgs="$2"
	local firmArgs="$3"

	#[ -f ${file_full_path} ] || (echo ${filename} >${file_full_path} )
	# cd  "${BUILD_DIR}/images/";
	[ "$(dirname ${file_full_path})" == "$(pwd)" ] || cp ${file_full_path} .

	k230_gzip ${filename}

	#add uboot head
	${mkimage} -A riscv -C gzip  ${mkimgArgs} -d ${filename}.gz  ug_${filename} # ${filename}.gzu;

	add_firmHead ug_${filename}
	rm -rf ${filename}  ${filename}.gz ug_${filename}
}

gen_uboot_bin()
{
	if [ "${CONFIG_SUPPORT_RTSMART}" = "y" ] && [ "${CONFIG_SUPPORT_LINUX}" != "y" ]; then
        CONFIG_MEM_LINUX_SYS_BASE="${CONFIG_MEM_RTT_SYS_BASE}"
    fi;
	mkdir -p "${BUILD_DIR}/images/little-core/uboot"
	cd ${BUILD_DIR}/images/little-core/uboot;
	# "-O linux -T firmware  -a ${add} -e ${add} -n ${name}"
	# "-n/-a/-s"  "-n/-a/-s"
	#fn_ug_xxx
	bin_gzip_ubootHead_firmHead  ${BUILD_DIR}/little/uboot/u-boot.bin   \
					"-O u-boot -T firmware  -a ${CONFIG_MEM_LINUX_SYS_BASE} -e ${CONFIG_MEM_LINUX_SYS_BASE} -n uboot"


	cp ${BUILD_DIR}/little/uboot/spl/u-boot-spl.bin  .
	add_firmHead  u-boot-spl.bin #
	${K230_SDK_ROOT}/src/little/uboot/tools/endian-swap.py   fn_u-boot-spl.bin  swap_fn_u-boot-spl.bin

	rm -rf u-boot-spl.bin
}


#生成可用uboot引导的linux版本文件
gen_linux_bin ()
{
	local mkimage="${UBOOT_BUILD_DIR}/tools/mkimage"
	local LINUX_SRC_PATH="src/little/linux"
	local LINUX_DTS_PATH="src/little/linux/arch/riscv/boot/dts/kendryte/${CONFIG_LINUX_DTB}.dts"

	cd  "${BUILD_DIR}/images/little-core/" ;
	cpp -nostdinc -I ${K230_SDK_ROOT}/${LINUX_SRC_PATH}/include -I ${K230_SDK_ROOT}/${LINUX_SRC_PATH}/arch  -undef -x assembler-with-cpp ${K230_SDK_ROOT}/${LINUX_DTS_PATH}  hw/k230.dts.txt


	ROOTFS_BASE=`cat hw/k230.dts.txt | grep initrd-start | awk -F " " '{print $4}' | awk -F ">" '{print $1}'`
	ROOTFS_SIZE=`ls -lt rootfs-final.cpio.gz | awk '{print $5}'`
	((ROOTFS_END= $ROOTFS_BASE + $ROOTFS_SIZE))
	ROOTFS_END=`printf "0x%x" $ROOTFS_END`
	sed -i "s/linux,initrd-end = <0x0 .*/linux,initrd-end = <0x0 $ROOTFS_END>;/g" hw/k230.dts.txt

	${LINUX_BUILD_DIR}/scripts/dtc/dtc -I dts -q -O dtb hw/k230.dts.txt  >k230.dtb;
	k230_gzip fw_payload.bin;
	echo a>rd;
	${mkimage} -A riscv -O linux -T multi -C gzip -a ${CONFIG_MEM_LINUX_SYS_BASE} -e ${CONFIG_MEM_LINUX_SYS_BASE} -n linux -d fw_payload.bin.gz:rd:k230.dtb  ulinux.bin;

	add_firmHead  ulinux.bin
	mv fn_ulinux.bin  linux_system.bin
	[ -f fa_ulinux.bin ] && mv fa_ulinux.bin  linux_system_aes.bin
	[ -f fs_ulinux.bin ] && mv fs_ulinux.bin  linux_system_sm.bin
	rm -rf rd;
}

#生成ext2 格式镜像；
gen_final_ext2 ()
{
	local mkfs="${BUILDROOT_BUILD_DIR}/host/sbin/mkfs.ext4"
	cd  "${BUILD_DIR}/images/little-core/" ;
	rm -rf rootfs.ext*
	rm -rf rootfs/dev/console
	rm -rf rootfs/dev/null

	fakeroot ${mkfs} -d rootfs  -r 1 -N 0 -m 1 -L "rootfs" -O ^64bit rootfs.ext4 128M
}


#生成可用uboot引导的rtt版本文件
gen_rtt_bin()
{
	local filename="fw_payload.bin"
	cd "${BUILD_DIR}/images/big-core/" ;
	bin_gzip_ubootHead_firmHead "${BUILD_DIR}/common/big-opensbi/platform/kendryte/fpgac908/firmware/${filename}"  \
			 "-O opensbi -T multi  -a ${CONFIG_MEM_RTT_SYS_BASE} -e ${CONFIG_MEM_RTT_SYS_BASE} -n rtt"

	mv fn_ug_${filename}  rtt_system.bin
	[ -f fa_ug_${filename} ] && mv fa_ug_${filename}  rtt_system_aes.bin
	[ -f fs_ug_${filename} ] && mv fs_ug_${filename}  rtt_system_sm.bin
	chmod a+r rtt_system.bin;
}
#cfg_quick_boot,
#gen_part_bin quick_boot_cfg_data_file     name 0x80000
gen_cfg_part_bin()
{
	local file_full_path="$1"
	local filename=$(basename ${file_full_path})
	local name="$2"
	local add="$3"
	mkdir -p  "${BUILD_DIR}/images/cfg_part";
	cd  "${BUILD_DIR}/images/cfg_part";
	mkdir -p ${GENIMAGE_CFG_DIR}/data
	[ -f ${file_full_path} ] || (echo ${filename} >${file_full_path} )

	bin_gzip_ubootHead_firmHead  ${file_full_path}   "-O linux -T firmware -a ${add} -e ${add} -n ${name}"

	rm -rf ${filename}
}


#生成sd卡镜像文件
gen_image()
{

	local genimage="${K230_SDK_ROOT}/tools/genimage "
	local cfg="$1" ; #"genimage-sdcard.cfg"
	local image_name="$2"; #"sysimage-sdcard.img"
	cd  "${BUILD_DIR}/images/";
	GENIMAGE_TMP="genimage.tmp" ;	rm -rf "${GENIMAGE_TMP}";
	${genimage}   	--rootpath "little-core/rootfs/"  --tmppath "${GENIMAGE_TMP}"    \
					--inputpath "$(pwd)"  	--outputpath "$(pwd)"	--config "${cfg}"

	rm -rf "${GENIMAGE_TMP}"
	gzip -k -f ${image_name}
	chmod a+rw ${image_name} ${image_name}.gz;
	gz_file_add_ver ${image_name}.gz
}

gen_image_spinor_proc_ai_mode()
{
	local all_kmode=""
	local size=""
	local start="0"

	cd ${BUILD_DIR}/images/big-core/; #cp  root/bin/test.kmodel   root/bin/test1.kmodel;
	rm -rf ai_mode ai_mode.bin; mkdir -p ai_mode;
	if $(ls root/bin/*.kmodel >/dev/null 2>&1 )  ; then
		cp  root/bin/*.kmodel ai_mode;
		cd ai_mode;
		for file in $(ls *.kmodel) ; do
			truncate -s %128 ${file};
			cat ${file} >> ../ai_mode.bin
			all_kmode="${all_kmode} ${file}";
			size=$(du -sb ${file} | cut -f1 )
			echo "${file%%\.*}_start=\"${start}\"" >>file_size.txt;
			echo "${file%%\.*}_size=\"${size}\"" >>file_size.txt;
			start=$((${start}+${size}))
		done
	else
		cd ai_mode;
	fi;

	echo "all_kmode=\"${all_kmode}\""  >>file_size.txt
	echo "all_size=\"${start}\""  >>file_size.txt
}
gen_image_spinor_proc_ai_mode_replace()
{

	local fstart="" #
	local fsize=""

	for f in ${all_kmode};
	do
		eval fstart="\${${f%%\.*}_start}"
		eval fsize="\${${f%%\.*}_size}"
		fstart=$(printf "0x%x" $((${fstart} + ${CONFIG_MEM_AI_MODEL_BASE})))
		fsize=$(printf "0x%x" ${fsize})
		sed -i "s/_bin_$f,/(char*)${fstart},/g" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c
		sed -i "s/sizeof(_bin_$f)/${fsize}/g" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c
	done
}

gen_image_spinor()
{
	cd ${BUILD_DIR}/images/big-core/;
	gen_image_spinor_proc_ai_mode;
	source ${BUILD_DIR}/images/big-core/ai_mode/file_size.txt


	#${K230_SDK_ROOT}/tools/genromfs -V ai -v -a 32 -f ai_mode.bin -d binbak/

	#rtapp and ai mode
	cd ${BUILD_DIR}/images/big-core/root/bin/;
	if [ -f  fastboot_app.elf ];then  fasb_app_size=$(du -sb fastboot_app.elf | cut -f1) ; cp  fastboot_app.elf ${BUILD_DIR}/images/big-core/;else fasb_app_size="0";fi
	# find . -type f  -not -name init.sh   | xargs rm -rf ;
	echo a>fastboot_app.elf ; for file in ${all_kmode} ;do echo k>${file} ;done
	cd ${RTSMART_SRC_DIR}/userapps/; python3 ../tools/mkromfs.py ${BUILD_DIR}/images/big-core/root/  ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c;

	sed -i "s/_bin_fastboot_app_elf,/(char*)${CONFIG_MEM_RTAPP_BASE},/g" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c
	sed -i "s/sizeof(_bin_fastboot_app_elf)/${fasb_app_size}/g" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c
	gen_image_spinor_proc_ai_mode_replace



	#rtapp and ai_mode mount
	# local tmpl=$(grep _root_dirent ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c  -rn | head -n1 | cut -d: -f1)
	# #tmpl=$((${tmpl}+1))
	# sed -i "/automodify/d" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c
	# sed -i "${tmpl}a {ROMFS_DIRENT_DIR, \"ai_mode\", RT_NULL, 0},//automodify" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c

	# sed -i "/automodify/d" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/mnt.c
	# sed -i "43a rt_kprintf(\"wjxwjx\"); if(dfs_mount(RT_NULL, \"/ai_mode\", \"rom\", 0, ${CONFIG_MEM_AI_MODEL_BASE}))rt_kprintf(\"mount ai_mode error\\\\n\");//automodify" ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/mnt.c


	cd ${K230_SDK_ROOT};make rtt_update_romfs;
	cd "${BUILD_DIR}/images/big-core/"
	cp ${BUILD_DIR}/big/rt-smart/rtthread.* .;

	bin_gzip_ubootHead_firmHead  ${BUILD_DIR}/common/big-opensbi/platform/kendryte/fpgac908/firmware/fw_payload.bin \
		   "-O opensbi -T multi -a ${CONFIG_MEM_RTT_SYS_BASE} -e ${CONFIG_MEM_RTT_SYS_BASE} -n rtt"
	mv  fn_ug_fw_payload.bin rtt_system.bin ;


	#gen_part_bin quick_boot_cfg_data_file     name 0x80000
	gen_cfg_part_bin ${quick_boot_cfg_data_file}   quick_boot_cfg  ${CONFIG_MEM_QUICK_BOOT_CFG_BASE}
	gen_cfg_part_bin ${face_database_data_file}   face_db  ${CONFIG_MEM_FACE_DATA_BASE}
	gen_cfg_part_bin ${sensor_cfg_data_file}   sensor_cfg  ${CONFIG_MEM_SENSOR_CFG_BASE}
	gen_cfg_part_bin ${ai_mode_data_file}   ai_mode ${CONFIG_MEM_AI_MODEL_BASE}
	gen_cfg_part_bin ${speckle_data_file}  speckle ${CONFIG_MEM_SPECKLE_BASE}
	gen_cfg_part_bin ${rtapp_data_file}   rtapp  ${CONFIG_MEM_RTAPP_BASE}


	#生成spinor 镜像；
	gen_image ${GENIMAGE_CFG_SPI_NOR} sysimage-spinor32m.img
	return;
}
## 裁剪小核  ${BUILD_DIR}/images/little-core/rootfs/
## 裁剪大核  ${BUILD_DIR}/images/big-core/root/
shrink_rootfs_common()
{
	#裁剪小核rootfs
	cd ${BUILD_DIR}/images/little-core/rootfs/;
	rm -rf lib/modules/;
	rm -rf lib/libstdc++*;
	rm -rf usr/bin/fio;
	rm -rf usr/bin/usb_test;
	rm -rf usr/bin/hid_gadget_test;
	rm -rf usr/bin/gadget*;
	rm -rf usr/bin/otp_test_demo;
	rm -rf usr/bin/iotwifi*;
	rm -rf usr/bin/i2c-tools.sh;
	rm -rf usr/bin/hostapd_cli
	rm -rf usr/bin/*test*
	rm -rf usr/bin/k230_timer_demo
	rm -rf usr/bin/gpio_keys_demo
	rm -rf mnt/*;
	rm -rf app/;
	rm -rf lib/tuning-server;
	rm -rf usr/sbin/wpa_supplicant usr/sbin/hostapd;
	rm -rf usr/bin/stress-ng  bin/bash usr/sbin/sshd usr/bin/trace-cmd usr/bin/lvgl_demo_widgets;
	rm -rf usr/bin/ssh  etc/ssh/moduli  usr/lib/libssl.so.1.1 usr/bin/ssh-keygen \
		usr/libexec/ssh-keysign  usr/bin/ssh-keyscan  usr/bin/ssh-add usr/bin/ssh-agent usr/libexec/ssh-pkcs11-helper\
		  usr/lib/libncurses.so.6.1 usr/lib/libvg_lite_util.so  usr/bin/par_ops usr/bin/sftp  usr/libexec/lzo/examples/lzotest;
    rm -rf usr/bin/wdt_test_demo;
    rm -rf usr/bin/swupdate
	#裁剪大核rootfs;
	cd ${BUILD_DIR}/images/big-core/root/bin/;
	find . -type f  -not -name init.sh  -not -name  fastboot_app.elf -not -name   test.kmodel  | xargs rm -rf ;

	if [ -f "${K230_SDK_ROOT}/src/big/mpp/userapps/src/vicap/src/isp/sdk/t_frameworks/t_database_c/calibration_data/sensor_cfg.bin" ]; then
        mkdir -p ${cfg_data_file_path};
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/src/vicap/src/isp/sdk/t_frameworks/t_database_c/calibration_data/sensor_cfg.bin ${cfg_data_file_path}/sensor_cfg.bin
	fi

}


gen_image_spinand()
{
	cd  ${BUILD_DIR}/;rm -rf images_bak;cp images images_bak -r;

	shrink_rootfs_common;
	#裁剪小核rootfs
	cd ${BUILD_DIR}/images/little-core/rootfs/;

	#裁剪大核romfs;
	#$(RT-SMART_SRC_PATH)/userapps/root
	#cd ${BUILD_DIR}/images/big-core/root/bin/; rm -rf sample_vicap_dump.elf sample_sys_init.elf  sample_venc.elf sample_dw200.elf sample_vdss.elf sample_vdd_r.elf sample_dpu* sample_dma* ./dpu;
	cd ${BUILD_DIR}/images/big-core/root/bin/;
	cd ${RTSMART_SRC_DIR}/userapps/; python3 ../tools/mkromfs.py ${BUILD_DIR}/images/big-core/root/  ${RTSMART_SRC_DIR}/kernel/bsp/maix3/applications/romfs.c;
	cd ${K230_SDK_ROOT}; make rtt_update_romfs;
	cd "${BUILD_DIR}/images/big-core/"
	cp ${BUILD_DIR}/big/rt-smart/rtthread.* .;

	bin_gzip_ubootHead_firmHead  ${BUILD_DIR}/common/big-opensbi/platform/kendryte/fpgac908/firmware/fw_payload.bin \
		   "-O opensbi -T multi -a ${CONFIG_MEM_RTT_SYS_BASE} -e ${CONFIG_MEM_RTT_SYS_BASE} -n rtt"
	mv  fn_ug_fw_payload.bin rtt_system.bin ;

	#生成spinor 镜像；
	gen_image ${GENIMAGE_CFG_SPI_NAND} sysimage-spinand32m.img

	#恢复删除前状态；
	cd  ${BUILD_DIR}/;rm -rf images_spinand;mv  images images_spinand; mv  images_bak images;
	cp images_spinand/sysimage-spinand32m.img* images;
	return;
}

gen_env_bin()
{
	local mkenvimage="${UBOOT_BUILD_DIR}/tools/mkenvimage"
	cd  "${BUILD_DIR}/images/";
	local default_env_file=${env_dir}/default.env;
	local jffs2_env_file=${env_dir}/spinor.jffs2.env;
	local spinand_env_file=${env_dir}/spinand.env;

	sed -i -e "/^quick_boot/d"  ${jffs2_env_file}
	sed -i -e "/quick_boot/d"  ${spinand_env_file}
	sed -i -e "/^quick_boot/d"  ${default_env_file}
	sed -i -e "/restore_img/d"  ${default_env_file}

	if [ "${CONFIG_QUICK_BOOT}" != "y" ] || [ "${CONFIG_REMOTE_TEST_PLATFORM}" = "y" ] ; then
		echo "quick_boot=false" >> ${jffs2_env_file}
		echo "quick_boot=false" >> ${spinand_env_file}
		echo "quick_boot=false" >> ${default_env_file}
	fi
	if [ "${CONFIG_REMOTE_TEST_PLATFORM}" = "y" ] ; then
		echo "restore_img=mmc dev 0; mmc read 0x10000 0x200000 0x40000; gzwrite mmc 1 0x10000 0x8000000; reset" >> ${default_env_file}
	fi

	${mkenvimage} -s 0x10000 -o little-core/uboot/jffs2.env ${jffs2_env_file}
	${mkenvimage} -s 0x10000 -o little-core/uboot/spinand.env ${spinand_env_file}
	${mkenvimage} -s 0x10000 -o little-core/uboot/env.env  ${default_env_file}
}
copy_app()
{
	mkdir -p ${BUILD_DIR}/images/big-core/app
	if [ "${CONFIG_SUPPORT_RTSMART}" = "y" ] ; then
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/*   ${BUILD_DIR}/images/big-core/app
		[ "${CONFIG_SUPPORT_LINUX}" = "y" ] && cp ${K230_SDK_ROOT}/src/common/cdk/user/out/big/*  ${BUILD_DIR}/images/big-core/app
	fi

	if [ "${CONFIG_REMOTE_TEST_PLATFORM}" = "y" ] ; then
		local DIR="${K230_SDK_ROOT}/output/k230_evb_defconfig/images/k230_remote_test_platform"
		local SHAREFS="${DIR}/sharefs"
		rm ${DIR} -rf
		mkdir ${SHAREFS}/test_resource -p
		mkdir ${SHAREFS}/app -p

		cp /data1/share/test_resource_for_k230_cloud/* ${SHAREFS}/test_resource/ -rf

		cp ${K230_SDK_ROOT}/src/common/cdk/user/out/big/sample_receiver.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/common/cdk/user/out/big/sample_sys_init.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/common/cdk/user/out/big/sample_writer.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_venc.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_vdec.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_vo.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_mmz.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_vb.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_virtual_vio.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_dma.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_vicap.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_cipher.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_dpu.elf ${SHAREFS}/app/
		cp ${K230_SDK_ROOT}/src/big/mpp/userapps/sample/elf/sample_audio.elf ${SHAREFS}/app/
	fi
}
```

k230_lckfb_defconfig

```makefile
#
# Memory configuration
#
CONFIG_MEM_TOTAL_SIZE=0x40000000
CONFIG_MEM_IPCM_BASE=0x00100000
CONFIG_MEM_IPCM_SIZE=0x00100000
CONFIG_MEM_RTT_SYS_BASE=0x00200000
CONFIG_MEM_RTT_SYS_SIZE=0x07E00000
CONFIG_MEM_MMZ_BASE=0x10000000
CONFIG_MEM_MMZ_SIZE=0x2FC00000
CONFIG_MEM_LINUX_SYS_BASE=0x08000000
CONFIG_MEM_LINUX_SYS_SIZE=0x08000000
CONFIG_MEM_BOUNDARY_RESERVED_SIZE=0x00001000
```

## 启动过程使用的命令

- 这是厂商的自定义命令，使用这个命令启动脚本生成的自定义头的能成功
	fatload mmc 1:5 0x08000000 linux_system.bin
	k230_boot mem 0x08000000 ${linux_img_size}

- 使用这个命令也能成功
	fatload mmc 1:5 0x08000000 ulinux.bin
	fatload mmc 1:5 0x08200000 k230.dtb
	setenv verify n;bootm 0x08000000 - 0x08200000

## 我的打包

fit.its

```its
/dts-v1/;

/ {
  description = "K230 Linux FIT";
  #address-cells = <1>;

  images {
    kernel {
      description = "Linux kernel";
      data = /incbin/("/home/wjjsn/code/k230/source/k230_sdk/output/k230_canmv_lckfb_defconfig/images/little-core/Image");
      type = "kernel";
      arch = "riscv";
      os = "linux";
      compression = "none";
      load = <0x08000000>;
      entry = <0x08000000>;
      hash-1 { algo = "sha256"; };
    };

    fdt {
      description = "K230 device tree";
      data = /incbin/("/home/wjjsn/code/k230/source/k230_sdk/output/k230_canmv_lckfb_defconfig/images/little-core/k230.dtb");
      type = "flat_dt";
      arch = "riscv";
      compression = "none";
      hash-1 { algo = "sha256"; };
    };

    ramdisk {
      description = "initramfs";
      data = /incbin/("/home/wjjsn/code/k230/source/k230_sdk/output/k230_canmv_lckfb_defconfig/images/little-core/rootfs-final.cpio.gz");
      type = "ramdisk";
      arch = "riscv";
      os = "linux";
      compression = "none";
      hash-1 { algo = "sha256"; };
    };
  };

  configurations {
    default = "conf";
    conf {
      description = "K230 config";
      kernel = "kernel";
      fdt    = "fdt";
      ramdisk = "ramdisk";
    };
  };
};
```

但是当我启动时陷入了无限循环的报错

```log
U-Boot 2022.10 (Oct 29 2025 - 17:33:12 +0800)

CPU:   rv64imafdcvsu
Model: kendryte k230 canmv v2
DRAM:  1 GiB
Core:  25 devices, 13 uclasses, devicetree: embed
MMC:   mmc0@91580000: 0, mmc1@91581000: 1
Loading Environment from MMC... OK
In:    serial@91400000
Out:   serial@91400000
Err:   serial@91400000
Net:   No ethernet found.
Hit any key to stop autoboot:  0
K230# fatload mmc 1:5 ${loadaddr} /fit.itb
44503740 bytes read in 1857 ms (22.9 MiB/s)
K230# setenv bootargs 'console=ttyS0,115200 earlycon=sbi root=/dev/ram0 rw'
K230# bootm ${loadaddr}
## Loading kernel from FIT Image at 0c000000 ...
   Using 'conf' configuration
   Verifying Hash Integrity ... OK
   Trying 'kernel' kernel subimage
     Description:  Linux kernel
     Created:      2025-10-29  15:23:34 UTC
     Type:         Kernel Image
     Compression:  uncompressed
     Data Start:   0x0c0000bc
     Data Size:    20737536 Bytes = 19.8 MiB
     Architecture: RISC-V
     OS:           Linux
     Load Address: 0x08000000
     Entry Point:  0x08000000
     Hash algo:    sha256
     Hash value:   8ccd942e408e3f5630dd450a7ff68089813d27d25bd65e02204801c7b4ca0714
   Verifying Hash Integrity ... sha256+ OK
## Loading ramdisk from FIT Image at 0c000000 ...
   Using 'conf' configuration
   Verifying Hash Integrity ... OK
   Trying 'ramdisk' ramdisk subimage
     Description:  initramfs
     Created:      2025-10-29  15:23:34 UTC
     Type:         RAMDisk Image
     Compression:  uncompressed
     Data Start:   0x0d3d93d0
     Data Size:    23689696 Bytes = 22.6 MiB
     Architecture: RISC-V
     OS:           Linux
     Load Address: unavailable
     Entry Point:  unavailable
     Hash algo:    sha256
     Hash value:   9b09b5b825ccabe9d6ebb811a8d72a058d84a46fe22bc97690faaca56fc8eb5b
   Verifying Hash Integrity ... sha256+ OK
## Loading fdt from FIT Image at 0c000000 ...
   Using 'conf' configuration
   Verifying Hash Integrity ... OK
   Trying 'fdt' fdt subimage
     Description:  K230 device tree
     Created:      2025-10-29  15:23:34 UTC
     Type:         Flat Device Tree
     Compression:  uncompressed
     Data Start:   0x0d3c6fb4
     Data Size:    74588 Bytes = 72.8 KiB
     Architecture: RISC-V
     Hash algo:    sha256
     Hash value:   70a0c29d1ede129c1e912a66b836bebf972e881bfa3bbe03cdf649cf2c1e466d
   Verifying Hash Integrity ... sha256+ OK
   Booting using the fdt blob at 0xd3c6fb4
   Loading Kernel Image
   Loading Ramdisk to 3e4ad000, end 3fb449e0 ... OK
   Loading Device Tree to 000000000a0ea000, end 000000000a0ff35b ... OK

Starting kernel ...

Unhandled exception: Instruction access fault
EPC: 000000e000002074 RA: ffffffe000002074 TVAL: 000000e000002074

SP:  0000000009203f00 GP:  00000000093c3dc0 TP:  0000000000000000
T0:  0000000008b61000 T1:  000000003ff575fa T2:  bb7012dbb3674819
S0:  0000000000000000 S1:  000000000a0ea000 A0:  00000000080010ca
A1:  8000000000000000 A2:  8000000000008b61 A3:  0000000008b5e000
A4:  00000000000ea000 A5:  00000000400ea000 A6:  0000000008004dae
A7:  0000000000000080 S2:  0000000008000000 S3:  0000000000000000
S4:  fffffffffffffff3 S5:  000000003ffde9f0 S6:  0000000000000000
S7:  000000003ff5bd4e S8:  0000000000000000 S9:  0000000000000000
S10: 0000000000000000 S11: 0000000000000000 T3:  000000000a0fc3e3
T4:  000000000000ff00 T5:  000000000001535c T6:  000000000a0fbaf0

Code: 0008 ffff 0110 ffff 0020 ffff 0008 ffff (0000)


Unhandled exception: Load access fault
EPC: 000000003ff8edb0 RA: 000000003ffb0a04 TVAL: 000000f400000014

SP:  0000000009203d00 GP:  00000000093c3dc0 TP:  0000000000000000
T0:  0000000008b61000 T1:  000000003ffb0a8c T2:  bb7012dbb3674819
S0:  00000000000186a0 S1:  00000000000186a0 A0:  000001f400000014
A1:  0000000009203e08 A2:  000000000000000a A3:  0000000009203e98
A4:  0000000091400000 A5:  000001f400000014 A6:  0000000000000021
A7:  0000000000000080 S2:  000000e000002074 S3:  0000000000000000
S4:  fffffffffffffff3 S5:  000000003ffde9f0 S6:  0000000000000000
S7:  000000003ff5bd4e S8:  0000000000000000 S9:  0000000000000000
S10: 0000000000000000 S11: 0000000000000000 T3:  000000000a0fc3e3
T4:  000000000000ff00 T5:  000000000001535c T6:  000000000a0fbaf0

Code: 4501 60a6 6406 74e2 6161 8082 4501 bfd5 (611c)


Unhandled exception: Load access fault
EPC: 000000003ff8edb0 RA: 000000003ffb0a04 TVAL: 000000f400000014

SP:  0000000009203b00 GP:  00000000093c3dc0 TP:  0000000000000000
T0:  0000000008b61000 T1:  000000003ffb0a8c T2:  bb7012dbb3674819
S0:  00000000000186a0 S1:  00000000000186a0 A0:  000001f400000014
A1:  0000000009203c08 A2:  000000000000000a A3:  0000000009203c98
A4:  0000000091400000 A5:  000001f400000014 A6:  0000000009203750
A7:  0000000000000080 S2:  000000f400000014 S3:  0000000000000000
S4:  fffffffffffffff3 S5:  000000003ffde9f0 S6:  0000000000000000
S7:  000000003ff5bd4e S8:  0000000000000000 S9:  0000000000000000
S10: 0000000000000000 S11: 0000000000000000 T3:  000000000a0fc3e3
T4:  000000000000ff00 T5:  000000000001535c T6:  000000000a0fbaf0

Code: 4501 60a6 6406 74e2 6161 8082 4501 bfd5 (611c)


Unhandled exception: Load access fault
EPC: 000000003ff8edb0 RA: 000000003ffb0a04 TVAL: 000000f400000014

SP:  0000000009203900 GP:  00000000093c3dc0 TP:  0000000000000000
T0:  0000000008b61000 T1:  000000003ffb0a8c T2:  bb7012dbb3674819
S0:  00000000000186a0 S1:  00000000000186a0 A0:  000001f400000014
A1:  0000000009203a08 A2:  000000000000000a A3:  0000000009203a98
A4:  0000000091400000 A5:  000001f400000014 A6:  0000000009203550
A7:  0000000000000080 S2:  000000f400000014 S3:  0000000000000000
S4:  fffffffffffffff3 S5:  000000003ffde9f0 S6:  0000000000000000
S7:  000000003ff5bd4e S8:  0000000000000000 S9:  0000000000000000
S10: 0000000000000000 S11: 0000000000000000 T3:  000000000a0fc3e3
T4:  000000000000ff00 T5:  000000000001535c T6:  000000000a0fbaf0

Code: 4501 60a6 6406 74e2 6161 8082 4501 bfd5 (611c)
```

# 解析

linux需要opensbi引导，Image裸镜像没有引导无法启动，应该把fw_payload.bin打包而不是Image
