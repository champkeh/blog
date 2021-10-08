---
title: "Koa 项目脚手架"
date: 2019-05-15T17:37:34+08:00
description: ""
draft: false
tags:
- nodejs
- koa
---

由于 `koa` 框架非常精简，不捆绑任何中间件，因此，路由、日志等这些常见的功能都是由单独的模块提供。这里列举一些常用的中间件，可以作为脚手架使用。


## koa-router

项目地址: [https://github.com/ZijianHe/koa-router](https://github.com/ZijianHe/koa-router)

```shell
npm install koa-router
```


## koa-body

项目地址: [https://github.com/dlau/koa-body](https://github.com/dlau/koa-body)

用于解析 `post/put/...` 请求时的 `body`，支持 `json`、`urlenocded`、`multipart`等格式。

```shell
npm install koa-body
```


## @koa/cors

项目地址: [https://github.com/koajs/cors](https://github.com/koajs/cors)

官方提供的`cors`跨域解决方案

```shell
npm install @koa/cors
```


## koa-session

项目地址: [https://github.com/koajs/session](https://github.com/koajs/session)

```shell
npm install koa-session
```


## koa-logger

项目地址: [https://github.com/koajs/logger](https://github.com/koajs/logger)

```shell
npm install koa-logger
```


## koa-compress

项目地址: [https://github.com/koajs/compress](https://github.com/koajs/compress)

```shell
npm install koa-compress
```


## koa-static

项目地址: [https://github.com/koajs/static](https://github.com/koajs/static)

```shell
npm install koa-static
```

## koa-csrf

项目地址: [https://github.com/koajs/csrf](https://github.com/koajs/csrf)

```shell
npm install koa-csrf
```


## koa-jwt

项目地址: [https://github.com/koajs/jwt](https://github.com/koajs/jwt)

用于验证`jwt`

```shell
npm install koa-jwt
```

> 注意: <br>
> 从`koa-v2`分支之后，`koa-jwt`不再提供`sign`,`verify`,`decode`等函数<br>
> 因此，需要通过下面的`jsonwebtoken`来生成`jwt`<br>


## jsonwebtoken

项目地址: [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

用于生成`jwt`

```shell
npm install jsonwebtoken
```


## koa-helmet

项目地址: [https://github.com/venables/koa-helmet](https://github.com/venables/koa-helmet)

安全方面的配置

```shell
npm install koa-static
```


## mongoose

项目地址: [https://github.com/Automattic/mongoose](https://github.com/Automattic/mongoose)

MongoDB 数据库的nodejs客户端

```shell
npm install mongoose
```
