Title: PlayerLoop简要流程
Date: 2020-04-30
Category: 源码
Tags: Unity



[TOC]

## PlayerLoop简介

PlayerLoop是Unity的主循环，每帧都会跑一次。Unity 2018添加了PlayerLoop相关的API, 我们可以利用如下代码来查看一个PlayerLoop干了那些事：

```csharp
var playerLoop = PlayerLoop.GetDefaultPlayerLoop();
foreach (var header in playerLoop.subSystemList)
{
    Debug.LogFormat("------{0}------", header.type.Name);
    foreach (var subSystem in header.subSystemList)
    {
        Debug.LogFormat("{0}.{1}", header.type.Name, subSystem.type.Name);
    }
}
```

会得到一长串的东西：

```
------Initialization------
Initialization.PlayerUpdateTime
Initialization.AsyncUploadTimeSlicedUpdate
Initialization.SynchronizeInputs
Initialization.SynchronizeState
Initialization.XREarlyUpdate
------EarlyUpdate------
EarlyUpdate.PollPlayerConnection
//...略
------FixedUpdate------
FixedUpdate.ClearLines
//...略
------PreUpdate------
//...略
------Update------
//...略
------PreLateUpdate------
//...略
------PostLateUpdate------
//...略
```

在源码中，PlayerLoop的的入口为`PlayerLoop`函数。

## ReentrancyChecker

```cpp
ReentrancyChecker checker(&s_InsidePlayerLoop);
if (!checker.IsOK())
{
	//...
}
```

相当于判断`s_InsidePlayerLoop`标志位的一个工具类，基本逻辑：

1. `s_InsidePlayerLoop == false` 则 `IsOk`返回`true`, 并把 ``s_InsidePlayerLoop `置为`true`
2. `s_InsidePlayerLoop == false` 则 `IsOk`返回`false`

主要用来防止PlayerLoop出现递归情况。

## IsWorldPlaying

这个函数用来判断当前是否是在运行状态。

## s_defaultLoop

初始化：

```cpp
static void InitDefaultPlayerLoop()
{
    //...
   s_defaultLoop.resize_initialized(1 + 
                (PlayerLoopCallbacks::PLAYER_LOOP_Initialization_COUNT + 1) +
                (PlayerLoopCallbacks::PLAYER_LOOP_EarlyUpdate_COUNT + 1) + 
                (PlayerLoopCallbacks::PLAYER_LOOP_FixedUpdate_COUNT + 1) +
                (PlayerLoopCallbacks::PLAYER_LOOP_PreUpdate_COUNT + 1) + 
                (PlayerLoopCallbacks::PLAYER_LOOP_Update_COUNT + 1) +
                (PlayerLoopCallbacks::PLAYER_LOOP_PreLateUpdate_COUNT + 1) + 
                (PlayerLoopCallbacks::PLAYER_LOOP_PostLateUpdate_COUNT + 1));
    UpdateDefaultPlayerLoop();
    s_currentLoop = s_defaultLoop.data();
    //...
}
```

大致意思就是初始化这么多的回调，每个回调对应的是`CoreScriptingClasses`中的相应函数。

## PlayerLoopSystem组织方式

所有的PlayerLoopSystem保存在`s_currentLoop`中，它内部是一个`NativePlayerLoopSystem`的数组，大致如下：

![1588249654028](./1588249654028.png)

- 列表头记录了所有PlayerLoopSystem的个数

- 每一个PlayerLoopSystem和它的subSystem存在一片连续的区域

- PlayerLoopSystem有它的处理逻辑(updateFunction)，并记录了它的subSystem的个数

- subSystem中只有处理逻辑


## PlayerLoopSystem的处理函数
定义于`PlayerLoopCallbacks.h`：

```cpp
UpdateFunc* RegisteredInitializationFunctions[PLAYER_LOOP_Initialization_COUNT];
UpdateFunc* RegisteredEarlyUpdateFunctions[PLAYER_LOOP_EarlyUpdate_COUNT];
UpdateFunc* RegisteredFixedUpdateFunctions[PLAYER_LOOP_FixedUpdate_COUNT];
UpdateFunc* RegisteredPreUpdateFunctions[PLAYER_LOOP_PreUpdate_COUNT];
UpdateFunc* RegisteredUpdateFunctions[PLAYER_LOOP_Update_COUNT];
UpdateFunc* RegisteredPreLateUpdateFunctions[PLAYER_LOOP_PreLateUpdate_COUNT];
UpdateFunc* RegisteredPostLateUpdateFunctions[PLAYER_LOOP_PostLateUpdate_COUNT];
```

具体回调函数通过宏`REGISTER_PLAYERLOOP_CALL`来注册，例如`Player.cpp`中：

```cpp
void InitPlayerLoopCallbacks()
{
    REGISTER_PLAYERLOOP_CALL(Initialization, AsyncUploadTimeSlicedUpdate,
    {
        GetAsyncUploadManager().TimeSlicedUpdate(); //真正的处理函数
    });
    ...
}
```

或者`ClusterInputModuleRegistration.cpp`中：

```cpp
void InitClusterInput()
{
	...
    REGISTER_PLAYERLOOP_CALL(Initialization, SynchronizeInputs, GetClusterInputModule()->Update());
}
```



  

## ExecutePlayerLoop

首先判断本个NativePlayerLoopSystem要不要再当前帧执行：

```cpp
while (!system->loopConditionFunction || system->loopConditionFunction())
{...}
```

例如FixedUpdateCondition就限制了只有在与上次执行相隔大于一定时间才可以执行。

```cpp
//如果有系统的处理函数
if (childSystem->updateFunction)
{
    if (*childSystem->updateFunction)
        (*childSystem->updateFunction)(); //Start，Update之类的就是从这里进来的
}
//再看是不是通过SetPlayerLoop设置了用户自定义的处理
else if (!childSystem->delegateInvokeMethod.IsNull())
{
    //...
}
//执行下一个PlayerLoopSystem
else
{
    // Execute all the child systems children recursivly and skip them in this loop
    ExecutePlayerLoop(childSystem);
    childSystemIndex += childSystem->numSubSystems;
    childSystem += childSystem->numSubSystems;
}
```

使用如下代码可以在系统的update前加入我们自己的些处理：

```csharp
[RuntimeInitializeOnLoadMethod]
static void OnRuntimeMethodLoad()
{
    PlayerLoopSystem hackSystem = new PlayerLoopSystem()
    {
        type = typeof(MyUpdateHacker),
        updateDelegate = () => 
        {
            Debug.Log("=========hi, I'm hacking");
        },
    };

    PlayerLoopSystem playerLoop = PlayerLoop.GetDefaultPlayerLoop();
    PlayerLoopSystem updateSystem = playerLoop.subSystemList[4];
    List<PlayerLoopSystem> subSystem = new List<PlayerLoopSystem>(updateSystem.subSystemList);
    subSystem.Insert(0, hackSystem);
    playerLoop.subSystemList[4].subSystemList = subSystem.ToArray();
    PlayerLoop.SetPlayerLoop(playerLoop);

}

public struct MyUpdateHacker { }
```



