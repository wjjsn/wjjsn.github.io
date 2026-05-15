由于capsense的实际有的组件个数，是由用户决定的，在capsense中间件这个库编写的时候并不知道。所以这个库在编译时就需要`#include "cycfg_capsense.h"`从这里拿配置。

并且这个需要在`capsense-configurator.exe`添加至少一个组件，才不会有宏定义报错。

![添加一个capsense组件](添加一个capsense组件.png)

组件添加完成会还需要选好对应的引脚。

![选择好引脚](选择好引脚.png)

## 继续阅读

[Cy_CapSense_Enable()返回失败？](Cy_CapSense_Enable()返回失败？.md)