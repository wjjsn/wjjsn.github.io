---
lang: zh-CN
title: docker compose的使用
description: Docker Compose 解决开发痛点：通过服务名代替随机容器名，支持 git worktree 场景下创建独立容器，避免文件修改错乱。 
---

## 日常使用痛点，为什么用docker compose
- vscode自动生成的容器名大多是一串随机字符串，想要在容器内执行命令非常不方便
- 每次执行命令需要先查询容器名字...复制这个随机的字符串...粘贴这个随机的字符串...总之就是很麻烦

## 代替方案：docker compose
`docker compose -f <docker-compose.yml的路径> run --rm <要进入的服务的名称> '<要执行的命令>'`

这个命令会启动一个一次性的容器，用之前构建，用完后删除。
- Q:为什么要启动一个一次性的？
- A:如果当前仓库是一个git worktree，如果其他worktree已经启动了容器，如果docker-compose.yml里写的是挂载了相对路径。那么如果不启动一个新的容器，docker会自动使用已经有的容器，这可能导致修改的文件实际不是当前相对路径的文件，而是另一个工作树的文件。

- Q:为什么要删除？
- A:节约电脑空间。

- Q:每次都启动一个新的，不会很慢吗？
- A:不会，不会构建新的容器，而是会自动使用之前的缓存，如果之前已经构建过容器，速度不会慢，并且要挂载的卷是会重新挂载的。

## 示例
比如这是一个docker-compose.yml
```yaml
services:
  loongson_devcontainer:
    build:
      context: .
      dockerfile: Dockerfile
    # container_name: loongson_dev #注意，如果一台电脑要开多个相同的容器，不能使用container_name，而是应该使用随机生成的字符串。这是docker的限制，容器名称不能重复。
    network_mode: host

    volumes:
      - ..:/workspace:cached
      - ../ls_2k0300_env:/opt/ls_2k0300_env:cached,ro
    command: /bin/sh -c "tail -f /dev/null"
```

假如我在路径`dev/A`启动了容器，然后创建了一个新的worktree`git worktree add ../B`。如果在路径B直接启动容器，默认会使用A的容器，所以你以为修改的是路径B文件，实际上修改的是路径A的。所以我们需要创建一个新的容器。`docker compose run --rm loongson_devcontainer 'cd /workspace/'` 如果pwd同级目录下有docker-compose.yml，则不需要-f参数