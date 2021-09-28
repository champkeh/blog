+++
title = "Deno安装脚本的解读"
date = 2019-05-22T23:22:51+08:00
description = ""
draft = false
tags = ["shell", "deno"]
+++

[install.sh源码](https://github.com/denoland/deno_install/blob/master/install.sh)


`deno`的完整安装脚本如下:
```shell
#!/bin/sh

# 当命令的返回值为非零状态时，则立即退出脚本的执行
set -e

# 定义变量os
case $(uname -s) in
Darwin) os="osx" ;;
*) os="linux" ;;
esac

# 定义变量arch
case $(uname -m) in
x86_64) arch="x86_64" ;;
*) arch="other" ;;
esac

# 如果上面得到的 arch 变量不是 x86_64，则退出安装
if [ "$arch" = "other" ]; then
    echo "Unsupported architecture $(uname -m). Only x64 binaries are available."
    exit
fi

# $# 的意思是，传递给该脚本的参数个数
# 可以通过 $1 $2 ... 按照位置拿到这些参数
# 下面这块代码的目的，是拿到要下载的安装包地址
if [$# -eq 0 ]; then
    # 按照readme的安装说明，无参代表安装最新版
    # 注意下面管道符的使用，用来流式处理命令的结果
    deno_asset_path=$(curl -sSf https://github.com/denoland/deno/releases |
        grep -o "/denoland/deno/releases/download/.*/deno_${os}_x64\\.gz" |
        head -n 1)
    if [ ! "$deno_asset_path" ]; then exit 1; fi
    deno_uri="https://github.com${deno_asset_path}"
else
    # 安装指定版本，版本号通过参数 $1 获取
    deno_uri="https://github.com/denoland/deno/releases/download/${1}/deno_${os}_x64.gz"
fi

# 定义deno二进制文件的安装路径和可执行文件路径
# 根据 issue#40,这个路径在将来可能会发生变化
# https://github.com/denoland/deno_install/issues/40
bin_dir="$HOME/.deno/bin"
exe="$bin_dir/deno"

# 如果目录还不存在，则创建
if [ ! -d "$bin_dir" ]; then
    mkdir -p "$bin_dir"
fi

# 下载安装包
# curl 的 -o 选项表示写入上面定义的文件路径中
# curl 的 -# 选项表示显示进度
curl -fL# -o "$exe.gz" "$deno_uri"

# 下载完二进制文件之后，进行解压
gunzip -df "$exe.gz"

# 添加执行权限
chmod +x "$exe"

echo "Deno was installed successfully to $exe"

# 测试 deno 是否在 PATH 中定义
if command -v deno >/dev/null; then
    echo "Run 'deno --help' to get started"
else
    echo "Manually add the directory to your \$HOME/.bash_profile (or similar)"
    echo "  export PATH=\"$bin_dir:\$PATH\""
    echo "Run '$exe --help' to get started"
fi

```

关于`set -e`的作用，参考[shell脚本中set -e选项作用范围](https://blog.csdn.net/fc34235/article/details/76598448)

关于`command`命令的解释，参考[shell command命令](https://blog.csdn.net/fickyou/article/details/72911217)

> 注意: <br>
> 关于`curl`命令的`-L`选项<br>
```shell
$ curl -h
...
  -L, --location    Follow redirects
...
```
> 该选项可以跟随url的重定向，所以对于github上的资源下载是很重要的<br>
> 我自己在调试的时候，为了简单，没有使用该选项，所以导致下载了错误的文件<br>