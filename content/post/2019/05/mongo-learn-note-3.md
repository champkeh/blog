+++
title = "MongoDB 学习笔记之索引"
date = 2019-05-20T19:40:10+08:00
description = ""
draft = true
tags = ["MongoDB"]
+++

> 合适的索引可以大大提升数据库的搜索性能<br>
> 加快文档查询和排序的速度<br>

![](/images/单键索引.png)

![](/images/复合键索引.png)

> 复合键索引只能支持前缀子查询<br>
> <br>
> 如果对三个字段建立了复合键索引 ( A,B,C )<br>
> 则这个索引只能用来加速 ( A ) 或 ( A,B ) 或 ( A,B,C )的查询，这些都是( A,B,C )的前缀，所以叫前缀子查询<br>
> 而不能用来加速 ( B )、( C )、( B,C )的查询<br>

### 索引操作

```shell
db.collection.getIndexes()
db.collection.createIndex()
db.collection.dropIndex()

# 创建一个新集合
> db.accountsWithIndex.insertMany([
    {
        name: "alice",
        balance: 50,
        currency: [ "GBP", "USD" ]
    },
    {
        name: "bob",
        balance: 20,
        currency: [ "AUD", "USD" ]
    },
    {
        name: "bob",
        balance: 300,
        currency: [ "CNY" ]
    }
])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce2b930391c2bc43445f619"),
		ObjectId("5ce2b930391c2bc43445f61a"),
		ObjectId("5ce2b930391c2bc43445f61b")
	]
}
```

#### 创建索引

```shell
语法:
db.<collection>.createIndex(<keys>, <options>)

## <keys>文档指定了创建索引的字段
## <options>文档定义了创建索引时可以使用的一些选项
## <options>文档也可以设定索引的特性


# 创建一个单键索引
> db.accountsWithIndex.createIndex({ name: 1 })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 1,
	"numIndexesAfter" : 2,
	"ok" : 1
}

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1  #排序方向
		},
		"name" : "name_1",
		"ns" : "test.accountsWithIndex"
	}
]

# 创建一个复合键索引
> db.accountsWithIndex.createIndex({ name: 1, balance: -1 })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 2,
	"numIndexesAfter" : 3,
	"ok" : 1
}

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1
		},
		"name" : "name_1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1,
			"balance" : -1
		},
		"name" : "name_1_balance_-1",
		"ns" : "test.accountsWithIndex"
	}
]

# 创建一个多键索引 (创建在数组字段上)
> db.accountsWithIndex.createIndex({ currency: 1 })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 3,
	"numIndexesAfter" : 4,
	"ok" : 1
}

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1
		},
		"name" : "name_1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1,
			"balance" : -1
		},
		"name" : "name_1_balance_-1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"currency" : 1
		},
		"name" : "currency_1",
		"ns" : "test.accountsWithIndex"
	}
]
# 因为多键索引是创建在数组字段上的，所以数组中的每一个元素，都会在多键索引中创建一个键
"AUD" --> {"bob"}
"CNY" --> {"bob"}
"GBP" --> {"alice"}
"USD" --> {"alice"}
"USD" --> {"bob"}
```

#### 列出索引

```shell
db.<collection>.getIndexes()

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1
		},
		"name" : "name_1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1,
			"balance" : -1
		},
		"name" : "name_1_balance_-1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"currency" : 1
		},
		"name" : "currency_1",
		"ns" : "test.accountsWithIndex"
	}
]
```

#### 删除索引

```shell
db.<collection>.dropIndex(index)

# 如果需要更改某些字段上已经创建的索引，
# 必须首先删除原有索引，再重新创建新索引，
# 否则，新索引不会包含原有文档

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1
		},
		"name" : "name_1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1,
			"balance" : -1
		},
		"name" : "name_1_balance_-1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"currency" : 1
		},
		"name" : "currency_1",
		"ns" : "test.accountsWithIndex"
	}
]

# 使用索引名称删除索引
> db.accountsWithIndex.dropIndex("name_1")
{ "nIndexesWas" : 4, "ok" : 1 }

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"name" : 1,
			"balance" : -1
		},
		"name" : "name_1_balance_-1",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"currency" : 1
		},
		"name" : "currency_1",
		"ns" : "test.accountsWithIndex"
	}
]

# 使用索引定义删除索引
> db.accountsWithIndex.dropIndex({ name: 1, balance: -1 })
{ "nIndexesWas" : 3, "ok" : 1 }

# 列出集合中已存在的索引
> db.accountsWithIndex.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "test.accountsWithIndex"
	},
	{
		"v" : 2,
		"key" : {
			"currency" : 1
		},
		"name" : "currency_1",
		"ns" : "test.accountsWithIndex"
	}
]
```


