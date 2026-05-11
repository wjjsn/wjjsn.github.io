---
lang: zh-CN
title: Github Action入门
description: 想要轻松实现自动化工作流？本文带你快速入门 GitHub Actions！从了解多平台虚拟机、CI/CD 持续集成与部署的核心概念，到手把手解析 YAML 配置文件。拒绝繁琐的手工操作，一文教你如何白嫖 GitHub 算力，实现代码提交后自动编译、发布 Release 与 Pages！
---

## 什么是Github Action

相当于你了有一个全平台的，你有Linux、有Windows，有macos虚拟机。理论上来说，你可以用这些虚拟机来做**任何事**。

但是要注意风控，以下行为是绝对不行的：
    1. 挖坑
    2. 搭代理
    3. 托管持续运行的应用
    4. 恶意网络行为（如ddos其他网站）

你几乎可以用这个虚拟机来做任何事

## 为什么选它

实际上，它最主要的用途是CI/CD（持续集成/持续部署）

用一个最简单的例子来说明，比如说我这个博客网站。

持续集成就是在服务器上自动编译一遍我的最新commit，看看有没有错误。如果有错误，邮箱就会马上收到提醒，这样就可以马上改正它，不会出现push了一份错误的内容并且错误的内容在HEAD放很久的情况。

持续集成就是把刚刚编译好的静态文件，自动发布到Github Page，这样用户就能马上看到最新的文章。

这两个持续的意思是，全程不需要人工手动干预，自动化完成所有任务

这只是简单的例子，实际上还有很多其它的用法，这个可以自行探索

## 怎么用

```yaml

name: 显示在Action页面的文字

# 触发的条件：当main分支有push
on:
  push:
    branches:
      - main

# 如果下面的所有步骤都是只读的，不需要写这个。但是发布到release需要写
permissions:
  contents: write

jobs:
  build-a-exe:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        # 这个步骤用来从你的仓库里拉取代码
        uses: actions/checkout@v4
        with:
            #这里的字段用来指定该步骤特定的参数，具体的内容需要根据uses字段的内容调整

      - name: 编译代码
        # 这里的"|"是yaml的语法，用来写多行文本
        # 你希望服务器怎么编译你的代码，你就怎么写
        uses: |
            gcc 源文件名.c -o 输出文件名

        # 自动创建 Release 并上传
      - name: Upload to Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: "latest-build"
          name: "待发布的临时草稿"
          draft: true
          files: |  # 这里填写生成的文件名，支持通配符
            build/*
            输出文件名
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # GitHub 自动生成的临时口令，用于获取发布权限
  other-job:
  #自己写，这个job可以与上面的并行运行
    # 通过need字段声明需要先完成什么任务
    needs: [build-a-exe]

```

上面只创建了一个job，实际上一个用户可以有多个jobs并行运行的。而且公开仓库是不限制使用时间（但是单个job不能超过6h）和次数的。

但是怎么知道有什么已经有的别人写好的action可以用的呢？看[这里](https://github.com/marketplace?type=actions)

