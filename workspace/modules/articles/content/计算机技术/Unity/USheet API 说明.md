Title: USheet API说明
Date: 2018-04-02
Category: 编程语言
Tags: Unity

# USheet API 说明


[TOC]

**最新源码：** https://github.com/shazi129/USheet.git

**名字空间：USheet**

**注意：**如果需要使修改后的数据落地，需要调用`EditorUtility.SetDirty(sheetData);`

## 查询相关

###  根据表的内容查找行号
`int indexOf<T>(string title, T value, int startIndex = 0)`

**参数：**
**title: ** 索引列的表头
**Value:** 索引列的值
**startIndex:**查找的起始行号

**返回：** 从0开始的行号

###查找某个单元格的内容
`IGridData getValue<T>(string keyName, T keyValue, string title, int index = 0)`

**参数：**
**keyName: ** 索引列的表头
**keyValue:** 索引列的值
**title:**单元格所在的列表头
**index :**查找的起始行号

**返回：** 单元格内容结构体，没查到返回null

###查找所有符合条件的行
`List<Dictionary<string, IGridData>> getRows<T>(string keyName, T keyValue)`
**参数：**
**keyName: ** 索引列的表头
**keyValue:** 索引列的值

**返回：** 所有的行内容，没查到返回null。其中`Dictionary<string, IGridData>`代表一行的内容，key为列名， IGridData为数据

###根据行号获取行内容
`Dictionary<string, IGridData> getRow(int index)`
**参数：**
**index: ** 行号
**返回：** 所有的行内容，没查到返回null。在返回的Dictionary中，key为列名， IGridData为数据

##删除相关

###删除一列
`void deleteColumn(string columnName)`
**参数：**
**columnName: ** 列名
###删除一行
`void deleteRow(int index = -1)`
**参数：**
**index : **行号，小于0时删除最后一行
##修改相关
###修改单元格数据
`void modify(string title, int rowIndex, IGridData iData)`
**参数：**
**title: ** 列名
**rowIndex: ** 行号
**iData:**需要修改成的数据

###修改列名
`void modifyColumnName(string oldName, string newName)`
**参数：**
**oldName: ** 要修改的列名
**newName: ** 新的列名