### 索引的特性

```shell
唯一性
稀疏性
生存时间
```

#### 唯一性

```shell
# 文档主键上创建的默认索引

# 手动创建一个具有唯一性的索引
> db.accountsWithIndex.createIndex({ balance: 1 }, { unique: true })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 2,
	"numIndexesAfter" : 3,
	"ok" : 1
}

# 如果已有文档中的某个字段已经出现了重复值，就不可以在这个字段上创建唯一性索引
> db.accountsWithIndex.createIndex({ name: 1 }, { unique: true })
{
	"ok" : 0,
	"errmsg" : "E11000 duplicate key error collection: test.accountsWithIndex index: name_1 dup key: { : \"bob\" }",
	"code" : 11000,
	"codeName" : "DuplicateKey"
}

# 如果新增的文档不包含唯一性索引字段，只有*第一篇*缺失该字段的文档可以被写入数据库，索引中该文档的键值被默认为null
> db.accountsWithIndex.insert({ name: "charlie", lastAccess: new Date() })
WriteResult({ "nInserted" : 1 })

> db.accountsWithIndex.insert({ name: "david", lastAccess: new Date() })
WriteResult({
	"nInserted" : 0,
	"writeError" : {
		"code" : 11000,
		"errmsg" : "E11000 duplicate key error collection: test.accountsWithIndex index: balance_1 dup key: { : null }"
	}
})

# 复合键索引也可以具有唯一性，在这种情况下，*不同的*文档之间，其所包含的复合键字段值的组合，不可以重复

# 为了接下来的演示，我们删除掉刚刚创建的唯一性索引
> db.accountsWithIndex.dropIndex("balance_1")
{ "nIndexesWas" : 3, "ok" : 1 }
```

#### 稀疏性

```shell
只将包含索引键字段的文档加入到索引中(即使索引键字段值为null)
也就是说，一个文档只有包含了索引键，才会把这个文档加入到索引中，而没有包含索引键的文档是不会被添加到索引中的。
好处是，可以大大节省索引所占用的存储空间。

# 创建一个具有稀疏性的索引
> db.accountsWithIndex.createIndex({ balance: 1 }, { sparse: true })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 2,
	"numIndexesAfter" : 3,
	"ok" : 1
}

# 如果同一个索引既具有唯一性，又具有稀疏性，就可以保存*多篇*缺失索引键值的文档了

# 先删除掉刚创建的只有稀疏性的索引
> db.accountsWithIndex.dropIndex("balance_1")
{ "nIndexesWas" : 3, "ok" : 1 }

> db.accountsWithIndex.createIndex({ balance: 1 }, { unique: true, sparse: true })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 2,
	"numIndexesAfter" : 3,
	"ok" : 1
}

> db.accountsWithIndex.insert({ name: "david", lastAccess: new Date() })
WriteResult({ "nInserted" : 1 })

# 复合键索引也可以具有稀疏性，在这种情况下，只有在缺失复合键所包含的所有字段的情况下，文档才不会被加入到索引中
```

#### 生存时间

