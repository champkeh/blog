---
title: "定制even主题"
date: 2019-05-15T23:54:24+08:00
description: ""
draft: true
tags:
- theme
---

刚开始发现这个主题的时候，感觉很好看，当自己用了一段时间之后，感觉还是需要定制一下才符合自己的审美标准的，所以这篇文章就用来记录对该主题的定制过程。

原始主题地址: [https://github.com/olOwOlo/hugo-theme-even](https://github.com/olOwOlo/hugo-theme-even)

## 要定制的点

### 代码块高亮

```js
const app = new Koa()

app.use(async (ctx, next) => {
    console.log('enter #1')
    await next()
    console.log('leave #1')
})

app.use(async (ctx, next) => {
    console.log('enter #2')
    await next()
    console.log('leave #2')
})

app.listen(3000)
```

代码块的背景颜色太亮，需要调暗

### 页面的背景色太亮，晚上看起来太刺眼，需要调暗

### 页面内容区宽度有点小，需要加大宽度

### 文章目录的位置和样式需要调整，最后能够放在屏幕边缘，并且鼠标如果没有悬停在上面的话，要显示灰色

### 原始主题的国际化有点问题，当设置成中文时，上面的菜单没有效果，需要修复

### 字体的选用，现在的字体不太符合我的审美

### 各级标题都不明显，需要添加下划线或其他样式进行区分，并且标题和上面的内容间距要调大
