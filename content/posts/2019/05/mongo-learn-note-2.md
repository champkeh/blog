---
title: "MongoDB 学习笔记之聚合操作"
date: 2019-05-20T14:34:48+08:00
description: ""
draft: true
tags:
- mongodb
---

1. 单一用途的聚合方法
2. Map Reduce
3. 聚合管道 db.collection.aggregate() (最被推荐的)

## 前置条件

### 聚合表达式

用来操作输入文档的“公式”

经聚合表达式计算出的值可以被赋予输出文档中的字段

可以表达很多对象，包括字段路径、系统变量、文本、表达式对象、操作符

### 聚合阶段

聚合阶段可以有顺序地排列在聚合管道中

绝大多数聚合阶段可以反复出现(`$out`和`$geoNear`除外)

不同的聚合阶段处理数据的范围不同: 数据库层面和集合层面

### 聚合操作符

用来构建聚合表达式

```shell
{ <operator>: [ <argument1>, <argument2>, ... ] }
{ <operator>: <argument> }
```

## 聚合操作

```shell
语法:
db.<collection>.aggregate(<pipeline>, <options>)

# <pipeline>文档定义了操作中使用的聚合管道阶段和聚合操作符
# <options>文档声明了一些聚合操作的选项
```

### 聚合表达式

#### 字段路径表达式

```shell
语法:
$<field> - 使用 $ 来指示字段路径
$<field>.<sub-field> - 使用 $ 和 . 来指示内嵌文档字段路径

> $name - 指示银行账户文档中客户姓名的字段
> $info.dateOpened - 指示银行账户文档中开户日期的字段
```

#### 系统变量表达式

```shell
语法: 
$$<variable> - 使用 $$ 来指示系统变量

$$CURRENT - 指示管道中当前操作的文档 (类似于OOP中的this)
$$CURRENT.<field> 和 $<field>是等效的
```

#### 常量表达式

```shell
$literal: <value> - 指示常量<value>
$literal: "$name" - 指示常量字符串 "$name",这里的$被当作常量处理
```

### 聚合管道阶段

```shell
$project - 对输入文档进行再次投射
$match - 对输入文档进行筛选
$limit - 筛选出管道内前N篇文档
$skip - 跳过管道内前N篇文档
$unwind - 展开输入文档中的数组字段
$sort - 对输入文档进行排序
$lookup - 对输入文档进行查询操作
$group - 对输入文档进行分组
$out - 将管道中的文档输出


# 先创建几个文档
> db.accounts.insertMany([
    {
        name: { firstName: "alice", lastName: "wong" },
        balance: 50
    },
    {
        name: { firstName: "bob", lastName: "yang" },
        balance: 20
    }
])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce2565f391c2bc43445f60e"),
		ObjectId("5ce2565f391c2bc43445f60f")
	]
}
```

#### $project

```shell 
# 对银行账户文档进行重新投影
> db.accounts.aggregate([
    {
        $project: {
            _id: 0,
            balance: 1,
            clientName: "$name.firstName" #这里是一个字段路径表达式
        }
    }
])
{ "balance" : 50, "clientName" : "alice" }
{ "balance" : 20, "clientName" : "bob" }

> db.accounts.aggregate([
    {
        $project: {
            _id: 0,
            balance: 1,
            nameArray: [ "$name.firstName", "$name.middleName", "$name.lastName" ]
        }
    }
])
{ "balance" : 50, "nameArray" : [ "alice", null, "wong" ] }
{ "balance" : 20, "nameArray" : [ "bob", null, "yang" ] }

## $project 是一个很常用的聚合阶段
## 可以创建新字段
## 可以用来灵活地控制输出文档的格式
## 也可以用来剔除不相干的字段，以优化聚合管道操作的性能
```

#### $match

`$match`中使用的文档筛选语法，和读取文档时筛选语法相同

```shell
# 对银行账户文档进行筛选
> db.accounts.aggregate([
    {
        $match: {
            "name.firstName": "alice"
        }
    }
]).pretty()
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50 }

> db.accounts.aggregate([
    {
        $match: {
            $or: [
                { balance: { $gt: 40, $lt: 80 } },
                { "name.lastName": "yang" }
            ]
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50 }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20 }


# 将筛选和投影阶段结合在一起
> db.accounts.aggregate([
    {
        $match: {
            $or: [
                { balance: { $gt: 40, $lt: 80 } },
                { "name.lastName": "yang" }
            ]
        }
    },
    {
        $project: {
            _id: 0
        }
    }
])
{ "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50 }
{ "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20 }

## $match 也是一个很常用的聚合阶段
## 应该尽量在聚合管道的开始阶段应用 $match
## 这样可以减少后续阶段中需要处理的文档数量，优化聚合操作的性能
```