```shell
针对日期字段，或者包含日期元素的数组字段，可以使用设定了生存时间的索引，来自动删除字段值超过生存时间的文档

# 查看所有文档
> db.accountsWithIndex.find()
{ "_id" : ObjectId("5ce2b930391c2bc43445f619"), "name" : "alice", "balance" : 50, "currency" : [ "GBP", "USD" ] }
{ "_id" : ObjectId("5ce2b930391c2bc43445f61a"), "name" : "bob", "balance" : 20, "currency" : [ "AUD", "USD" ] }
{ "_id" : ObjectId("5ce2b930391c2bc43445f61b"), "name" : "bob", "balance" : 300, "currency" : [ "CNY" ] }
{ "_id" : ObjectId("5ce2ca60391c2bc43445f61c"), "name" : "charlie", "lastAccess" : ISODate("2019-05-20T15:40:16.455Z") }
{ "_id" : ObjectId("5ce2cf1a391c2bc43445f61e"), "name" : "david", "lastAccess" : ISODate("2019-05-20T16:00:26.033Z") }

# 在 lastAccess 字段上创建一个生存时间是20s的索引
> db.accountsWithIndex.createIndex({ lastAccess: 1 }, { expireAfterSeconds: 20 })
{
	"createdCollectionAutomatically" : false,
	"numIndexesBefore" : 3,
	"numIndexesAfter" : 4,
	"ok" : 1
}

# 查看所有文档
> db.accountsWithIndex.find()
{ "_id" : ObjectId("5ce2b930391c2bc43445f619"), "name" : "alice", "balance" : 50, "currency" : [ "GBP", "USD" ] }
{ "_id" : ObjectId("5ce2b930391c2bc43445f61a"), "name" : "bob", "balance" : 20, "currency" : [ "AUD", "USD" ] }
{ "_id" : ObjectId("5ce2b930391c2bc43445f61b"), "name" : "bob", "balance" : 300, "currency" : [ "CNY" ] }
```

> 注意: <br>
> <br>
> 复合键索引**不具备**生存时间特性<br>
> 当索引键是包含日期元素的数组字段时，数组中**最小**的日期将被用来计算文档是否已经过期<br>
> 数据库使用一个后台线程来监测和删除过期的文档，删除操作可能有一定的延迟<br>

### 查询分析

检查索引的效果

