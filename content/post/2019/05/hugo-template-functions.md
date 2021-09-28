+++
title = "Hugo Template Functions"
date = 2019-05-13T13:07:16+08:00
description = ""
draft = true
tags = ["hugo"]
+++

Hugo 的模板引擎采用的是 Go 语言的 html/template 库，并且在这之上又添加了一些基本的模板逻辑。也就是说，Go 本身提供的一些内置函数，可以直接在 Hugo 的模板里面使用。

[Go template documentation](https://golang.org/pkg/text/template/#hdr-Functions)

[hugo function reference](https://gohugo.io/functions/)

{{ $.Site.Params }}