#### $limit 和 $skip

```shell
# 筛选第一篇银行账户文档
> db.accounts.aggregate([
    {
        $limit: 1
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50 }

# 跳过第一篇银行账户文档
> db.accounts.aggregate([
    {
        $skip: 1
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20 }
```

#### $unwind

展开输入文档中的数组字段

```shell
# 向现有的银行账户文档中加入一些数组字段
> db.accounts.update(
    { "name.firstName": "alice" },
    {
        $set: {
            currency: [ "CNY", "USD" ]
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
> db.accounts.update(
    { "name.firstName": "bob" },
    {
        $set: {
            currency: "GBP"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
# 查看银行账户文档
> db.accounts.find()
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : [ "CNY", "USD" ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP" }


# 将文档中的货币种类数组展开
> db.accounts.aggregate([
    {
        $unwind: {
            path: "$currency"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "CNY" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "USD" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP" }

# 展开数组时添加元素位置
> db.accounts.aggregate([
    {
        $unwind: {
            path: "$currency",
            includeArrayIndex: "ccyIndex"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "CNY", "ccyIndex" : NumberLong(0) }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "USD", "ccyIndex" : NumberLong(1) }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP", "ccyIndex" : null }
```

```shell
# 再添加几个文档
> db.accounts.insertMany([
    {
        name: { firstName: "charlie", lastName: "gordon" },
        balance: 100
    },
    {
        name: { firstName: "david", lastName: "wu" },
        balance: 200,
        currency: []
    },
    {
        name: { firstName: "eddie", lastName: "kim" },
        balance: 20,
        currency: null
    }
])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce2637f391c2bc43445f610"),
		ObjectId("5ce2637f391c2bc43445f611"),
		ObjectId("5ce2637f391c2bc43445f612")
	]
}

# 将文档中的货币种类数组展开
> db.accounts.aggregate([
    {
        $unwind: {
            path: "$currency"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "CNY" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "USD" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP" }

# 可以看到，currency中没有值的时候，这个文档时通不过 $unwind 阶段的，也就是说，$unwind 阶段会剔除掉不合法的文档

# 展开数组时，保留空数组或不存在数组的文档
> db.accounts.aggregate([
    {
        $unwind: {
            path: "$currency",
            preserveNullAndEmptyArrays: true
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "CNY" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "USD" }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP" }
{ "_id" : ObjectId("5ce2637f391c2bc43445f610"), "name" : { "firstName" : "charlie", "lastName" : "gordon" }, "balance" : 100 }
{ "_id" : ObjectId("5ce2637f391c2bc43445f611"), "name" : { "firstName" : "david", "lastName" : "wu" }, "balance" : 200 }
{ "_id" : ObjectId("5ce2637f391c2bc43445f612"), "name" : { "firstName" : "eddie", "lastName" : "kim" }, "balance" : 20, "currency" : null }
```

#### $sort

```shell
# 对银行账户文档进行排序
> db.accounts.aggregate([
    {
        $sort: {
            balance: 1,
            "name.lastName": -1
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP" }
{ "_id" : ObjectId("5ce2637f391c2bc43445f612"), "name" : { "firstName" : "eddie", "lastName" : "kim" }, "balance" : 20, "currency" : null }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : [ "CNY", "USD" ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f610"), "name" : { "firstName" : "charlie", "lastName" : "gordon" }, "balance" : 100 }
{ "_id" : ObjectId("5ce2637f391c2bc43445f611"), "name" : { "firstName" : "david", "lastName" : "wu" }, "balance" : 200, "currency" : [ ] }
```

#### $lookup

```shell
# $lookup 允许我们使用管道之外的文档集合(查询集合)，而不仅限于管道内
# 当管道中的文档经过 $lookup 阶段时，每篇文档中都会被插入一些新的字段，字段的内容就是符合查询条件的查询集合中的文档内容

# 使用单一字段值进行查询
语法: 
$lookup: {
    from: <collection to join>, # 查询集合(同一个数据库，不能跨数据库查询)
    localField: <field from the input documents>, #管道文档中想要查询的字段名字
    foreignField: <field from the documents of the "from" collection>, #查询集合中想要查询的字段名字
    as: <output array field> # 对新插入的字段进行重命名
}

# 增加一个集合用来储存外汇数据(作为查询集合来使用)
> db.forex.insertMany([
    {
        ccy: "USD",
        rate: 6.91,
        date: new Date("2018-12-21")
    },
    {
        ccy: "GBP",
        rate: 8.72,
        date: new Date("2018-08-21")
    },
    {
        ccy: "CNY",
        rate: 1.0,
        date: new Date("2018-12-21")
    }
])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce26927391c2bc43445f613"),
		ObjectId("5ce26927391c2bc43445f614"),
		ObjectId("5ce26927391c2bc43445f615")
	]
}

# 将查询到的外汇汇率文档写入银行账户文档
> db.accounts.aggregate([
    {
        $lookup: {
            from: "forex",
            localField: "currency",
            foreignField: "ccy",
            as: "forexData"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : [ "CNY", "USD" ], "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP", "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f614"), "ccy" : "GBP", "rate" : 8.72, "date" : ISODate("2018-08-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f610"), "name" : { "firstName" : "charlie", "lastName" : "gordon" }, "balance" : 100, "forexData" : [ ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f611"), "name" : { "firstName" : "david", "lastName" : "wu" }, "balance" : 200, "currency" : [ ], "forexData" : [ ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f612"), "name" : { "firstName" : "eddie", "lastName" : "kim" }, "balance" : 20, "currency" : null, "forexData" : [ ] }

# 如果 localField 是一个数组字段。。。
> db.accounts.aggregate([
    {
        $unwind: {
            path: "$currency"
        }
    },
    {
        $lookup: {
            from: "forex",
            localField: "currency",
            foreignField: "ccy",
            as: "forexData"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "CNY", "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : "USD", "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP", "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f614"), "ccy" : "GBP", "rate" : 8.72, "date" : ISODate("2018-08-21T00:00:00Z") } ] }
# 👆currency字段不合法的文档，都被 $unwind 阶段过滤掉了
```

```shell
# 使用复杂条件进行查询
语法:
$lookup: {
    from: <collection to join>,
    let: { <var_1>: <expression>, ..., <var_n>: <expression> },
    pipeline: [ <pipeline to execute on the collection to join> ],
    as: <output array field>
}

# pipeline 又是一个聚合管道，这个管道用于对查询集合中的文档使用聚合阶段进行处理
# 如果我们在这个新的管道中，需要使用到原管道中的任何字段，则需要使用 let 参数进行声明


# 将特定日期外汇汇率写入银行账户文档
> db.accounts.aggregate([
    {
        $lookup: {
            from: "forex",
            pipeline: [
                {
                    $match: {
                        date: new Date("2018-12-21")
                    }
                }
            ],
            as: "forexData"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : [ "CNY", "USD" ], "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP", "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f610"), "name" : { "firstName" : "charlie", "lastName" : "gordon" }, "balance" : 100, "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f611"), "name" : { "firstName" : "david", "lastName" : "wu" }, "balance" : 200, "currency" : [ ], "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f612"), "name" : { "firstName" : "eddie", "lastName" : "kim" }, "balance" : 20, "currency" : null, "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }

# 注意，在上面这个例子中，查询条件 pipeline 和管道文档 accounts 之间，其实并没有直接的联系
# 这种查询被称作不相关查询(unrelated query)，$lookup 从 3.6 版本开始支持不相关查询


# 将特定日期外汇汇率写入余额大于100的银行账户文档
> db.accounts.aggregate([
    {
        $lookup: {
            from: "forex",
            let: { bal: "$balance" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: [ "$date", new Date("2018-12-21") ] },
                                { $gt: [ "$$bal", 100 ] }
                            ]
                        }
                    }
                }
            ],
            as: "forexData"
        }
    }
])
{ "_id" : ObjectId("5ce2565f391c2bc43445f60e"), "name" : { "firstName" : "alice", "lastName" : "wong" }, "balance" : 50, "currency" : [ "CNY", "USD" ], "forexData" : [ ] }
{ "_id" : ObjectId("5ce2565f391c2bc43445f60f"), "name" : { "firstName" : "bob", "lastName" : "yang" }, "balance" : 20, "currency" : "GBP", "forexData" : [ ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f610"), "name" : { "firstName" : "charlie", "lastName" : "gordon" }, "balance" : 100, "forexData" : [ ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f611"), "name" : { "firstName" : "david", "lastName" : "wu" }, "balance" : 200, "currency" : [ ], "forexData" : [ { "_id" : ObjectId("5ce26927391c2bc43445f613"), "ccy" : "USD", "rate" : 6.91, "date" : ISODate("2018-12-21T00:00:00Z") }, { "_id" : ObjectId("5ce26927391c2bc43445f615"), "ccy" : "CNY", "rate" : 1, "date" : ISODate("2018-12-21T00:00:00Z") } ] }
{ "_id" : ObjectId("5ce2637f391c2bc43445f612"), "name" : { "firstName" : "eddie", "lastName" : "kim" }, "balance" : 20, "currency" : null, "forexData" : [ ] }
```

#### $group

```shell
语法:
$group: {
    _id: <expression>,
    <field1>: { <accumulator1>: <expression1> },
    ...
}

## _id 定义分组规则
## 可以使用聚合操作符来定义新字段

# 增加一个集合用来储存股票交易记录
> db.transactions.insertMany([
    {
        symbol: "600519",
        qty: 100,
        price: 567.4,
        currency: "CNY"
    },
    {
        symbol: "AMZN",
        qty: 1,
        price: 1377.5,
        currency: "USD"
    },
    {
        symbol: "AAPL",
        qty: 2,
        price: 150.7,
        currency: "USD"
    }
])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce27b19391c2bc43445f616"),
		ObjectId("5ce27b19391c2bc43445f617"),
		ObjectId("5ce27b19391c2bc43445f618")
	]
}

# 按照交易货币种类来分组交易记录
> db.transactions.aggregate([
    {
        $group: {
            _id: "$currency"
        }
    }
])
{ "_id" : "USD" }
{ "_id" : "CNY" }

## 不使用聚合操作符的情况下，$group 可以返回管道文档中某一字段的所有(不重复的)值，类似于SQL中的 distinct

# 使用聚合操作符计算分组的聚合值
> db.transactions.aggregate([
    {
        $group: {
            _id: "$currency",
            totalQty: { $sum: "$qty" },
            totalNotional: { $sum: { $multiply: [ "$price", "$qty" ] } },
            avgPrice: { $avg: "$price" },
            count: { $sum: 1 },
            maxNotional: { $max: { $multiply: [ "$price", "$qty" ] } },
            minNotional: { $min: { $multiply: [ "$price", "$qty" ] } }
        }
    }
]).pretty()
{
	"_id" : "USD",
	"totalQty" : 3,
	"totalNotional" : 1678.9,
	"avgPrice" : 764.1,
	"count" : 2,
	"maxNotional" : 1377.5,
	"minNotional" : 301.4
}
{
	"_id" : "CNY",
	"totalQty" : 100,
	"totalNotional" : 56740,
	"avgPrice" : 567.4,
	"count" : 1,
	"maxNotional" : 56740,
	"minNotional" : 56740
}

# 使用聚合操作符计算所有文档聚合值，而不是分组
> db.transactions.aggregate([
    {
        $group: {
            _id: null,
            totalQty: { $sum: "$qty" },
            totalNotional: { $sum: { $multiply: [ "$price", "$qty" ] } },
            avgPrice: { $avg: "$price" },
            count: { $sum: 1 },
            maxNotional: { $max: { $multiply: [ "$price", "$qty" ] } },
            minNotional: { $min: { $multiply: [ "$price", "$qty" ] } }
        }
    }
]).pretty()
{
	"_id" : null,
	"totalQty" : 103,
	"totalNotional" : 58418.9,
	"avgPrice" : 698.5333333333333,
	"count" : 3,
	"maxNotional" : 56740,
	"minNotional" : 301.4
}

# 使用聚合操作符创建数组字段
> db.transactions.aggregate([
    {
        $group: {
            _id: "$currency",
            symbols: {
                $push: "$symbol"
            }
        }
    }
]).pretty()
{ "_id" : "USD", "symbols" : [ "AMZN", "AAPL" ] }
{ "_id" : "CNY", "symbols" : [ "600519" ] }
```

#### $out

```shell
# 将聚合管道中的文档写入一个新集合
> db.transactions.aggregate([
    {
        $group: {
            _id: "$currency",
            symbols: {
                $push: "$symbol"
            }
        }
    },
    {
        $out: "output"
    }
])

# 查看 output 集合
> db.output.find()
{ "_id" : "USD", "symbols" : [ "AMZN", "AAPL" ] }
{ "_id" : "CNY", "symbols" : [ "600519" ] }

# 将聚合管道中的文档写入一个已存在的集合
> db.transactions.aggregate([
    {
        $group: {
            _id: "$symbol",
            totalNotional: { $sum: { $multiply: [ "$price", "$qty" ] } }
        }
    },
    {
        $out: "output"
    }
])

# 查看 output 集合
> db.output.find()
{ "_id" : "AAPL", "totalNotional" : 301.4 }
{ "_id" : "AMZN", "totalNotional" : 1377.5 }
{ "_id" : "600519", "totalNotional" : 56740 }

# 如果在out阶段聚合管道操作遇到错误，管道阶段不会创建新集合或是覆盖已存在的集合内容
```

### options

```shell
语法: 
allowDiskUse: <boolean>

## 每个聚合管道阶段使用的内存不能超过100MB
## 如果数据量较大，为了防止聚合管道阶段超出内存上限而抛出错误，可以启用 allowDiskUse 选项
## allowDiskUse 启用之后，聚合阶段可以在内存容量不足时，将操作数据写入临时文件中
## 临时文件会被写入 dbPath 下的 _tmp 文件夹，dbPath 的默认值为 /data/db

> db.transactions.aggregate([
    {
        $group: {
            _id: "$currency",
            symbols: {
                $push: "$symbol"
            }
        }
    }
], { allowDiskUse: true })
{ "_id" : "USD", "symbols" : [ "AMZN", "AAPL" ] }
{ "_id" : "CNY", "symbols" : [ "600519" ] }
```

## 聚合操作的优化

### 聚合阶段顺序优化

#### $project + $match

```shell
$project + $match
$match 阶段会在 $project 阶段之前运行
目的是尽可能早的减少管道中的文档数量

> db.transactions.aggregate([
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    },
    {
        $match: {
            currency: "USD",
            notional: { $gt: 1000 } #这里可以直接使用上面创建的字段 notional
        }
    }
])
{ "symbol" : "AMZN", "currency" : "USD", "notional" : 1377.5 }

# MongoDB实际执行顺序是:
> db.transactions.aggregate([
    {
        $match: {
            currency: "USD"
        }
    },
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    },
    {
        $match: {
            notional: { $gt: 1000 }
        }
    }
])
```

#### $sort + $match

```shell
$sort + $match
$match 阶段会在 $sort 阶段之前运行

> db.transactions.aggregate([
    {
        $sort: {
            price: 1
        }
    },
    {
        $match: {
            currency: "USD"
        }
    }
])

# MongoDB实际执行顺序是:
> db.transactions.aggregate([
    {
        $match: {
            currency: "USD"
        }
    },
    {
        $sort: {
            price: 1
        }
    }
])
```

#### $project + $skip

```shell
$project + $skip
$skip 阶段会在 $project 阶段之前运行

> db.transactions.aggregate([
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    },
    {
        $skip: 2
    }
])

# MongoDB实际执行的顺序是:
> db.transactions.aggregate([
    {
        $skip: 2
    },
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    }
])
```

### 聚合阶段合并优化

#### $sort + $limit

```shell
$sort + $limit
如果两者之间没有夹杂着**会改变文档数量**的聚合阶段，$sort 和 $limit 阶段可以合并

$match 和 $unwind 阶段可能会改变文档数量，如果夹杂在 $sort 和 $limit 中间的话，就没办法执行合并优化了

> db.transactions.aggregate([
    {
        $sort: {
            price: 1
        }
    },
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    },
    {
        $limit: 2
    }
])

# MongoDB实际上执行的顺序是:
> db.transactions.aggregate([
    {
        # 这里是伪代码，说明 $sort 和 $limit 阶段合并为一个阶段
        $sort: {
            price: 1
        },
        $limit: 2
    },
    {
        $project: {
            _id: 0,
            symbol: 1,
            currency: 1,
            notional: { $multiply: [ "$price", "$qty" ] }
        }
    }
])
```

#### $limit + $limit
#### $skip + $skip
#### $match + $match

```shell
连续的 $limit, $skip 或 $match 阶段排列在一起时，可以合并为一个阶段

{ $limit: 10 },
{ $limit: 5 }
=>
{ $limit: 5 }

{ $skip: 10 },
{ $skip: 5 }
=>
{ $skip: 15 }

{ $match: { currency: "USD" } },
{ $match: { qty: 1 } }
=>
{
    $match: {
        $and: [
            { currency: "USD" },
            { qty: 1 }
        ]
    }
}
```

#### $lookup + $unwind

```shell
连续排列在一起的 $lookup 和 $unwind 阶段，如果 $unwind 应用在 $lookup 阶段创建的 as 字段上，则两者可以合并

> db.accounts.aggregate([
    {
        $lookup: {
            from: "forex",
            locakField: "currency",
            foreignField: "ccy",
            as: "forexData"
        }
    },
    {
        $unwind: "$forexData"
    }
])

# MongoDB实际执行的顺序是:
> db.accounts.aggregate([
    {
        # 这里是伪代码，说明 $lookup 和 $unwind 被合并到一个阶段了
        $lookup: {
            from: "forex",
            localField: "currency",
            foreignField: "ccy",
            as: "forexData"
        },
        $unwind: "$forexData"
    }
])
```