```shell
语法:
db.<collection>.explain().<method(...)>

# 可以使用 explain() 进行分析的命令包括 aggregate(), count(), distinct(), find(), group(), remove(), update()

# 使用没有创建索引的字段进行搜索
> db.accountsWithIndex.explain().find({ balance: 100 })
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.accountsWithIndex",
		"indexFilterSet" : false,
		"parsedQuery" : {
			"balance" : {
				"$eq" : 100
			}
		},
		"winningPlan" : {
			"stage" : "COLLSCAN", #集合扫描(collection scan)
			"filter" : {
				"balance" : {
					"$eq" : 100
				}
			},
			"direction" : "forward"
		},
		"rejectedPlans" : [ ]
	},
	"serverInfo" : {
		"host" : "e48a3580b7f0",
		"port" : 27017,
		"version" : "4.0.9",
		"gitVersion" : "fc525e2d9b0e4bceff5c2201457e564362909765"
	},
	"ok" : 1
}

# 使用已经创建索引的字段进行搜索
> db.accountsWithIndex.explain().find({ name: "alice" })
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.accountsWithIndex",
		"indexFilterSet" : false,
		"parsedQuery" : {
			"name" : {
				"$eq" : "alice"
			}
		},
		"winningPlan" : {
			"stage" : "FETCH",
			"inputStage" : {
				"stage" : "IXSCAN",  # index scan
				"keyPattern" : {
					"name" : 1,
					"balance" : -1
				},
				"indexName" : "name_1_balance_-1",
				"isMultiKey" : false,
				"multiKeyPaths" : {
					"name" : [ ],
					"balance" : [ ]
				},
				"isUnique" : false,
				"isSparse" : false,
				"isPartial" : false,
				"indexVersion" : 2,
				"direction" : "forward",
				"indexBounds" : {
					"name" : [
						"[\"alice\", \"alice\"]"
					],
					"balance" : [
						"[MaxKey, MinKey]"
					]
				}
			}
		},
		"rejectedPlans" : [
			{
				"stage" : "FETCH",
				"inputStage" : {
					"stage" : "IXSCAN",
					"keyPattern" : {
						"name" : 1
					},
					"indexName" : "name_1",
					"isMultiKey" : false,
					"multiKeyPaths" : {
						"name" : [ ]
					},
					"isUnique" : false,
					"isSparse" : false,
					"isPartial" : false,
					"indexVersion" : 2,
					"direction" : "forward",
					"indexBounds" : {
						"name" : [
							"[\"alice\", \"alice\"]"
						]
					}
				}
			}
		]
	},
	"serverInfo" : {
		"host" : "e48a3580b7f0",
		"port" : 27017,
		"version" : "4.0.9",
		"gitVersion" : "fc525e2d9b0e4bceff5c2201457e564362909765"
	},
	"ok" : 1
}

# 仅返回创建索引的字段
> db.accountsWithIndex.explain().find({ name: "alice" }, { _id: 0, name: 1 })
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.accountsWithIndex",
		"indexFilterSet" : false,
		"parsedQuery" : {
			"name" : {
				"$eq" : "alice"
			}
		},
		"winningPlan" : {
			"stage" : "PROJECTION",
			"transformBy" : {
				"_id" : 0,
				"name" : 1
			},
			"inputStage" : {
				"stage" : "IXSCAN",
				"keyPattern" : {
					"name" : 1,
					"balance" : -1
				},
				"indexName" : "name_1_balance_-1",
				"isMultiKey" : false,
				"multiKeyPaths" : {
					"name" : [ ],
					"balance" : [ ]
				},
				"isUnique" : false,
				"isSparse" : false,
				"isPartial" : false,
				"indexVersion" : 2,
				"direction" : "forward",
				"indexBounds" : {
					"name" : [
						"[\"alice\", \"alice\"]"
					],
					"balance" : [
						"[MaxKey, MinKey]"
					]
				}
			}
		},
		"rejectedPlans" : [
			{
				"stage" : "PROJECTION",
				"transformBy" : {
					"_id" : 0,
					"name" : 1
				},
				"inputStage" : {
					"stage" : "IXSCAN",
					"keyPattern" : {
						"name" : 1
					},
					"indexName" : "name_1",
					"isMultiKey" : false,
					"multiKeyPaths" : {
						"name" : [ ]
					},
					"isUnique" : false,
					"isSparse" : false,
					"isPartial" : false,
					"indexVersion" : 2,
					"direction" : "forward",
					"indexBounds" : {
						"name" : [
							"[\"alice\", \"alice\"]"
						]
					}
				}
			}
		]
	},
	"serverInfo" : {
		"host" : "e48a3580b7f0",
		"port" : 27017,
		"version" : "4.0.9",
		"gitVersion" : "fc525e2d9b0e4bceff5c2201457e564362909765"
	},
	"ok" : 1
}

# 使用已经创建索引的字段进行排序
> db.accountsWithIndex.explain().find().sort({ name: 1, balance: -1 })
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.accountsWithIndex",
		"indexFilterSet" : false,
		"parsedQuery" : {

		},
		"winningPlan" : {
			"stage" : "FETCH",
			"inputStage" : {
				"stage" : "IXSCAN",
				"keyPattern" : {
					"name" : 1,
					"balance" : -1
				},
				"indexName" : "name_1_balance_-1",
				"isMultiKey" : false,
				"multiKeyPaths" : {
					"name" : [ ],
					"balance" : [ ]
				},
				"isUnique" : false,
				"isSparse" : false,
				"isPartial" : false,
				"indexVersion" : 2,
				"direction" : "forward",
				"indexBounds" : {
					"name" : [
						"[MinKey, MaxKey]"
					],
					"balance" : [
						"[MaxKey, MinKey]"
					]
				}
			}
		},
		"rejectedPlans" : [ ]
	},
	"serverInfo" : {
		"host" : "e48a3580b7f0",
		"port" : 27017,
		"version" : "4.0.9",
		"gitVersion" : "fc525e2d9b0e4bceff5c2201457e564362909765"
	},
	"ok" : 1
}

# 使用未创建索引的字段进行排序
> db.accountsWithIndex.explain().find().sort({ name: 1, balance: 1 })
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.accountsWithIndex",
		"indexFilterSet" : false,
		"parsedQuery" : {

		},
		"winningPlan" : {
			"stage" : "SORT",
			"sortPattern" : {
				"name" : 1,
				"balance" : 1
			},
			"inputStage" : {
				"stage" : "SORT_KEY_GENERATOR",
				"inputStage" : {
					"stage" : "COLLSCAN",
					"direction" : "forward"
				}
			}
		},
		"rejectedPlans" : [ ]
	},
	"serverInfo" : {
		"host" : "e48a3580b7f0",
		"port" : 27017,
		"version" : "4.0.9",
		"gitVersion" : "fc525e2d9b0e4bceff5c2201457e564362909765"
	},
	"ok" : 1
}
```

### 索引的选择

#### 如何创建一个合适的索引
#### 索引对数据库写入操作的影响