+++
title = "Linux常用命令"
date = 2019-05-15T09:07:58+08:00
description = ""
draft = false
tags = ["linux"]
+++

## 清空文件内容

```shell
$ > filename     #这个命令执行完之后，不会自动退出，需要按Ctrl+D结束
$ : > filename  #我最常用的，:是一个占位符，不产生任何输出
$ echo '' > filename
$ echo /dev/null > filename
$ echo > filename
$ cat /dev/null > filename
$ cp /dev/null filename
```

> 关于上面几个命令的解释：<br>
> 1. `> filename`的意思是，从标准输入中读取内容并写入到文件`filename`中，执行完该命令之后，需要立即执行`Ctrl+D`表示结束输入，因为此时并没有输入任何内容，所以文件就被清空了。<br>
> 2. `: > filename`是上面的改进版，不需要手动执行`Ctrl+D`<br>


## 按照时间删除文件

有时候，我会不小心把整个目录下的所有文件上传到服务器上的一个错误的目录下，然后想删除刚上传的文件。但是登录到服务器之后，发现这个目录下不仅仅是刚上传的文件，还有之前就存在的一些文件。而我又不能把这个目录下的所有文件都删除掉，我只想删除刚刚上传的那些文件，也就是说，我只想删除刚刚修改的文件。截图如下:

![](/images/linux-command-img1.png)

```shell
find . -mtime -10 #查找当前目录下，10天内修改过的所有文件
find . -mtime -10 -exec rm -Rf {} \;
```


## rsync 使用自定义 ssh key 进行发布

```shell
rsync -Pav public/ ubuntu@tencent:/var/www/xkiller
```