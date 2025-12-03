不使用C/C++主要是因为有一点慢，有时候会找不到函数定义。不过clangd对交叉编译的支持还不够好。
# 安装LLVM
在github的发布页找，安装时记得添加到环境变量
# 安装clangd
在VSC的扩展商店直接安装即可
# 配置clangd
需要在`./.vscode/setting.json`对clangd进行一些配置启动参数
```json
{
    "clangd.arguments": [
        "--query-driver=C:/Users/28584/APP/arm-gnu-toolchain-14.2.rel1-mingw-w64-i686-arm-none-eabi/bin/arm-none-eabi-*.exe",
        "--compile-commands-dir=${workspaceFolder}\\build\\Debug",
        "--background-index",
        "--clang-tidy",
        "--all-scopes-completion",
        "--completion-style=detailed",
        "--header-insertion=iwyu"
    ]
}
```
前两个参数是必须的，用于指定交叉编译的编译器和compile_commands.json的所在目录
在./下创建`.clangd`文件用于覆盖clangd的默认配置。
```yaml
CompileFlags:
  Add: [-isystem, C:/Users/28584/APP/arm-gnu-toolchain-14.2.rel1-mingw-w64-i686-arm-none-eabi/arm-none-eabi/include]
```
当出现标准库头文件路径错误时尝试添加此参数
# 格式化文本
创建./.clang-format文件可以在保存时自动格式化文本
```yaml
---
BasedOnStyle: Microsoft
Language: Cpp

###################################
#          indent conf
###################################

UseTab: Always
IndentWidth: 4
TabWidth: 4
ColumnLimit: 0
AccessModifierOffset: -4
NamespaceIndentation: All
FixNamespaceComments: false
BreakBeforeBraces: Allman

###################################
#          other styles
###################################

# 
# for more conf, you can ref: https://clang.llvm.org/docs/ClangFormatStyleOptions.html
#

AllowShortIfStatementsOnASingleLine: true

AllowShortLoopsOnASingleLine: true

AllowShortBlocksOnASingleLine: true

IndentCaseLabels: true

SortIncludes: false

AlignConsecutiveMacros: AcrossEmptyLines

AlignConsecutiveAssignments: Consecutive

```