---
title: "给 hugo 站点添加搜索功能"
date: 2021-10-12T10:34:06+08:00
lastmod: 2021-10-12T10:34:06+08:00
draft: false
keywords: ['search']
description: "给站点添加搜索功能有很多种方式，不管是哪种方式，原理都是先对内容建立索引，然后使用一个搜索引擎根据索引进行查询。本文我们就用纯前端的方式来给 hugo 静态站点添加搜索功能。"
summary: "给站点添加搜索功能有很多种方式，不管是哪种方式，原理都是先对内容建立索引，然后使用一个搜索引擎根据索引进行查询。本文我们就用纯前端的方式来给 hugo 静态站点添加搜索功能。"
tags: ['search']
categories: []

comment: false
toc: true
autoCollapseToc: false
---

## 前言

对于数据库驱动的网站，我们可以执行SQL查询关键字进行搜索；而对于静态站点，我们需要首先生成索引文件，然后用一个搜索引擎进行查询。

这里我们使用一个纯前端的搜索引擎 [Lunr](https://lunrjs.com/)


## 生成文章列表数据

因为我们的网站是用 hugo 搭建的静态网站，所以我们要在 hugo 构建时生成 json 格式的文章列表。

### 创建json模板

创建模板文件`layout/_default/search.json`，内容如下：
```yaml
{
    "results": [
        {{- range $index, $page := .Site.RegularPages }}
            {{- if $index -}}, {{- end }}
            {
                "href": {{ $page.Permalink | jsonify }},
                "title": {{ $page.Title | jsonify }},
                "body": {{ $page.Content | plainify | jsonify }}
            }
        {{- end }}
    ]
}
```

### 应用数据模板生成文章列表数据

默认情况下，我们只有数据模板是不会自动生成数据的，我们需要显式使用这个模板。

首先，创建一个 search.md 文档：
```shell
hugo new search.md
```

我们不需要这个文档的内容，我们只是使用它的`front matter`来指定输出格式，如下所示：
```yaml
---
layout: search
outputs: ["JSON"]
---
```

我们指定了这个文档的模板采用我们之前创建的数据模板文件`search`，输出格式指定为`JSON`。
这样在 hugo 构建时就会输出一个`search/index.json`文件，内容就是我们网站的所有文章生成的一个 json 文件。


## 构建索引文件

在主页使用`axios`获取文章列表：
```js
axios.get("/search/index.json").then(response => {
    window.ArticleList = response.data.result
})
```

构建`lunr`的索引文件：
```js
const LunrSearchIndex = lunr(function () {
    this.ref('href')
    this.field('title')
    this.field('body')
    window.ArticleList.forEach(article => {
        this.add(article)
    })
})
```

## 执行搜索

这一部分就比较简单了，我们有了文章的索引直接调用`search`就可以了：
```js
let searchText = 'search text from input'
let resultList = LunrSearchIndex.search(searchText)
```

关于`lunr`支持的搜索语法，可以查看[Lurn#Search](https://lunrjs.com/guides/searching.html)
