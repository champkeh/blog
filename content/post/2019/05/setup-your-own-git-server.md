+++
title = "搭建自己的git服务器"
date = 2019-05-13T10:38:03+08:00
draft = false
tags = ["git"]
+++

环境:
server: ubuntu 16.4

第一步，安装git:
sudo apt-get install git

第二步，创建一个git用户，用来运行git服务：
sudo adduser git

第三步，创建证书登录：
收集所有需要登录的用户的公钥，导入到 /home/git/.ssh/authorized_keys 文件中，一行一个。

第四步，初始化git裸仓库：
cd /srv
sudo git init --bare blog.git
sudo chown -R git:git blog.git

第五步，禁用shell登录：
编辑 /etc/passwd 文件，如下：
```passwd
git:x:1001:1001:,,,:/home/git:/bin/bash
git:x:1001:1001:,,,:/home/git:/user/bin/git-shell
```

第六步，克隆远程仓库：
git clone git@server:/srv/blog.git

第七步，设置本地仓库的origin：
如果先有本地仓库，后有服务器的裸仓库，可以设置本地仓库的origin:
