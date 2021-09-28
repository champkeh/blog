+++
title = "MongoDB 学习笔记之CRUD"
date = 2019-05-18T11:24:11+08:00
description = ""
draft = false
tags = ["mongo"]
+++

## 启动一个 MongoDB 服务器容器

```shell
$ docker pull mongo:4
$ docker run --name mymongo -v /data/docker-db:/data/db -d mongo:4
```

## 启动 Mongo Express 容器

```shell
$ docker pull mongo-express
$ docker run --link mymongo:mongo -p 8081:8081 -d mongo-express
```

在浏览器打开 `http://localhost:8081`，mongo-expres 的界面如下:

![](/images/mongo-express-shot@2x.png)


## 启动 Mongo shell

```shell
$ docker exec -it mymongo mongo
```


## 文档的基本操作

```shell
# 查看所有数据库
> show dbs
admin   0.000GB
config  0.000GB
local   0.000GB

# 切换到 test 数据库
> use test
switched to db test

# 查看 test 数据库中的集合
> show collections
```

### 创建文档

```shell
# 准备写入数据库的文档
# {
#   _id: "account1",
#   name: "alice",
#   balance: 100
# }
# 将文档写入 accounts 集合
> db.accounts.insertOne(
... {
...    _id: "account1",
...    name: "alice",
...    balance: 100
...  }
...)
{ "acknowledged": true, "insertedId": "account1" }

# 写入id重复的数据时
> db.accounts.insertOne(
... {
...    _id: "account1",
...    name: "bob",
...    balance: 200
...  }
...)
2019-05-18T13:37:29.722+0000 E QUERY    [js] WriteError: E11000 duplicate key error collection: test.accounts index: _id_ dup key: { : "account1" } :
WriteError({
	"index" : 0,
	"code" : 11000,
	"errmsg" : "E11000 duplicate key error collection: test.accounts index: _id_ dup key: { : \"account1\" }",
	"op" : {
		"_id" : "account1",
		"name" : "bob",
		"balance" : 200
	}
})
WriteError@src/mongo/shell/bulk_api.js:461:48
Bulk/mergeBatchResults@src/mongo/shell/bulk_api.js:841:49
Bulk/executeBatch@src/mongo/shell/bulk_api.js:906:13
Bulk/this.execute@src/mongo/shell/bulk_api.js:1150:21
DBCollection.prototype.insertOne@src/mongo/shell/crud_api.js:252:9
@(shell):1:1

# 使用 try-catch 捕获错误
> try {
...  db.accounts.insertOne(
...    {
...      _id: "account1",
...      name: "bob",
...      balance: 200
...    }
...  )
...} catch (e) {
...  print(e)    
...}
WriteError({
	"index" : 0,
	"code" : 11000,
	"errmsg" : "E11000 duplicate key error collection: test.accounts index: _id_ dup key: { : \"account1\" }",
	"op" : {
		"_id" : "account1",
		"name" : "bob",
		"balance" : 200
	}
})

# 创建多个文档
> db.accounts.insertMany( [
... {
...   name: 'charlie',
...   balance: 500
... },
... {
...   name: 'david',
...   balance: 200
... }
... ] )
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce00d5972e77e7cb392a8fe"),
		ObjectId("5ce00d5972e77e7cb392a8ff")
	]
}

# 顺序写出现错误时
> try {
... db.accounts.insertMany( [
...   {
...     _id: 'account1',
...     name: 'edwrad',
...     balance: 700
...   },
...   {
...     name: 'fred',
...     balance: 20
...   }
... ] )
... } catch(e) {
...   print(e)
... }
BulkWriteError({
	"writeErrors" : [
		{
			"index" : 0,
			"code" : 11000,
			"errmsg" : "E11000 duplicate key error collection: test.accounts index: _id_ dup key: { : \"account1\" }",
			"op" : {
				"_id" : "account1",
				"name" : "edwrad",
				"balance" : 700
			}
		}
	],
	"writeConcernErrors" : [ ],
	"nInserted" : 0, #注意这里，插入条数为0
	"nUpserted" : 0,
	"nMatched" : 0,
	"nModified" : 0,
	"nRemoved" : 0,
	"upserted" : [ ]
})

# 乱序写出现错误时
> try {
... db.accounts.insertMany( [
...   {
...     _id: 'account1',
...     name: 'edwrad',
...     balance: 700
...   },
...   {
...     name: 'fred',
...     balance: 20
...   }
... ], { ordered: false } )
... } catch(e) {
...   print(e)
... }
BulkWriteError({
	"writeErrors" : [
		{
			"index" : 0,
			"code" : 11000,
			"errmsg" : "E11000 duplicate key error collection: test.accounts index: _id_ dup key: { : \"account1\" }",
			"op" : {
				"_id" : "account1",
				"name" : "edwrad",
				"balance" : 700
			}
		}
	],
	"writeConcernErrors" : [ ],
	"nInserted" : 1, #成功插入了1条
	"nUpserted" : 0,
	"nMatched" : 0,
	"nModified" : 0,
	"nRemoved" : 0,
	"upserted" : [ ]
})
```


> 总结<br>
> `db.collection.insertMany()` 处理错误的方式:<br>
```js
{
    _id: "account1",
    name: "edwrad",        -------> 错误的文档
    balance: 700
}
{
    name: "fred",          -------> 正确的文档
    balance: 20
}
```
> 在顺序写入时，一旦遇到错误，操作便会退出，剩余的文档无论正确与否，都不会被写入<br>
> 所以，上面这两个文档都不会被写入到数据库<br>
> <br>
> 在乱序写入时，即使某些文档造成了错误，剩余的正确的文档仍然会被写入
> 所以，第二篇文档会被正常写入数据库<br>


```shell
# insert 命令
# 创建单个或多个文档
> db.accounts.insert(
... {
...   name: 'george',
...   balance: 1000
... }
... )
WriteResult({ "nInserted" : 1 })

> db.accounts.insert( [
...  {
...    name: 'abc',
...    balance: 200
...  },
...  {
...    name: 'xyz',
...    balance: 200
...  }
] )
BulkWriteResult({
    "writeErrors": [ ],
    "writeConcernErrors": [ ],
    "nInserted": 2,
    "nUpserted": 0,
    "nMatched": 0,
    "nModified": 0,
    "nRemoved": 0,
    "upserted": [ ]
})
```

```shell
# save 创建单一文档
> db.accounts.save(
    {
        name: '',
        balance: 200
    },
    {
        writeConcern: <document>
    }
)
# save 会调用 insert 创建文档，所以 save 的返回类型和 insert 相同
```

### 对象主键

默认的对象主键 objectId

```shell
# 生成objectId主键
> ObjectId()
ObjectId("5ce0ec0672e77e7cb392a90b")

# 提前 ObjectId 的创建时间
> ObjectId("5ce0ec0672e77e7cb392a90b").getTimestamp()
ISODate("2019-05-19T05:39:18Z")
```

### 复合主键

可以使用文档作为文档的主键

```shell
> db.accounts.insert(
    {
        _id: { accountNo: "001", type: "savings" },
        name: "irene",
        balance: 80
    }
)
```

### 读取文档

```shell
# find 支持匹配查询和投射
db.<collection>.find(<query>, <projection>)
<query>定义了搜索条件
<projection>定义了投射，可以只返回结果文档中的部分字段

# 读取全部文档
# 既不筛选，也不投射
> db.accounts.find()
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }

# 格式化结果
> db.accounts.find().pretty()
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{
	"_id" : ObjectId("5ce00c9672e77e7cb392a8fd"),
	"name" : "bob",
	"balance" : 50
}
{
	"_id" : ObjectId("5ce00d5972e77e7cb392a8fe"),
	"name" : "charlie",
	"balance" : 500
}
{
	"_id" : ObjectId("5ce00d5972e77e7cb392a8ff"),
	"name" : "david",
	"balance" : 200
}
{
	"_id" : ObjectId("5ce00f5272e77e7cb392a901"),
	"name" : "fred",
	"balance" : 20
}
{
	"_id" : ObjectId("5ce011fd72e77e7cb392a902"),
	"name" : "george",
	"balance" : 1000
}
{
	"_id" : ObjectId("5ce0f15c72e77e7cb392a90c"),
	"name" : "champ",
	"balance" : 100
}
{
	"_id" : {
		"type" : "savings",
		"accountId" : "001"
	},
	"name" : "john",
	"balance" : 200
}
{
	"_id" : {
		"type" : "savings",
		"accountId" : "002"
	},
	"name" : "tom",
	"balance" : 100
}
{
	"_id" : {
		"type" : "alipay",
		"accountId" : "003"
	},
	"name" : "tom",
	"balance" : 500
}
```

#### 匹配查询

```shell
# 筛选文档
# 匹配查询
语法: { <field>: <value>, ... }

# 读取 alice 的银行账户文档
> db.accounts.find( { name: "alice" } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

# 读取 alice 的余额为100元的银行账户文档
> db.accounts.find( { name: "alice", balance: 100 } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

# 读取 alice 的余额为200元的银行账户文档
> db.accounts.find( { name: "alice", balance: 200 } )
不存在

# 读取银行账户类型为 savings 的文档 (复合主键)
> db.accounts.find( { "_id.type": "savings" } )
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
```

#### 比较操作符

```shell
# 筛选文档
# 比较操作符

$eq     equal
$ne     not equal
$gt     great than
$gte    great than or equal
$lt     less than
$lte    less than or equal

语法: { <field>: { $<operator>: <value> } }

# 读取 alice 的银行账户文档
> db.accounts.find( { name: { $eq: "alice" } } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
# 与 db.accounts.find( { name: "alice" } ) 的查询效果相同

# 读取不属于 alice 的银行账户文档
> db.accounts.find( { name: { $ne: "alice" } } )
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }

# 读取所有余额不等于100的银行账户文档
> db.accounts.find( { balance: { $ne: 100 } } )
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }

# 读取余额大于200的银行账户文档
> db.accounts.find( { balance: { $gt: 200 } } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }


$in     匹配字段值与任一查询值相等的文档
$nin    匹配字段值与任何查询值都不相等的文档

语法: { <field>: { $in: [ <value1>, <value2>, ... ] } }

# 读取 alice 和 charlie 的银行账户文档
> db.accounts.find( { name: { $in: [ "alice", "charlie" ] } } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }

# 读取除了 alice 和 charlie 以外的其他用户的银行账户文档
> db.accounts.find( { name: { $nin: [ "alice", "charlie" ] } } )
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
```

> 注意: <br>
> `$ne`会筛选出并不包含查询字段的文档<br>
> 比如，读取银行账户类型不是 `savings` 的文档: <br>
> `db.accounts.find( { "_id.type": { $ne: "savings" } } )`
```js
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
```
> 可以看到，结果中有很多文档并没有包含 `_id.type` 这个字段<br>
> 可以配合下面的 `$exists` 操作符一块使用<br>
> <br>
> 与 `$ne` 类似，`$nin` 也会筛选出并不包含查询字段的文档<br>
> 比如，读取账户类型不是 `savings` 的银行账户文档: <br>
> `db.accounts.find( { "_id.type": { $nin: [ "savings" ] } } )`
```js
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
```
> 可以看到，结果中有很多文档并没有包含 `_id.type` 这个字段<br>
> 可以配合下面的 `$exists` 操作符一块使用<br>

#### 逻辑操作符

```shell
# 筛选文档
# 逻辑操作符查询

$not    匹配筛选条件不成立的文档
$and    匹配多个筛选条件全部成立的文档
$or     匹配至少一个筛选条件成立的文档
$nor    匹配多个筛选条件全部不成立的文档


$not 语法:
{ <field>: { $not: { <operator-expression> } } }

# 读取余额不小于200的银行账户文档
> db.accounts.find( { balance: { $not: { $lt: 200 } } } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }


$and 语法:
{ $and: [ { <expression1> }, { <expression2> }, ... ] }

# 读取余额大于100并且用户姓名排在 fred 之后的银行账户文档
> db.accounts.find({ $and: [
    { balance: { $gt: 100 } },
    { name: { $gt: "fred" } }
] })
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }

# 当筛选条件应用在不同字段上时，可以省略 $and 操作符
> db.accounts.find( { balance: { $gt: 100 }, name: { $gt: "fred" } } )
和上面的查询效果相同

# 当筛选条件应用在同一个字段上时，也可以简化命令
# 读取余额大于100并且小于500的银行账户文档
> db.accounts.find({ $and: [
    { balance: { $gt: 100 } },
    { balance: { $lt: 500 } }
] })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }

> db.accounts.find( { balance: { $gt: 100, $lt: 500 } } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }


$or 语法:(与 $and 类似)
{ $or: [ { <expression1> }, { <expression2> }, ... ] }

# 读取属于 alice 或者 charlie 的银行账户文档
> db.accounts.find({ $or: [ 
    { name: { $eq: "alice" } },
    { name: { $eq: "charlie" } }
] })
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }

# 当所有筛选条件使用的都是 $eq 操作符时，$or 和 $in 的效果是相同的
> db.accounts.find( { name: { $in: [ "alice", "charlie" ] } } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }

# 读取余额小于100或者大于500的银行账户文档
> db.accounts.find({ $or: [
    { balance: { $lt: 100 } },
    { balance: { $gt: 500 } }
] })
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }


$nor 语法:(与 $and 类似)
{ $nor: [ { <expression1> }, { <expression2> }, ... ] }

# 读取不属于 alice 和 charlie 且余额不小于100的银行账户文档
> db.accounts.find({ $nor: [
    { name: "alice" },
    { name: "charlie" },
    { balance: { $lt: 100 } }
] })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
```

> 注意: <br>
> `$not` 和 `$nor` 也会筛选出并不包含查询字段的文档<br>
> 可以配合下面的 `$exists` 操作符一块使用<br>

#### 字段操作符

```shell
# 筛选文档
# 字段操作符

$exists     匹配包含查询字段的文档
$type       匹配字段类型符合查询值的文档


$exists 语法:
{ <field>: { $exists: <boolean> } }

# 读取包含账户类型字段的银行账户文档
> db.accounts.find( { "_id.type": { $exists: true } } )
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }

> db.accounts.find( { "_id.type": { $ne: "alipay", $exists: true } } )
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }


$type 语法:
{ <field>: { $type: <BSON type> } }
{ <field>: { $type: [ <BSON type1>, <BSON type2>, ... ] } }

# 读取文档主键是字符串的银行账户文档
> db.accounts.find( { _id: { $type: "string" } } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

# 读取文档主键是对象主键或者复合主键的银行账户文档
> db.accounts.find( { _id: { $type: ["objectId", "object"] } } )
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }

# 读取用户姓名是 null 的银行账户文档
> db.accounts.find( { name: { $type: "null" } } )

除了使用BSON类型名称作为 $type 操作符的参数，我们还可以使用类型序号。比如
> db.accounts.find( { _id: { $type: 2 } } )
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

```

#### 数组操作符

```shell
# 筛选文档
# 数组操作符

$all        匹配数组字段中包含所有查询值的文档
$elemMatch  匹配数组字段中至少存在一个值满足筛选条件的文档


$all 语法:
{ <field>: { $all: [ <value1>, <value2>, ... ] } }

# 首先，为了练习这个操作符，我们先创建一些包含数组和嵌套数组的文档
> db.accounts.insert([
    {
        name: "jack",
        balance: 2000,
        contact: [ "11111111", "Alabama", "US" ]
    },
    {
        name: "karen",
        balance: 2500,
        contact: [ [ "22222222", "33333333" ], "Beijing", "China" ]
    }
])
BulkWriteResult({
	"writeErrors" : [ ],
	"writeConcernErrors" : [ ],
	"nInserted" : 2,
	"nUpserted" : 0,
	"nMatched" : 0,
	"nModified" : 0,
	"nRemoved" : 0,
	"upserted" : [ ]
})

# 读取联系地址位于中国北京的银行账户文档
> db.accounts.find( { contact: { $all: [ "China", "Beijing" ] } } )
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen", "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }

# 读取联系电话包含 22222222 和 33333333 的银行账户文档
> db.accounts.find( { contact: { $all: [ ["22222222","33333333"] ] } } )
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen", "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }

> db.accounts.find( { contact: { $all: [ ["33333333","22222222"] ] } } )
不匹配任何文档


$elemMatch 语法:
{ <field>: { $elemMatch: { <query1>, <query2>, ... } } }

# 读取联系电话范围在 10000000 至 20000000 之间的银行账户文档
> db.accounts.find( { contact: { $elemMatch: { $gt: "10000000", $lt: "20000000" } } } )
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90d"), "name" : "jack", "balance" : 2000, "contact" : [ "11111111", "Alabama", "US" ] }

# 读取包含一个在 10000000 至 20000000 之间，和一个在 20000000 至 30000000 之间的联系电话的银行账户文档
> db.accounts.find( {
    contact: { $all: [
        { $elemMatch: { $gt: "10000000", $lt: "20000000" } },
        { $elemMatch: { $gt: "20000000", $lt: "30000000" } }
    ] }
} )
```

#### 运算操作符

```shell
# 筛选文档
# 运算操作符

$regex      匹配满足正则表达式的文档

语法:
{ <field>: { $regex: /pattern/, $options: "<options>" } }  # 大部分场景使用该语法
{ <field>: /pattern/<options> }        # 特定场景使用该语法

兼容 PCRE v8.41 正则表达式库
在与 $in 操作符配合使用时，只能使用 /pattern/<options> 语法

# 读取用户姓名以 c 或者 j 开头的银行账户文档
> db.accounts.find( { name: { $in: [ /^c/, /^j/ ] } } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90d"), "name" : "jack", "balance" : 2000, "contact" : [ "11111111", "Alabama", "US" ] }

# 读取用户姓名包含 LIE (不区分大小写)的银行账户文档
> db.accounts.find( { name: { $regex: /LIE/, $options: 'i' } } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }

> db.accounts.find( { name: /LIE/i } )
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
```

### 文档游标

`db.collection.find()` 返回的是一个文档集合游标

在**不迭代**游标的情况下，只列出前20个文档:
```js
> var myCursor = db.accounts.find();
> myCursor
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90d"), "name" : "jack", "balance" : 2000, "contact" : [ "11111111", "Alabama", "US" ] }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen", "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }
// 这里由于我们的文档总数不足20，所以看不出效果
```

我们也可以使用游标下标直接访问文档集合中的某一个文档，**下标从0开始**:
```js
> var myCursor = db.accounts.find();
> myCursor[1]
{
	"_id" : ObjectId("5ce00c9672e77e7cb392a8fd"),
	"name" : "bob",
	"balance" : 50
}
```

默认情况下，遍历完游标中所有的文档之后，或者在10分钟之后，游标便会自动关闭

我们可以使用 `noCursorTimeout()` 函数来保持游标一直有效
```js
> var myCursor = db.accounts.find().noCursorTimeout();
```
在这之后，如果我们遍历完了游标，游标会自动关闭。但是如果在不遍历游标的情况下，需要主动关闭游标
```js
> myCursor.close();
```


### 游标函数

```js
cursor.hasNext()
cursor.next()
cursor.forEach()
cursor.limit()
cursor.skip()
cursor.count()
cursor.sort()
```


#### hasNext 和 next 函数

> hasNext 和 next 用于遍历游标
```js
> var myCursor = db.accounts.find({ balance: 100 });
> while( myCursor.hasNext() ) {
    printjson(myCursor.next());
}
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{
	"_id" : ObjectId("5ce0f15c72e77e7cb392a90c"),
	"name" : "champ",
	"balance" : 100
}
{
	"_id" : {
		"type" : "savings",
		"accountId" : "002"
	},
	"name" : "tom",
	"balance" : 100
}
```


#### forEach 函数

```js
> var myCursor = db.accounts.find({ balance: 100 });
> myCursor.forEach(printjson);
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{
	"_id" : ObjectId("5ce0f15c72e77e7cb392a90c"),
	"name" : "champ",
	"balance" : 100
}
{
	"_id" : {
		"type" : "savings",
		"accountId" : "002"
	},
	"name" : "tom",
	"balance" : 100
}
```


#### limit 和 skip 函数

> 这两个函数通常用于分页
```js
cursor.limit(<number>)
cursor.skip(<offset>)
> db.accounts.find({ balance: 100 }).limit(1)
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

> db.accounts.find({ balance: 100 }).skip(1)
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
```

> 问题: <br>
> 如果使用 `cursor.limit(0)` 会返回什么结果呢？<br>
> <br>
> 答案: <br>
```js
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
```
> 不对游标进行任何限制，与 `limit()` 以及不进行调用效果相同。<br>
> 也就是说，默认返回前20个文档？


#### count 函数

```js
cursor.count(<applySkipLimit>)
```
默认情况下，`<applySkipLimit>` 为 `false`，即 `cursor.count()` 不会考虑 `cursor.skip()` 和 `cursor.limit()` 的效果
```js
> db.accounts.find({ balance: 100 })
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }

> db.accounts.find({ balance: 100 }).limit(1).count()
3

> db.accounts.find({ balance: 100 }).limit(1).count(true)
1
```

```shell
# 在不提供筛选条件时，cursor.count() 会从集合的元数据 Metadata 中取得结果，而不会遍历集合
> db.accounts.find().count()
22
> db.accounts.count()
22

# 当数据库分布式结构较为复杂时，元数据中的文档数量可能不准确
# 在这种情况下，应该避免使用不提供筛选条件的 cursor.count() 函数，而使用聚合管道来计算文档数量
```


#### sort 函数

```js
cursor.sort(<document>)
```
这里的 `<document>` 定义了排序的要求，`{ field: ordering}`
```shell
1表示递增排序
-1表示递减排序

# 按照余额从大到小，用户姓名按字母排序的方式排列银行账户文档
> db.accounts.find().sort( { balance: -1, name: 1 } )
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen", "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90d"), "name" : "jack", "balance" : 2000, "contact" : [ "11111111", "Alabama", "US" ] }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie", "balance" : 500 }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom", "balance" : 500 }
{ "_id" : ObjectId("5ce1225972e77e7cb392a90f"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1225b72e77e7cb392a910"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1225c72e77e7cb392a911"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1225d72e77e7cb392a912"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1225d72e77e7cb392a913"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1225e72e77e7cb392a914"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1226b72e77e7cb392a915"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1226b72e77e7cb392a916"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1226c72e77e7cb392a917"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce1226d72e77e7cb392a918"), "name" : "champ", "balance" : 200 }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
{ "_id" : "account1", "name" : "alice", "balance" : 100 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom", "balance" : 100 }
Type "it" for more
> it
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }

# 读取余额最大的银行账户文档
> db.accounts.find().sort({ balance: -1 }).limit(1)
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen", "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }

```

> 注意: <br>
> `cursor.skip()`, `cursor.limit()`, `cursor.sort()`的执行顺序<br>
> <br>
> 原则一: `cursor.skip()`永远在`cursor.limit()`之前执行<br>
```js
> db.accounts.find().limit(5).skip(3)
```
> 从书写顺序看，是先执行了`limit(5)`拿到5条数据，然后执行`skip(3)`跳过3条数据，结果就剩2条数据了。<br>
> 但是执行结果如下<br>
```js
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george", "balance" : 1000 }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ", "balance" : 100 }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john", "balance" : 200 }
```
> 实际执行顺序是，`find()`拿到所有文档数量，`skip(3)`跳过前3条，然后`limit(5)`取出接下来的5条数据<br>
> <br>
> 原则二: `cursor.sort()`永远在`cursor.skip()`和`cursor.limit()`之前执行<br>
```js
> db.accounts.find().skip(3).limit(5).sort({ balance: -1 })
```
> 先执行`sort({ balance: -1 })`按照余额降序排序，然后执行`skip(3)`跳过前3条，最后执行`limit(5)`取出接下来的5条数据<br>
> 与 `db.accounts.find().limit(5).skip(3).sort({ balance: -1 })`的结果相同，不管书写顺序如何，执行顺序永远是:<br>
> `sort()` > `skip()` > `limit()`<br>


### 文档投射

```js
db.collection.find(<query>, <projection>)
```
不使用投射时，`db.collection.find()`返回符合筛选条件的完整文档，而使用投射可以有选择性的返回文档中的部分字段
```shell
projection: { field: inclusion }
1 表示返回该字段
0 表示不返回该字段

# 只返回银行账户文档中的用户姓名
> db.accounts.find({}, { name: 1 })
{ "_id" : "account1", "name" : "alice" }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob" }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie" }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david" }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred" }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george" }

# 只返回银行账户文档中的用户姓名(不包含文档主键)
> db.accounts.find({}, { name: 1, _id: 0 })
{ "name" : "alice" }
{ "name" : "bob" }
{ "name" : "charlie" }
{ "name" : "david" }
{ "name" : "fred" }
{ "name" : "george" }

# 不返回银行账户文档中的用户姓名(也不返回文档主键)
> db.accounts.find({}, { name: 0, _id: 0 })
{ "balance" : 100 }
{ "balance" : 200 }
{ "balance" : 100 }
{ "balance" : 500 }
{ "balance" : 2000, "contact" : [ "11111111", "Alabama", "US" ] }
{ "balance" : 2500, "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }
```

> 注意: <br>
> `projection`参数不能混用包含与不包含这两种投射操作，文档主键除外<br>
```js
> db.accounts.find({}, { name: 1, balance: 0, _id: 0 })
Error: error: {
	"ok" : 0,
	"errmsg" : "Projection cannot have a mix of inclusion and exclusion.",
	"code" : 2,
	"codeName" : "BadValue"
}
```

#### 在数组字段上使用投射

`$slice`操作符可以返回数组字段中的部分元素

```shell
# 不使用 slice 操作符
> db.accounts.find({}, { _id: 0, name: 1, contact: 1 })
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "11111111", "Alabama", "US" ] }
{ "name" : "karen", "contact" : [ [ "22222222", "33333333" ], "Beijing", "China" ] }

# 返回 contact 字段的第一个元素
> db.accounts.find({}, { _id: 0, name: 1, contact: { $slice: 1 } })
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "11111111" ] }
{ "name" : "karen", "contact" : [ [ "22222222", "33333333" ] ] }

# 返回 contact 字段最后一个元素
> db.accounts.find({}, { _id: 0, name: 1, contact: { $slice: -1 } })
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "US" ] }
{ "name" : "karen", "contact" : [ "China" ] }

# 返回 contact 字段的最后两个元素
> db.accounts.find({}, { _id: 0, name: 1, contact: { $slice: -2 } })
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "Alabama", "US" ] }
{ "name" : "karen", "contact" : [ "Beijing", "China" ] }

# 对 contact 字段先执行一个 skip(1) 操作，然后执行 limit(2) 操作
> db.accounts.find({}, { _id: 0, name: 1, contact: { $slice: [1, 2] } })
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "Alabama", "US" ] }
{ "name" : "karen", "contact" : [ "Beijing", "China" ] }
```

`$elemMatch`和`$`操作符可以返回数组字段中，满足筛选条件的第一个元素

```shell
# 返回 contact 中大于 Alabama 的第一个元素
> db.accounts.find({}, {
    _id: 0,
    name: 1,
    contact: { $elemMatch: { $gt: "Alabama" } }
})
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "jack", "contact" : [ "US" ] }
{ "name" : "karen", "contact" : [ "Beijing" ] }

# 使用<query>参数中 contact 的筛选条件作为 projection 中 contact 的投射操作
# 是上面 $elemMatch 的简写形式
> db.accounts.find({
    contact: { $gt: "Alabama" }
}, {
    _id: 0,
    name: 1,
    "contact.$": 1  # contact: { $elemMatch: { $gt: "Alabama" } } 的简写形式？
})
```

> ？疑问<br>
```js
> db.accounts.find({ contact: { $gt: "Alabama" } })
```
> 是查询出`contact`字段大于字符串`Alabama`的文档，但是`contact`是数组类型，数组是如何与字符串进行比较操作的？


## 更新文档

```shell
语法: db.<collection>.update(<query>, <update>, <options>)

# <query> 文档定义了更新文档时筛选文档的条件，也就是说，要更新哪些文档
# 与 db.collection.find() 中的 query 相同

# <update> 文档提供了更新的内容，也就是说，要进行什么样的更新

# <options> 文档声明了一些应用于更新操作的选项和参数
```

### 更新整篇文档

```shell
# 如果 <update> 文档不包含任何更新操作符，则会更新整个文档。
# 执行的是替换操作

# 检查 alice 的银行账户文档
> db.accounts.find({ name: "alice" })
{ "_id" : "account1", "name" : "alice", "balance" : 100 }

# 将 alice 的账户余额更改为123
> db.accounts.update({ name: "alice" }, { name: "alice", balance: 123 })
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 检查 alice 的银行账户文档
> db.accounts.find({ name: "alice" })
{ "_id" : "account1", "name" : "alice", "balance" : 123 }
```

> 注意: <br>
> <br>
> 第一，文档主键 `_id` **在任何情况下**都是不可以更改的<br>
> 如果我们在 `<update>`文档中包含`_id`字段，则`_id`值一定要和被更新文档的`_id`值保持一致<br>
```js
> db.accounts.update({ name: "alice" }, { _id: "account1", name: "alice", balance: 100 })
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
```
> 如果`<update>`文档中包含的`_id`字段和被更新的文档`_id`值不一致，则会更新失败<br>
```js
> db.accounts.update({ name: "alice" }, { _id: "account2", name: "alice", balance: 123 })
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 66,
		"errmsg" : "After applying the update, the (immutable) field '_id' was found to have been altered to _id: \"account2\""
	}
})
```
> 第二，在使用`<update>`文档替换整篇被更新文档时，只有**第一篇**符合`<query>`筛选条件的文档才会被更新
```shell
# 查看账户余额在0到100之间的账户文档
> db.accounts.find({ balance: { $gt: 0, $lt: 100 } })
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bob", "balance" : 50 }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }

# 更新账户余额在0到100之间的账户文档
> db.accounts.update({ balance: { $gt: 0, $lt: 100 } }, { name: "bill", balance: 80, gender: "M" } )
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看账户余额在0到100之间的账户文档
> db.accounts.find({ balance: { $gt: 0, $lt: 100 } })
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bill", "balance" : 80, "gender" : "M" }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred", "balance" : 20 }
```
> 也就是说，更新整篇文档的操作，只能应用在单一文档上

### 更新特定字段

如果`<update>`文档只包含更新操作符，`db.collection.update()`将会使用`<update>`文档更新集合中符合`<query>`筛选条件的所有文档中的特定字段

```shell
# 文档更新操作符

$set        更新或新增字段
$unset      删除字段
$rename     重命名字段
$inc        加减字段值
$mul        相乘字段值
$min        比较减小字段值
$max        比较增大字段值
```

#### $set操作符

更新或新增字段

```shell
语法:
{ $set: { <field1>: <value1>, <field2>: <value2>, ... } }

# 查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 2000,
	"contact" : [
		"11111111",
		"Alabama",
		"US"
	]
}

# 更新 jack 的银行账户余额和开户信息
> db.accounts.update(
    { name: "jack" },
    {
        $set: {
            balance: 3000,
            info: {
                dateOpened: new Date("2019-05-18T16:00:00Z"),
                branch: "branch1"
            }
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 3000,
	"contact" : [
		"11111111",
		"Alabama",
		"US"
	],
	"info" : {
		"dateOpened" : ISODate("2019-05-18T16:00:00Z"),
		"branch" : "branch1"
	}
}


## 更新或新增内嵌文档的字段

# 更新 jack 的银行账户的开户时间
> db.accounts.update(
    { name: "jack" },
    {
        $set: {
            "info.dateOpened": new Date("2017-01-01T16:00:00Z")
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 3000,
	"contact" : [
		"11111111",
		"Alabama",
		"US"
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"branch" : "branch1"
	}
}


## 更新或新增数组内的元素

# 更新 jack 的联系电话
> db.accounts.update(
    { name: "jack" },
    {
        $set: {
            "contact.0": "66666666"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 3000,
	"contact" : [
		"66666666",
		"Alabama",
		"US"
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"branch" : "branch1"
	}
}

# 添加 jack 的联系方式
> db.accounts.update(
    { name: "jack" },
    {
        $set: {
            "contact.3": "new contact"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 3000,
	"contact" : [
		"66666666",
		"Alabama",
		"US",
		"new contact"
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"branch" : "branch1"
	}
}

# 数组索引可以随便设置
> db.accounts.update(
    { name: "jack" },
    {
        $set: {
            "contact.10": "new contact 10"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"balance" : 3000,
	"contact" : [
		"66666666",
		"Alabama",
		"US",
		"new contact",
		null,
		null,
		null,
		null,
		null,
		null,
		"new contact10"
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"branch" : "branch1"
	}
}
```

> 注意: <br>
> 如果向现有数组字段范围以外的位置添加新值，数组字段的长度会扩大，未被赋值的数组成员将被设置为`null`

#### $unset 操作符

删除字段

```shell
语法:
{ $unset: { <field1>: "", <field2>: "", ... } }

# 删除 jack 的银行账户余额和开户地点
> db.accounts.update(
    { name: "jack" },
    {
        $unset: {
            balance: "",
            "info.branch": ""
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"contact" : [
		"66666666",
		"Alabama",
		"US",
		"new contact2",
		null,
		null,
		null,
		null,
		null,
		null,
		"new contact10"
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z")
	}
}


## 删除数组内的字段

# 删除 jack 的联系电话
> db.accounts.update(
    { name: "jack" },
    {
        $unset: {
            "contact.0": ""
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"contact" : [
		null,
		"Alabama",
		"US",
		"new contact2",
		null,
		null,
		null,
		null,
		null,
		null,
		"new contact10"
	],
	"info" : {

	}
}
```

> 注意: <br>
> `$unset`操作符中的赋值(`""`)对操作结果并没有任何影响
```shell
# 删除 jack 的银行开户时间
> db.accounts.update(
    { name: "jack" },
    {
        $unset: {
            "info.dateOpened": "this can be any value"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 再次查看 jack 的银行账户文档
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"name" : "jack",
	"contact" : [
		"66666666",
		"Alabama",
		"US",
		"new contact2",
		null,
		null,
		null,
		null,
		null,
		null,
		"new contact10"
	],
	"info" : {

	}
}
```
> 如果`$unset`命令中的字段根本不存在，那么文档内容将保持不变<br>
```shell
> db.accounts.update(
    { name: "jack" },
    {
        $unset: {
            notExist: ""
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
```
> 当使用`$unset`命令删除数组字段中的某一个元素时，这个元素不会被删除，只会被赋以`null`值，而数组的长度不会改变

#### $rename 操作符

重命名字段

```shell
语法:
{ $rename: { <field1>: <newName1>, <field2>: <newName2>, ... } }

## 重命名内嵌文档的字段

# 更新 karen 的银行账户的开户时间和联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $set: {
            info: {
                dateOpened: new Date("2017-01-01T16:00:00Z"),
                branch: "branch1"
            },
            "contact.3": {
                primaryEmail: "xxx@gmail.com",
                secondaryEmail: "yyy@gmail.com"
            }
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find({ name: "karen" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90e"),
	"name" : "karen",
	"balance" : 2500,
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		}
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"branch" : "branch1"
	}
}

# 更新账户余额和开户地点字段在文档中的位置
> db.accounts.update(
    { name: "karen" },
    {
        $rename: {
            "info.branch": "branch",
            "balance": "info.balance"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find({ name: "karen" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90e"),
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		}
	],
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"balance" : 2500
	},
	"branch" : "branch1"
}


## 重命名数组中内嵌文档的字段

# 更新 karen 的联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $rename: {
            "contact.3.primaryEmail": "primaryEmail"
        }
    }
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 2,
		"errmsg" : "The source field cannot be an array element, 'contact.3.primaryEmail' in doc with _id: ObjectId('5ce1107d72e77e7cb392a90e') has an array field called 'contact'"
	}
})

# 反向操作
> db.accounts.update(
    { name: "karen" },
    {
        $rename: {
            "branch": "contact.3.branch"
        }
    }
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 2,
		"errmsg" : "The destination field cannot be an array element, 'contact.3.branch' in doc with _id: ObjectId('5ce1107d72e77e7cb392a90e') has an array field called 'contact'"
	}
})
```

> 注意: <br>
> 如果`$rename`命令要重命名的字段在文档中并不存在，那么文档内容不会发生任何改变
```shell
> db.accounts.update(
    { name: "jack" },
    {
        $rename: {
            notExist: "name"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
```
> 如果新的字段名已经存在，那么原有的这个字段会被覆盖
```shell
> db.accounts.update(
    { name: "jack" },
    {
        $rename: {
            name: "contact"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
> db.accounts.find({ name: "jack" }).pretty()
{
	"_id" : ObjectId("5ce1107d72e77e7cb392a90d"),
	"contact" : "jack",
	"info" : {

	}
        # 原来的 contact 内容不见了!!!
}
```
> 当`$rename`命令中的新字段存在的时候，`$rename`命令会先`$unset`新旧字段，然后再`$set`新字段<br>
> <br>
> `$rename`命令中的旧字段和新字段都不可以指向数组元素<br>

#### $inc 和 $mul 操作符

更新字段值

```shell
语法:
{ $inc: { <field1>: <amount1>, ... } }
{ $mul: { <field1>: <amount1>, ... } }

# 查看 david 的银行账户文档
> db.accounts.find({ name: "david" })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 200 }

# 更新 david 的账户余额
> db.accounts.update(
    { name: "david" },
    {
        $inc: {
            balance: -0.5
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 david 的银行账户文档
> db.accounts.find({ name: "david" })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 199.5 }

# 更新 david 的账户余额
> db.accounts.update(
    { name: "david" },
    {
        $mul: {
            balance: 0.5
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 david 的银行账户文档
> db.accounts.find({ name: "david" })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 99.75 }
```

> 注意: <br>
> `$inc`和`$mul`命令只能应用在数字字段上
```shell
> db.accounts.update(
    { name: "david" },
    {
        $inc: {
            name: -0.5
        }
    }
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 14,
		"errmsg" : "Cannot apply $inc to a value of non-numeric type. {_id: ObjectId('5ce00d5972e77e7cb392a8ff')} has the field 'name' of non-numeric type string"
	}
})
```
> 如果被`$inc`或`$mul`更新的字段不存在。。。
```shell
> db.accounts.update(
    { name: "david" },
    {
        $inc: {
            notYetExist: 10
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

> db.accounts.find({ name: "david" })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 99.75, "notYetExist" : 10 }

> db.accounts.update(
    { name: "david" },
    {
        $mul: {
            notYetExistEither: 20
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

> db.accounts.find({ name: "david" })
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david", "balance" : 99.75, "notYetExist" : 10, "notYetExistEither" : 0 }
```

#### $min 和 $max 操作符

比较之后更新字段值

```shell
语法: 
{ $min: { <field1>: <value1>, ... } }
{ $max: { <field1>: <value1>, ... } }

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, info: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"balance" : 2500
	}
}

# 更新 karen 的账户余额
# 比较 info.balance 字段原本的字段值与5000的大小，把这两者中较小的保留，作为 info.balance 字段的值
> db.accounts.update(
    { name: "karen" },
    {
        $min: {
            "info.balance": 5000
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })

# 更新 karen 的账户余额
# 比较 info.balance 字段原本的字段值与5000的大小，把这两者中较大的保留，作为 info.balance 字段的值
> db.accounts.update(
    { name: "karen" },
    {
        $max: {
            "info.balance": 5000
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, info: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"info" : {
		"dateOpened" : ISODate("2017-01-01T16:00:00Z"),
		"balance" : 5000
	}
}

# 更新 karen 的开户时间
> db.accounts.update(
    { name: "karen" },
    {
        $min: {
            "info.dateOpened": new Date("2013-10-01T16:00:00Z")
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, info: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"info" : {
		"dateOpened" : ISODate("2013-10-01T16:00:00Z"),
		"balance" : 5000
	}
}
```

> 注意: <br>
> 如果被更新的字段不存在。。。
```shell
> db.accounts.update(
    { name: "karen" },
    {
        $min: {
            notYetExist: 10
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 kaven 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, info: 1, notYetExist: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"info" : {
		"dateOpened" : ISODate("2013-10-01T16:00:00Z"),
		"balance" : 5000
	},
	"notYetExist" : 10
}
```
> 如果被更新的字段不存在，`$min`和`$max`命令会创建字段，并且将字段值设置为命令中的更新值<br>
> <br>
> 如果被更新的字段类型和更新值类型不一致。。。
```shell
> db.accounts.update(
    { name: "karen" },
    {
        $min: {
            "info.balance": null
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, info: 1, notYetExist: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"info" : {
		"dateOpened" : ISODate("2013-10-01T16:00:00Z"),
		"balance" : null
	},
	"notYetExist" : 10
}
```
> 如果被更新的字段类型和更新值类型不一致，`$min`和`$max`命令会按照`BSON`数据类型排序规则进行比较<br>
```js
(最小)
Null
Numbers (ints, longs, doubles, decimals)
Symbol, String
Object
Array
BinData
ObjectId
Boolean
Date
Timestamp
Regular Expression
(最大)
```

### 数组更新操作符

```shell
$addToSet   向数组中增添元素
$pop        从数组中移除元素
$pull       从数组中有选择性地移除元素
$pullAll    从数组中有选择性地移除元素
$push       向数组中增添元素
```

#### $addToSet 操作符

向数组字段中添加元素

```shell
语法:
{ $addToSet: { <field1>: <value1>, ... } }

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		}
	]
}

# 向 karen 的账户文档中添加联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $addToSet: {
            contact: "China"
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
```

> 注意: <br>
> 如果要插入的值已经存在数组字段中，则`$addToSet`不会再添加重复值<br>
> 注意一下，使用`$addToSet`插入数组和文档时，插入值中的字段顺序也和已有值重复的时候，才被算作重复值被忽略<br>

```shell
# 向 karen 的账户文档中添加新的联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $addToSet: {
            contact: {
                "secondaryEmail": "yyy@gmail.com",
                "primaryEmail": "xxx@gmail.com"
            }
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		}
	]
}

## 向数组字段中添加多个值

# 向 karen 的账户文档中添加多个联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $addToSet: {
            contact: [ "contact1", "contact2" ]
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[
			"contact1",
			"contact2"
		]
	]
}

#由此可见，默认情况下，$addToSet 会将数组插入被更新的数组字段中，成为内嵌数组
#如果想要将多个元素直接添加到数组字段中，则需要使用 $each 操作符

# 向 karen 的账户文档中添加多个联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $addToSet: {
            contact: {
                $each: [ "contact1", "contact2" ]
            }
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[
			"contact1",
			"contact2"
		],
		"contact1",
		"contact2"
	]
}
```

#### $pop 操作符

从数组字段中删除元素(只能删除数组中第一个或者最后一个元素)

```shell
语法:
{ $pop: { <field>: <-1 | 1>, ... } }

# 从 karen 的账户文档中删除最后一个联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $pop: {
            contact: 1
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[
			"contact1",
			"contact2"
		],
		"contact1"
	]
}

# 从 karen 的账户文档中删除第一个联系方式
> db.accounts.update(
    { name: "karen" },
    {
        $pop: {
            "contact.5": -1
        }
    }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[
			"contact2"
		],
		"contact1"
	]
}

# 继续从 karen 的账户文档中删除联系方式
> db.accounts.update(
	{ name: "karen" },
	{
		$pop: {
			"contact.5": -1
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
    { name: "karen" },
    { name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "karen",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	]
}
```

> 注意: <br>
> 删除掉数组中最后一个元素后，会留下空数组<br>
> <br>
> `$pop`操作符只能应用在数组字段上<br>
```shell
> db.accounts.update(
	{ name: "karen" },
	{
		$pop: {
			"contact.1": -1
		}
	}
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 0,
	"nModified" : 0,
	"writeError" : {
		"code" : 14,
		"errmsg" : "Path 'contact.1' contains an element of non-array type 'string'"
	}
})
```

#### $pull 操作符

从数组字段中删除特定元素(灵活性比`$pop`强)

```shell
语法:
{ $pull: { <field1>: <value | condition>, ... } }

# 为了演示方便，首先将 karen 的账户文档复制成为一篇新文档，并且把新文档的用户姓名设置为 lawrence
> db.accounts.find(
	{ name: "karen" },
	{ _id: 0 }
).forEach(doc => {
	var newDoc = doc;
	newDoc.name = "lawrence";
	db.accounts.insert(newDoc);
})

# 查看 lawrence 的银行账户文档
> db.accounts.find( { name: "lawrence" } ).pretty()
{
	"_id" : ObjectId("5ce188c687c9a4c5934a9550"),
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	],
	"info" : {
		"dateOpened" : ISODate("2013-10-01T16:00:00Z"),
		"balance" : null
	},
	"branch" : "branch1",
	"notYetExist" : 10
}

# 从 karen 的联系方式中删除包含 'hi' 字母的元素
# 想一想，既然是针对数组元素的筛选条件，是否需要使用 $elemMatch 操作符呢？

> db.accounts.update(
	{ name: "karen" },
	{
		$pull: {
			contact: {
				$elemMatch: { $regex: /hi/ }
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })

# 事实上，既然 $pull 操作符本身是只能作用在数组元素上的，我们便不需要再额外使用 $elemMatch 操作符了
> db.accounts.update(
	{ name: "karen" },
	{
		$pull: {
			contact: { $regex: /hi/ }
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
	{ name: "karen" },
	{ contact: 1, _id: 0 }
).pretty()
{
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	]
}

# 当然，如果有数组元素本身就是一个内嵌数组，我们也可以使用 $elemMatch 来对这些内嵌数组进行筛选

# 从 karen 的联系方式中删除电话号码 22222222
> db.accounts.update(
	{ name: "karen" },
	{
		$pull: {
			contact: { $elemMatch: { $eq: "22222222" }}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 karen 的银行账户文档
> db.accounts.find(
	{ name: "karen" },
	{ contact: 1, _id: 0 }
).pretty()
{
	"contact" : [
		"Beijing",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	]
}
# 这里需要说明一下，虽然 $elemMatch 匹配的是内嵌数组中的元素，但是 $pull 的删除操作是针对 contact 的顶级元素进行的，所以会把符合内嵌数组中的筛选条件的元素所在的顶级元素整个删除掉。
# 因此，33333333没有出现在查询结果中
```

#### $pullAll 操作符

从数组字段中删除特定元素

```shell
{ $pull: { <field1>: <value>, ... } }
{ $pullAll: { <field1>: [ <value1>, <value2>, ... ] } }

{ $pullAll: { <field1>: [ <value1>, <value2>, ... ] } }
相当于
{ $pull: { <field1>: { $in: [ <value1>, <value2>, ... ] } } }

## 如果要删除的元素是一个内嵌数组，则数组元素的值和排列顺序都必须和被删除的数组完全一样

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	]
}

# 删除第一个联系方式
> db.accounts.update(
	{ name: "lawrence" },
	{
		$pullAll: {
			contact: [ ["33333333", "22222222"] ]
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
# 因为排列顺序不一样，所以没有被删除

## 如果要删除的元素是一个内嵌文档
$pullAll 命令只会删除字段和字段排列顺序都完全匹配的文档元素

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		{
			"secondaryEmail" : "yyy@gmail.com",
			"primaryEmail" : "xxx@gmail.com"
		},
		[ ],
		"contact1"
	]
}

> db.accounts.update(
	{ name: "lawrence" },
	{
		$pullAll: {
			contact: [ {"primaryEmail":"xxx@gmail.com"} ]
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
# 因为提供给 $pullAll 的文档和源文档并没有完全匹配，所以没有删除

> db.accounts.update(
	{ name: "lawrence" },
	{
		$pullAll: {
			contact: [ 
				{ "secondaryEmail": "yyy@gmail.com", "primaryEmail": "xxx@gmail.com" },
			]
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
# 只会删除第二个内嵌文档

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		{
			"primaryEmail" : "xxx@gmail.com",
			"secondaryEmail" : "yyy@gmail.com"
		},
		[ ],
		"contact1"
	]
}

# 但是，$pull 命令会删除包含指定的文档字段和字段值的文档元素，字段排列顺序不需要完全匹配。
# 这一点和 $pullAll 不太一样

> db.accounts.update(
	{ name: "lawrence" },
	{
		$pull: {
			contact: {
				"primaryEmail": "xxx@gmail.com"
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
# $pull 在删除内嵌文档的时候，允许部分匹配，他的模糊程度更高

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		[ ],
		"contact1"
	]
}

# 将刚才删除的文档元素再添加到 contact 数组中去
> db.accounts.update(
	{ name: "lawrence" },
	{
		$addToSet: {
			contact: {
				"primaryEmail": "xxx@gmail.com",
				"secondaryEmail": "yyy@gmail.com"
			}
		}
	}
)

> db.accounts.update(
	{ name: "lawrence" },
	{
		$pull: {
			contact: {
				"secondaryEmail": "yyy@gmail.com",
				"primaryEmail": "xxx@gmail.com"
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
# 可以看到，$pull 在删除内嵌文档时，对字段的排列顺序没有要求
```

#### $push 操作符

向数组字段中添加元素

`$push`和`$addToSet`命令相似，但是`$push`命令的功能更强大

```shell
语法:
{ $push: { <field1>: <value1>, ... } }

# 和 $addToSet 命令一样，如果 $push 命令中指定的数组字段不存在，则这个字段会被添加到原文档中
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: "new element"
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{ "name" : "lawrence", "newArray" : [ "new element" ] }

## 和 $addToSet 相似，$push 操作符也可以和 $each 搭配使用
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ 2, 3, 4 ]
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{ "name" : "lawrence", "newArray" : [ "new element", 2, 3, 4 ] }


## $push 和 $each 操作符还可以和更多的操作符搭配使用，实现比 $addToSet 更复杂的操作

## 使用 $position 操作符将元素插入到数组的指定位置
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ "pos1", "pos2" ],
				$position: 0
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"pos1",
		"pos2",
		"new element",
		2,
		3,
		4
	]
}

> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ "pos3", "pos4" ],
				$position: -1  #插入到最后一个元素的前面
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"pos1",
		"pos2",
		"new element",
		2,
		3,
		"pos3",
		"pos4",
		4
	]
}

## 使用 $sort 对数组进行排序
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ "sort1" ],
				$sort: 1  # 1升序 -1降序
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		2,
		3,
		4,
		"new element",
		"pos1",
		"pos2",
		"pos3",
		"pos4",
		"sort1"
	]
}

# 如果插入的元素是一个内嵌文档，也可以根据内嵌文档的字段值进行排序
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ { key: "sort", value: 100 }, { key: "sort", value: 200 } ],
				$sort: { value: -1 }  # 1升序 -1降序
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		{
			"key" : "sort",
			"value" : 200
		},
		{
			"key" : "sort",
			"value" : 100
		},
		2,
		3,
		4,
		"new element",
		"pos1",
		"pos2",
		"pos3",
		"pos4",
		"sort1"
	]
}

# 如果不想插入元素，只想对文档中的数组字段进行排序。。。
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ ],
				$sort: -1
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		{
			"key" : "sort",
			"value" : 200
		},
		{
			"key" : "sort",
			"value" : 100
		},
		"sort1",
		"pos4",
		"pos3",
		"pos2",
		"pos1",
		"new element",
		4,
		3,
		2
	]
}


## 使用 $slice 来截取数组的一部分
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ "slice1" ],
				$slice: -8  #只保留最后8个元素，其他的都被删除掉
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"pos3",
		"pos2",
		"pos1",
		"new element",
		4,
		3,
		2,
		"slice1"
	]
}

# 如果不想插入元素，只想截取文档中的数组字段。。。
> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ ],
				$slice: 6
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"pos3",
		"pos2",
		"pos1",
		"new element",
		4,
		3
	]
}


## $position, $sort, $slice 可以一起使用
# 这三个操作符的执行顺序是:
# $position -> $sort -> $slice
# 写在命令中的操作符顺序并不重要，并不会影响命令的执行顺序

> db.accounts.update(
	{ name: "lawrence" },
	{
		$push: {
			newArray: {
				$each: [ "push1", "push2" ],
				$position: 2,
				$sort: -1,
				$slice: 5
			}
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"push2",
		"push1",
		"pos3",
		"pos2",
		"pos1"
	]
}
```

#### $占位操作符

更新数组中的特定元素

```shell
语法:
db.collection.update(
	{ <array>: <query selector> },
	{ <update operator>: { "<array>.$": value } }
)
$ 是数组中第一个符合筛选条件的数组元素的占位符
搭配更新操作符使用，可以对满足筛选条件的数组元素进行更新

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"push2",
		"push1",
		"pos3",
		"pos2",
		"pos1"
	]
}

> db.accounts.update(
	{ name: "lawrence", newArray: "pos2" },
	{
		$set: {
			"newArray.$": "updated"
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, newArray: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"newArray" : [
		"push2",
		"push1",
		"pos3",
		"updated",
		"pos1"
	]
}
```

更新数组中的所有元素

```shell
语法:
db.collection.update(
	{ <query> },
	{ <update operator>: { "<array>.$[]": value } }
)

$[] 指代数组字段中的所有元素
搭配更新操作符使用，可以对数组中所有的元素进行更新

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"22222222",
			"33333333"
		],
		"Beijing",
		"China",
		[ ],
		"contact1"
	]
}

> db.accounts.update(
	{ name: "lawrence" },
	{
		$set: {
			"contact.0.$[]": "88888888"
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看 lawrence 的银行账户文档
> db.accounts.find(
	{ name: "lawrence" },
	{ name: 1, contact: 1, _id: 0 }
).pretty()
{
	"name" : "lawrence",
	"contact" : [
		[
			"88888888",
			"88888888"
		],
		"Beijing",
		"China",
		[ ],
		"contact1"
	]
}
```

### update options

`db.<collection>.update(<query>, <update>, <options>)`

`<options>`参数提供了`update`命令的更多选项

#### multi 更新多个文档

```shell
语法:
{ multi: <boolean> }

在默认情况下，即使筛选条件对应了多篇文档，update命令仍然只会更新一篇文档

> db.accounts.update(
	{},
	{
		$set: {
			currency: "USD"
		}
	}
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, currency: 1, _id: 0 }
).pretty()
{ "name" : "alice", "currency" : "USD" }
{ "name" : "bill" }
{ "name" : "charlie" }
{ "name" : "david" }
{ "name" : "fred" }
{ "name" : "george" }
{ "name" : "champ" }
{ "name" : "john" }
{ "name" : "tom" }
{ "name" : "tom" }
{ }
{ "name" : "karen" }
{ "name" : "champ" }

# 使用 multi 选项来更新多个符合筛选条件的文档
> db.accounts.update(
	{},
	{
		$set: {
			currency: "USD"
		}
	},
	{ multi: true }
)
WriteResult({ "nMatched" : 24, "nUpserted" : 0, "nModified" : 23 })

# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, currency: 1, _id: 0 }
).pretty()
{ "name" : "alice", "currency" : "USD" }
{ "name" : "bill", "currency" : "USD" }
{ "name" : "charlie", "currency" : "USD" }
{ "name" : "david", "currency" : "USD" }
{ "name" : "fred", "currency" : "USD" }
{ "name" : "george", "currency" : "USD" }
{ "name" : "champ", "currency" : "USD" }
{ "name" : "john", "currency" : "USD" }
{ "name" : "tom", "currency" : "USD" }
{ "name" : "tom", "currency" : "USD" }
{ "currency" : "USD" }
{ "name" : "karen", "currency" : "USD" }
{ "name" : "champ", "currency" : "USD" }
```

> 注意: <br>
> <br>
> `MongoDB`只能保证**单个**文档操作的原子性，不能保证**多个**文档操作的原子性<br>
> 更新多个文档的操作虽然在单一线程中执行，但是线程在执行过程中可能会被挂起，以便其他线程也有机会对数据进行操作<br>
> 如果需要保证多个文档操作时的原子性，就需要使用`MongoDB 4.0`版本中引入的事物功能进行操作<br>

#### upsert 更新或创建文档

```shell
语法:
{ upsert: <boolean> }

在默认情况下，如果 update 命令中的筛选条件没有匹配任何文档，则不会进行任何操作
将 upsert 选项设置为 true, 如果 update 命令中的筛选条件没有匹配任何文档，则会创建新文档

# 查看 maggie 的银行账户文档
> db.accounts.find(
	{ name: "maggie" },
	{ name: 1, balance: 1, _id: 0 }
)
无输出，说明没有这个用户

> db.accounts.update(
	{ name: "maggie" },
	{
		$set: {
			balance: 700
		}
	},
	{ upsert: true }
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ce23eaf65fdd3b3b65b3810")
})

# 查看 maggie 的银行账户文档
> db.accounts.find(
	{ name: "maggie" },
	{ name: 1, balance: 1, _id: 0 }
)
{ "name" : "maggie", "balance" : 700 }

如果无法从筛选条件中推断出确定的字段值，新创建的文档将不会包含筛选条件涉及的字段

> db.accounts.update(
	{ balance: { $gt: 20000 } },
	{
		$set: {
			name: "nick"
		}
	},
	{ upsert: true }
)
WriteResult({
	"nMatched" : 0,
	"nUpserted" : 1,
	"nModified" : 0,
	"_id" : ObjectId("5ce2403b65fdd3b3b65b3869")
})

# 查看 nick 的银行账户文档
> db.accounts.find(
	{ name: "nick" },
	{ name: 1, balance: 1, _id: 0 }
)
{ "name" : "nick" }
# 👆这里没有包含 balance 字段
```

#### save

这个命令也可以用来更新文档

```shell
语法:
db.<collection>.save(<document>)
```
如果`document`文档中包含了`_id`字段，`save()`命令将会调用`db.collection.update()`命令(`upsert`选项被打开)

```shell
# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, _id: 1 }
)
{ "_id" : "account1", "name" : "alice" }
{ "_id" : ObjectId("5ce00c9672e77e7cb392a8fd"), "name" : "bill" }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8fe"), "name" : "charlie" }
{ "_id" : ObjectId("5ce00d5972e77e7cb392a8ff"), "name" : "david" }
{ "_id" : ObjectId("5ce00f5272e77e7cb392a901"), "name" : "fred" }
{ "_id" : ObjectId("5ce011fd72e77e7cb392a902"), "name" : "george" }
{ "_id" : ObjectId("5ce0f15c72e77e7cb392a90c"), "name" : "champ" }
{ "_id" : { "type" : "savings", "accountId" : "001" }, "name" : "john" }
{ "_id" : { "type" : "savings", "accountId" : "002" }, "name" : "tom" }
{ "_id" : { "type" : "alipay", "accountId" : "003" }, "name" : "tom" }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90d") }
{ "_id" : ObjectId("5ce1107d72e77e7cb392a90e"), "name" : "karen" }
{ "_id" : ObjectId("5ce1225972e77e7cb392a90f"), "name" : "champ" }

# _id已存在，更新已有文档
> db.accounts.save(
	{ _id: "account1", name: "alice", balance: 100 }
)
相当于执行
> db.accounts.update(
	{ _id: "account1" },
	{
		$set: {
			name: "alice",
			balance: 100
		}
	},
	{ upsert: true }
)
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

# 查看银行账户文档
> db.accounts.find({ name: "alice" })
{ "_id" : "account1", "name" : "alice", "balance" : 100 }


# _id不存在，创建新文档
> db.accounts.save(
	{ _id: "account2", name: "oliver", balance: 100 }
)
相当于执行
> db.accounts.update(
	{ _id: "account2" },
	{
		$set: {
			name: "oliver",
			balance: 100
		}
	},
	{ upsert: true }
)
WriteResult({ "nMatched" : 0, "nUpserted" : 1, "nModified" : 0, "_id" : "account2" })

# 查看银行账户文档
> db.accounts.find({ name: "oliver" })
{ "_id" : "account2", "name" : "oliver", "balance" : 100 }
```

## 删除文档

```shell
语法:
db.<collection>.remove(<query>, <options>)

# <query>文档定义了删除操作时筛选文档的条件
# 这里的<query>文档与 db.collection.find() 中的 <query> 文档是相同的

# <options>文档声明了一些删除操作的选项


# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, balance: 1, _id: 0 }
).sort({ balance: 1 })
{  }
{ "name" : "karen" }
{  }
{ "name" : "lawrence" }
{ "name" : "nick" }
{ "name" : "fred", "balance" : 20 }
{ "name" : "bill", "balance" : 80 }
{ "name" : "david", "balance" : 99.75 }
{ "name" : "alice", "balance" : 100 }
{ "name" : "champ", "balance" : 100 }
{ "name" : "tom", "balance" : 100 }
{ "name" : "oliver", "balance" : 100 }
{ "name" : "john", "balance" : 200 }
{ "name" : "champ", "balance" : 200 }

# 删除余额为100的银行账户文档
> db.accounts.remove({ balance: 100 })
WriteResult({ "nRemoved" : 4 })

# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, balance: 1, _id: 0 }
).sort({ balance: 1 })
{  }
{ "name" : "karen" }
{  }
{ "name" : "lawrence" }
{ "name" : "nick" }
{ "name" : "fred", "balance" : 20 }
{ "name" : "bill", "balance" : 80 }
{ "name" : "david", "balance" : 99.75 }
{ "name" : "john", "balance" : 200 }
{ "name" : "champ", "balance" : 200 }


# 在默认情况下，remove 命令会删除所有符合筛选条件的文档
# 如果只想删除满足筛选条件的一篇文档，可以使用 justOne 选项

# 删除一篇余额小于100的银行账户文档
> db.accounts.remove(
	{ balance: { $lt: 100 } },
	{ justOne: true }
)
WriteResult({ "nRemoved" : 1 })

# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, balance: 1, _id: 0 }
).sort({ balance: 1 })
{  }
{ "name" : "karen" }
{  }
{ "name" : "lawrence" }
{ "name" : "nick" }
{ "name" : "fred", "balance" : 20 }
{ "name" : "david", "balance" : 99.75 }
{ "name" : "john", "balance" : 200 }
{ "name" : "champ", "balance" : 200 }

# 删除集合内的所有文档
> db.accounts.remove({})
WriteResult({ "nRemoved" : 22 })

# 查看银行账户文档
> db.accounts.find(
	{},
	{ name: 1, balance: 1, _id: 0 }
).sort({ balance: 1 })
无输出
```

## 删除集合

```shell
语法:
db.<collection>.drop( { writeConcern: <document> } )

这里的 writeConcern 文档定义了本次集合删除操作的安全写级别

# 之前的 remove 命令可以删除集合内的所有文档，但是不会删除集合
> show collections
accounts

# drop 命令可以删除整个集合，包括集合中的所有文档，以及集合的索引
> db.accounts.drop()
true

> show collections
无输出

# 如果集合中的文档数量很多，使用 remove 命令删除所有文档的效率不高
# 这种情况下，更加有效率的方法，是使用 drop 命令删除整个集合，然后再创建空集合并创建索引
```
