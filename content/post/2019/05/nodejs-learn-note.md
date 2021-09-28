+++
title = "Nodejs之nextTick vs setImmediate"
date = 2019-05-14T13:49:09+08:00
description = ""
draft = false
tags = ["nodejs"]
+++

关于 `process.nextTick` 和 `setImmediate` 执行时机的问题：
```js
// 加入两个nextTick()的回调函数
process.nextTick(function () {
    console.log('nextTick延迟执行1');
});
process.nextTick(function () {
    console.log('nextTick延迟执行2');
});
// 加入两个setImmediate()的回调函数
setImmediate(function () {
    console.log('setImmediate延迟执行1');
    // 进入下次循环
    process.nextTick(function () {
        console.log('强势插入');
    });
});
setImmediate(function () {
    console.log('setImmediate延迟执行2');
});
console.log('正常执行');
```

《nodejs深入浅出》的3.4章中的代码执行结果如下：
```
正常执行
nextTick延迟执行1
nextTick延迟执行2
setImmediate延迟执行1
强势插入
setImmediate延迟执行2
```
[参见](http://www.ituring.com.cn/book/miniarticle/62508)

可能是因为node版本不同，我在本地的执行结果如下：
```
正常执行
nextTick延迟执行1
nextTick延迟执行2
setImmediate延迟执行1
setImmediate延迟执行2
强势插入
```

```bash
$ node -v
v10.15.0
```

[nextTick vs setImmediate](http://plafer.github.io/2015/09/08/nextTick-vs-setImmediate/)

[stack-overflow](https://stackoverflow.com/questions/15349733/setimmediate-vs-nexttick)

[官方文档说明](https://nodejs.org/de/docs/guides/event-loop-timers-and-nexttick/)

[更多文章](http://voidcanvas.com/setimmediate-vs-nexttick-vs-settimeout/)