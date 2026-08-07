Title: 计算机图形学笔记——Tilemap中获取点击的瓦片坐标
Date: 2019-10-29
Category: 计算机图形学
Tags: 学习笔记

# Tilemap中获取点击的瓦片坐标

[TOC]

## 原理

通过摄像机和屏幕空间中的点画一条射线，该射线与Tilemap相交的点可以认为是点击到的点。我们将其转换为一个数学问题，如图：

![1572354170288](.\1572354170288.png)

$C$为射线的起点，$\vec m$为射线的单位向量，$O$为平面上的一个点，$\vec n$为平面的单位法向量，求射线与平面的交点$P$。

推导过程：
$$
\vec {CP} = d \ast \vec m \tag 1
$$


因为$\vec n$为平面法向量，有：
$$
\vec {OP} \cdot \vec n = 0 \tag 2
$$


其中：    
$$
\vec {OP} = \vec {OC} + \vec {CP} \tag 3
$$


结合上面三个等式可推导:
$$
(\vec {OC} + \vec {CP})\cdot \vec n = 0  \\
\vec {OC} \cdot \vec n + \vec {CP} \cdot \vec n = 0\\
\vec {OC} \cdot \vec n + d \ast \vec m \cdot \vec n = 0\\
d = - \frac{\vec {OC} \cdot \vec n}{\vec m \cdot \vec n}
$$
可得：
$$
P = \vec {OP} + O = \vec {OC} + \vec {CP} + O= \vec {OC} + d \ast \vec m  + O= C -\frac{\vec {OC} \cdot \vec n}{\vec m \cdot \vec n} \cdot \vec m
$$
或：
$$
P = \vec {CP} + C = d \ast \vec m + C = C -\frac{\vec {OC} \cdot \vec n}{\vec m \cdot \vec n} \cdot \vec m
$$


## 代码

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TestTileMap : MonoBehaviour
{
    public Camera renderCamera;
    public GameObject zero;

    //tileMap的法向量
    public Vector3 tileMapNormal;

    private Grid _grid = null;

    //tilemap上某个点的世界坐标, 设为O点
    private Vector3 _O;
    private Vector3 _C;
    private Vector3 _n; //tilemap的法向量

    private void Start()
    {
        _grid = GetComponent<Grid>();       
    }

    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            //O点使用tilemap的世界坐标
            _O = transform.position;
            Debug.Log("O: " + _O);

            //C点为摄像机
            _C = renderCamera.transform.position;
            Debug.Log("C: " + _C);

            //手动设置的法向量
            _n = tileMapNormal;
            Debug.Log("n: " + _n);

            Vector3 nearClipScreenPos = new Vector3(Input.mousePosition.x, Input.mousePosition.y, renderCamera.nearClipPlane);
            Vector3 nearClipWorldPos = Camera.main.ScreenToWorldPoint(nearClipScreenPos);

            //摄像机到点击位置的射线
            Vector3 m = (nearClipWorldPos - _C).normalized;
            Debug.Log("m: " + m);

            //向量OC
            Vector3 oc = _C - _O;
            Debug.Log("oc: " + oc);

            float d = Vector3.Dot(oc, _n) / Vector3.Dot(m, _n);
            Debug.Log("d: " + d);

            //向量OP
            Vector3 op = oc - d * m;
            Debug.Log("op: " + op);

            //P点
            Vector3 p = _O + op;
            Debug.Log("p: " + p);

            // 将世界坐标转换为瓦片坐标
            Vector3Int cellPos = _grid.WorldToCell(p);
            Debug.Log("cellPos:" + cellPos);
        }
    }
}

```



