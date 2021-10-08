---
title: "MongoDB 学习笔记之数据模型"
date: 2019-05-21T01:38:11+08:00
description: ""
draft: true
tags:
- mongodb
---

> 没有固定的数据格式 ≠ 无需设计数据模型<br>
> 文档结构 -> 数据之间的关系<br>
> 内嵌式结构 vs 规范式结构<br>

## 内嵌式结构

```shell
{
    name: "alice",
    currency: "CNY",
    balance: 100,
    contact: {
        tel: "11111111",
        email: "a@gmail.com"
    }
}
```

## 规范式结构

```shell
{
    _id: <objectId1>,
    tel: "11111111",
    email: "a@gmail.com"
}

{
    name: "alice",
    currency: "CNY",
    balance: 100,
    contact: <objectId1>
}
{
    name: "alice",
    currency: "USD",
    balance: 20,
    contact: <objectId1>
}
```

## 文档关系

### 一对一

```shell
#银行账户数据
{
    name: "alice",
    currency: "CNY",
    balance: 100
}
#银行账户开户时的相关信息
{
    dateOpened: 20190101,
    branch: 001
}
```

```shell
#使用内嵌结构来表达这种一对一的关系
{
    name: "alice",
    currency: "CNY",
    balance: 100,
    info: {
        dateOpened: 20190101,
        branch: 001
    }
}
```

> 内嵌结构的好处:<br>
> 一次查询就可以返回所有数据<br>
> 更具独立性的数据应作为顶层文档<br>
> 补充性数据应作为内嵌文档<br>

### 一对多

```shell
#联系信息
{
    _id: <objectId1>,
    tel: "11111111",
    email: "a@gmail.com"
}
#账户信息
{
    name: "alice",
    currency: "CNY",
    balance: 100,
    contact: <objectId1>
}
#账户信息
{
    name: "alice",
    currency: "USD",
    balance: 20,
    contact: <objectId1>
}
```

```shell
#采用内嵌结构来表达一对多的关系
{
    name: "alice",
    currency: "CNY",
    balance: 100,
    contact: {
        tel: "11111111",
        email: "a@gmail.com"
    }
}
{
    name: "alice",
    currency: "USD",
    balance: 20,
    contact: {
        tel: "11111111",
        email: "a@gmail.com"
    }
}
```

> 优势: <br>
> 一次查询就可以返回所有数据<br>
> <br>
> 劣势: <br>
> 数据重复
> 更新内嵌文档的复杂度增高<br>
> <br>
> 适合读取频率**远高于**更新频率的数据

```shell
#采用规范式结构来表达一对多的关系
{
    _id: <objectId1>,
    tel: "11111111",
    email: "a@gmail.com"
}
{
    name: "alice",
    currency: "CNY",
    balance: 100,
    contact: <objectId1>
}
{
    name: "alice",
    currency: "USD",
    balance: 20,
    contact: <objectId1>
}
```

> 优点: <br>
> 减少了重复数据<br>
> 降低了文档更新的复杂度<br>
> <br>
> 劣势: <br>
> 需要多次读取操作才能得到完整的数据(因为MongoDB没有join操作)<br>

```shell
#一对多的其他表示方式

#内嵌式
{
    contact: {
        tel: "11111111",
        email: "a@gmail.com"
    },
    accounts: [
        {
            name: "alice",
            currency: "CNY",
            balance: 100
        },
        {
            name: "alice",
            currency: "USD",
            balance: 20
        }
    ]
}

#规范式
{
    _id: <objectId1>,
    name: "alice",
    currency: "CNY",
    balance: 100
}
{
    _id: <objectId2>,
    name: "alice",
    currency: "USD",
    balance: 20
}
{
    contact: {
        tel: "11111111",
        email: "a@gmail.com"
    },
    accounts: [
        <objectId1>,
        <objectId2>
    ]
}
```

> 适合常常需要返回全部相关文档的查询<br>
> 数组元素较多时，避免使用内嵌文档<br>
> 数组元素极多时，重新设计文档结构<br>


### 树形结构

> 适合存储静态数据<br>
> 读取频率远大于更新频率<br>

![](/images/tree-structure.png)
![](/images/tree-structure2.png)
![](/images/tree-structure3.png)

### 树形结构的遍历

#### 深度优先

![](/images/loop-tree-structure.png)

#### 广度优先
