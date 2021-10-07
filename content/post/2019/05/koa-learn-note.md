+++
title = "Koa 学习笔记"
date = 2019-05-15T10:40:36+08:00
description = ""
draft = false
tags = ["nodejs", "koa"]
+++

## nodemon工具的使用

工具说明: 类似于前端开发，我希望node服务器运行起来之后，当我修改了我的代码之后，服务会自动重启，不需要我每次都手动重启服务。

项目地址: [https://github.com/remy/nodemon](https://github.com/remy/nodemon)

```shell
$ node install -g nodemon #全局安装
$ nodemon app.js #用 nodemon 替代 node 来启动应用
```


## 关于Generator

在老的教程中，中间件的写法会有很多生成器函数的用法，比如:
```js
app.use(function* (next) {
    console.log("1");
    yield next;
    console.log("2");
});
```

在koa的v2版中，写法发生了变化:
```js
app.use(async (ctx, next) => {
    console.log("1");
    await next();
    console.log("2");
})
```

> 不知道这个是不是只是一个语法的问题，抽时间需要研究一下。
> 附上es6 generator的教程
> [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
> [function*语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
> [阮一峰的文章](http://es6.ruanyifeng.com/#docs/generator)
> [introduction to koa generator](https://blog.risingstack.com/introduction-to-koa-generators/)


## 关于 async/await 与 Promise

async/await 是 Promise 的语法糖，向👇看:
下面这两个函数是等价的:
```js
async function foo() {
    return 42;
}

function foo() {
    return new Promise((resolve, reject) => {
        resolve(42);
    });
}
```

在 `async` 函数里面抛的错误，会出现在 `rejected promise` 中:
```js
async function foo() {
    throw new Error('oops!');
}

function foo() {
    return new Promise((resolve, reject) => {
        reject(new Error('oops!'));
    });
}
```

另外，在 `async` 函数中，我们可以使用 `await` 关键字去等待另一个 `promised` 函数返回，然后把结果赋给一个局部变量:
```js
async function foo() {
    const userId = 42;
    const user = await User.findById(userId);

    return user.name;
}

function foo() {
    const userId = 42;

    return User.findById(userId).then(user => {
        return user.name;
    });
}
```

## 参考
[tutorial spoint](https://www.tutorialspoint.com/koajs/index.htm)
[koajs/examples](https://github.com/koajs/examples)
